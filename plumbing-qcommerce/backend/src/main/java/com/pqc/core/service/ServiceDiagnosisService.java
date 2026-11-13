package com.pqc.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.node.DecimalNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.pqc.core.config.Phase2Properties;
import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Service @RequiredArgsConstructor
public class ServiceDiagnosisService {
    private final ServiceOrderRepository orders; private final ServiceDiagnosisRepository diagnoses;
    private final ServiceDiagnosisEvidenceRepository evidence; private final ServiceOrderPhotoRepository photos;
    private final ServiceQuoteRepository quotes; private final Phase2EnrollmentRepository enrollments;
    private final Phase2Properties properties; private final Phase2IdempotencyService idempotency;
    private final ServiceQuoteEventService events; private final CurrentUser currentUser;
    private final ServiceQuoteMaterialLinkRepository materialLinks;
    private final ServiceOrderPhotoService photoService; private ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule())
            .configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY,true).configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS,true);

    @Transactional
    public PlumberDiagnosisResponse create(Long orderId, DiagnosisDraftRequest request, String key) {
        User actor = requirePlumber(); String fp = fingerprint("create", request);
        var claim = idempotency.begin(actor.getId(), "CREATE_DIAGNOSIS", "SERVICE_ORDER", orderId, requiredKey(key), fp);
        if (claim.getStatus() == Phase2IdempotencyStatus.COMPLETED) return replay(claim.getResponsePayload());
        ServiceOrder order = orders.findByIdForUpdate(orderId).orElseThrow(() -> notFound("Service order not found"));
        requireAssigned(order, actor); requireEligible(order);
        Phase2Enrollment enrollment = enrollments.findByServiceOrderIdForUpdate(orderId).orElse(null);
        if (enrollment == null) {
            if (!properties.isEnabled()) throw conflict("Phase 2 diagnosis is disabled");
            enrollment = enrollments.saveAndFlush(Phase2Enrollment.builder().serviceOrderId(orderId).enabledSnapshot(true).policySnapshot("phase2DiagnosisQuotes.enabled=true").build());
        }
        var existing = diagnoses.findCurrent(orderId, Set.of(DiagnosisState.DRAFT));
        if (!existing.isEmpty()) { var out=toPlumber(existing.get(0)); idempotency.complete(claim.getId(), json(out)); return out; }
        if (!diagnoses.findCurrent(orderId, Set.of(DiagnosisState.SUBMITTED)).isEmpty()) throw conflict("A submitted diagnosis already exists; use the revision flow");
        int version = nextVersion(orderId); ServiceDiagnosis diagnosis = apply(diagnoses.save(ServiceDiagnosis.builder().serviceOrder(order).plumber(actor).state(DiagnosisState.DRAFT).versionNumber(version).legacyVersion(version).summary(request.diagnosisNarrative()).build()), request);
        diagnosis = diagnoses.saveAndFlush(diagnosis); var out=toPlumber(diagnosis);
        emit(diagnosis, "DIAGNOSIS_CREATED", null, DiagnosisState.DRAFT, claim.getId()); idempotency.complete(claim.getId(), json(out)); return out;
    }

    @Transactional public PlumberDiagnosisResponse update(Long orderId, Long diagnosisId, DiagnosisDraftUpdateRequest request, String key) {
        User actor=requirePlumber(); var claim=idempotency.begin(actor.getId(), "UPDATE_DIAGNOSIS", "DIAGNOSIS", diagnosisId, requiredKey(key), fingerprint("update", request));
        if (claim.getStatus()==Phase2IdempotencyStatus.COMPLETED) return replay(claim.getResponsePayload());
        ServiceOrder order=orders.findByIdForUpdate(orderId).orElseThrow(()->notFound("Service order not found")); requireAssigned(order,actor);
        ServiceDiagnosis d=diagnosisForUpdate(diagnosisId, orderId); if(d.getState()!=DiagnosisState.DRAFT) throw conflict("Diagnosis is immutable");
        if(request.expectedVersion()!=null && !Objects.equals(request.expectedVersion(), d.getOptimisticVersion())) throw conflict("Diagnosis was modified");
        apply(d, request); d=diagnoses.saveAndFlush(d); var out=toPlumber(d); emit(d,"DIAGNOSIS_UPDATED",DiagnosisState.DRAFT,DiagnosisState.DRAFT,claim.getId()); idempotency.complete(claim.getId(),json(out)); return out;
    }

    @Transactional public DiagnosisEvidenceResponse linkEvidence(Long orderId, Long diagnosisId, MultipartFile file, String key) {
        User actor=requirePlumber(); var claim=idempotency.begin(actor.getId(),"LINK_DIAGNOSIS_EVIDENCE","DIAGNOSIS",diagnosisId,requiredKey(key),fileFingerprint(file));
        if(claim.getStatus()==Phase2IdempotencyStatus.COMPLETED)return replayEvidence(claim.getResponsePayload());
        ServiceOrder order=orders.findByIdForUpdate(orderId).orElseThrow(()->notFound("Service order not found")); requireAssigned(order,actor);
        ServiceDiagnosis d=diagnosisForUpdate(diagnosisId,orderId); if(d.getState()!=DiagnosisState.DRAFT) throw conflict("Diagnosis evidence is immutable");
        var photo=photoService.uploadDiagnosis(orderId,file); if(evidence.existsByDiagnosisIdAndPhotoId(diagnosisId,photo.id())) throw conflict("Evidence is already linked");
        ServiceOrderPhoto entity=photos.findById(photo.id()).orElseThrow(); var out=DiagnosisEvidenceResponse.from(evidence.saveAndFlush(ServiceDiagnosisEvidence.builder().diagnosis(d).photo(entity).evidenceRole("DIAGNOSIS").build())); idempotency.complete(claim.getId(),json(out)); return out;
    }

    @Transactional public PlumberDiagnosisResponse submit(Long orderId,Long diagnosisId,String key) {
        User actor=requirePlumber(); var claim=idempotency.begin(actor.getId(),"SUBMIT_DIAGNOSIS","DIAGNOSIS",diagnosisId,requiredKey(key),"submit:"+diagnosisId);
        if(claim.getStatus()==Phase2IdempotencyStatus.COMPLETED)return replay(claim.getResponsePayload());
        ServiceOrder order=orders.findByIdForUpdate(orderId).orElseThrow(()->notFound("Service order not found")); requireAssigned(order,actor); ServiceDiagnosis d=diagnosisForUpdate(diagnosisId,orderId);
        if(d.getState()!=DiagnosisState.DRAFT)throw conflict("Diagnosis is not a draft"); validateRequired(d); if(evidence.findByDiagnosisIdOrderByCreatedAtAsc(diagnosisId).isEmpty())throw bad("At least one diagnosis evidence photo is required");
        if (d.getRevisionOfDiagnosis() != null) {
            ServiceDiagnosis prior = diagnoses.findByIdForUpdate(d.getRevisionOfDiagnosis().getId()).orElseThrow(() -> notFound("Prior diagnosis not found"));
            if (prior.getState() != DiagnosisState.SUBMITTED) throw conflict("Only a submitted diagnosis may be superseded");
            prior.setState(DiagnosisState.SUPERSEDED); diagnoses.saveAndFlush(prior);
            emit(prior,"DIAGNOSIS_SUPERSEDED",DiagnosisState.SUBMITTED,DiagnosisState.SUPERSEDED,claim.getId());
        }
        d.setState(DiagnosisState.SUBMITTED); d.setSubmittedAt(LocalDateTime.now()); d=diagnoses.saveAndFlush(d);
        if(!quotes.existsByServiceOrderIdAndQuoteKind(orderId,QuoteKind.INITIAL)) quotes.saveAndFlush(ServiceQuote.builder().serviceOrder(order).diagnosis(d).quoteKind(QuoteKind.INITIAL).version(1).state(QuoteState.DRAFT).amount(java.math.BigDecimal.ZERO).laborSubtotal(java.math.BigDecimal.ZERO).knownMaterialSubtotal(java.math.BigDecimal.ZERO).currency("INR").build());
        emit(d,"DIAGNOSIS_SUBMITTED",DiagnosisState.DRAFT,DiagnosisState.SUBMITTED,claim.getId()); var out=toPlumber(d); idempotency.complete(claim.getId(),json(out)); return out;
    }

      @Transactional public PlumberDiagnosisResponse createRevision(Long orderId, Long diagnosisId, DiagnosisDraftRequest request, String key) { User actor=requirePlumber(); var claim=idempotency.begin(actor.getId(),"CREATE_DIAGNOSIS_REVISION","DIAGNOSIS",diagnosisId,requiredKey(key),fingerprint("revision",request)); if(claim.getStatus()==Phase2IdempotencyStatus.COMPLETED)return replay(claim.getResponsePayload()); ServiceOrder order=orders.findByIdForUpdate(orderId).orElseThrow(()->notFound("Service order not found")); requireAssigned(order,actor); ServiceDiagnosis prior=diagnosisForUpdate(diagnosisId,orderId); if(prior.getState()!=DiagnosisState.SUBMITTED||diagnoses.findRevisionOf(diagnosisId).isPresent())throw conflict("Diagnosis cannot be revised"); int version=nextVersion(orderId); ServiceDiagnosis replacement=apply(diagnoses.save(ServiceDiagnosis.builder().serviceOrder(order).plumber(actor).state(DiagnosisState.DRAFT).versionNumber(version).legacyVersion(version).revisionOfDiagnosis(prior).summary(request.diagnosisNarrative()).build()),request); replacement=diagnoses.saveAndFlush(replacement); var out=toPlumber(replacement);idempotency.complete(claim.getId(),json(out));return out; }
        @Transactional public PlumberDiagnosisResponse cancel(Long orderId, Long diagnosisId, String key) { User actor=currentUser.require(); if(!isOperator(actor))throw new AccessDeniedException("Operations access required"); var claim=idempotency.begin(actor.getId(),"CANCEL_DIAGNOSIS","DIAGNOSIS",diagnosisId,requiredKey(key),"cancel:"+diagnosisId); if(claim.getStatus()==Phase2IdempotencyStatus.COMPLETED)return replay(claim.getResponsePayload()); orders.findByIdForUpdate(orderId).orElseThrow(()->notFound("Service order not found")); ServiceDiagnosis d=diagnosisForUpdate(diagnosisId,orderId); if(d.getState()!=DiagnosisState.DRAFT)throw conflict("Only a draft diagnosis may be cancelled"); DiagnosisState from=d.getState();d.setState(DiagnosisState.CANCELLED);d.setCancelledAt(LocalDateTime.now());d=diagnoses.saveAndFlush(d);cancelOpenQuotes(orderId, actor);emit(d,"DIAGNOSIS_CANCELLED",from,DiagnosisState.CANCELLED,claim.getId());var out=toPlumber(d);idempotency.complete(claim.getId(),json(out));return out; }
    @Transactional(readOnly=true) public PlumberDiagnosisResponse plumberRead(Long orderId){User a=requirePlumber();ServiceOrder o=orders.findById(orderId).orElseThrow(()->notFound("Service order not found"));requireAssigned(o,a);return current(orderId).map(this::toPlumber).orElseThrow(()->notFound("Diagnosis not found"));}
    @Transactional(readOnly=true) public CustomerDiagnosisResponse customerRead(Long orderId){User a=currentUser.require();ServiceOrder o=orders.findById(orderId).orElseThrow(()->notFound("Service order not found"));if(a.getRole()!=Role.CUSTOMER||o.getCustomer()==null||!o.getCustomer().getId().equals(a.getId()))throw new AccessDeniedException("Not authorized");return diagnoses.findCurrent(orderId,Set.of(DiagnosisState.SUBMITTED)).stream().findFirst().map(this::toCustomer).orElseThrow(()->notFound("Diagnosis not found"));}
    @Transactional(readOnly=true) public List<AdminDiagnosisResponse> adminHistory(Long orderId){User a=currentUser.require();if(!isOperator(a))throw new AccessDeniedException("Operations access required");orders.findById(orderId).orElseThrow(()->notFound("Service order not found"));return diagnoses.findHistory(orderId).stream().map(d->AdminDiagnosisResponse.from(d,evidence.findWithPhoto(d.getId()).stream().map(DiagnosisEvidenceResponse::from).toList())).toList();}
      @Transactional public void cancelOpenForOrder(Long orderId, User actor) { var open=diagnoses.findOpenForUpdate(orderId,Set.of(DiagnosisState.DRAFT,DiagnosisState.SUBMITTED)); for(ServiceDiagnosis d:open){DiagnosisState from=d.getState();d.setState(DiagnosisState.CANCELLED);d.setCancelledAt(LocalDateTime.now());d=diagnoses.saveAndFlush(d);emit(d,"DIAGNOSIS_CANCELLED",from,DiagnosisState.CANCELLED,null);} cancelOpenQuotes(orderId, actor); if(!open.isEmpty()) events.record(ServiceQuoteEvent.builder().serviceOrderId(orderId).aggregateType("SERVICE_ORDER").aggregateId(orderId).transitionKey("PHASE2_CANCELLED").eventType("PHASE2_CANCELLED").actorId(actor.getId()).actorRole(actor.getRole().name()).build(),"phase2.cancellation","PHASE2_CANCELLED"); }
      private void cancelOpenQuotes(Long orderId, User actor) {
        quotes.findByServiceOrderIdOrderByVersionDesc(orderId).stream()
                .filter(q -> q.getQuoteKind() != QuoteKind.MATERIAL_ADDENDUM && (q.getState() == QuoteState.DRAFT || q.getState() == QuoteState.PUBLISHED))
                .forEach(q -> { q.setState(QuoteState.CANCELLED); quotes.saveAndFlush(q); });
        for (ServiceQuote addendum : quotes.findByServiceOrderIdAndQuoteKindOrderByVersionDesc(orderId, QuoteKind.MATERIAL_ADDENDUM)) {
            if (addendum.getState() != QuoteState.DRAFT && addendum.getState() != QuoteState.PUBLISHED) continue;
            QuoteState from = addendum.getState(); addendum.setState(QuoteState.CANCELLED); quotes.saveAndFlush(addendum);
            events.recordAuditOnly(ServiceQuoteEvent.builder().serviceOrderId(orderId).diagnosisId(addendum.getDiagnosis() == null ? null : addendum.getDiagnosis().getId())
                    .quoteId(addendum.getId()).aggregateType("QUOTE").aggregateId(addendum.getId()).transitionKey("ADDENDUM_CANCELLED")
                    .eventType("ADDENDUM_CANCELLED").fromState(from.name()).toState(QuoteState.CANCELLED.name())
                    .actorId(actor == null ? null : actor.getId()).actorRole(actor == null ? null : actor.getRole().name())
                    .reason("service order cancellation").build());
            materialLinks.transitionByQuoteAndStates(addendum.getId(), List.of(MaterialAuthorizationState.PENDING), MaterialAuthorizationState.CANCELLED);
        }
      }
    private Optional<ServiceDiagnosis> current(Long id){return diagnoses.findCurrent(id,Set.of(DiagnosisState.DRAFT,DiagnosisState.SUBMITTED)).stream().findFirst();}
    private ServiceDiagnosis diagnosisForUpdate(Long id,Long order){ServiceDiagnosis d=diagnoses.findByIdForUpdate(id).orElseThrow(()->notFound("Diagnosis not found"));if(!d.getServiceOrder().getId().equals(order))throw notFound("Diagnosis not found");return d;}
    private int nextVersion(Long order){return diagnoses.findByServiceOrderId(order).stream().mapToInt(ServiceDiagnosis::getVersionNumber).max().orElse(0)+1;}
    private void requireEligible(ServiceOrder o){if(o.getStatus()!=OrderStatus.IN_PROGRESS)throw conflict("Diagnosis requires an in-progress order");if(o.getArrivedAt()==null)throw conflict("Diagnosis requires arrival");}
    private User requirePlumber(){User u=currentUser.require();if(u.getRole()!=Role.PLUMBER)throw new AccessDeniedException("Plumber access required");return u;}
    private void requireAssigned(ServiceOrder o,User u){if(o.getPlumber()==null||!o.getPlumber().getId().equals(u.getId()))throw new AccessDeniedException("Only the assigned plumber can access diagnosis");}
    private boolean isOperator(User u){return u.getRole()==Role.ADMIN||u.getRole()==Role.SUPER_ADMIN||u.getRole()==Role.OPERATIONS_ADMIN;}
    private void validateRequired(ServiceDiagnosis d){if(d.getAffectedComponent()==null||d.getObservedCondition()==null||d.getDiagnosisNarrative()==null||d.getRecommendedRemedy()==null||d.getEstimatedLaborUnits()==null)throw bad("Required diagnosis fields are missing");}
    private ServiceDiagnosis apply(ServiceDiagnosis d,DiagnosisDraftRequest r){d.setAffectedComponent(r.affectedComponent());d.setObservedCondition(r.observedCondition());d.setDiagnosisNarrative(r.diagnosisNarrative());d.setRecommendedRemedy(r.recommendedRemedy());d.setEstimatedLaborUnits(r.estimatedLaborUnits());d.setKnownMaterialCandidates(r.knownMaterialCandidates());d.setSafetyNotes(r.safetyNotes());d.setSafetyBlocked(r.safetyBlocked());d.setSummary(r.diagnosisNarrative());return d;}
    private ServiceDiagnosis apply(ServiceDiagnosis d,DiagnosisDraftUpdateRequest r){return apply(d,new DiagnosisDraftRequest(r.affectedComponent(),r.observedCondition(),r.diagnosisNarrative(),r.recommendedRemedy(),r.estimatedLaborUnits(),r.knownMaterialCandidates(),r.safetyNotes(),r.safetyBlocked()));}
    private PlumberDiagnosisResponse toPlumber(ServiceDiagnosis d){return PlumberDiagnosisResponse.from(d,evidence.findWithPhoto(d.getId()).stream().map(DiagnosisEvidenceResponse::from).toList());}
    private CustomerDiagnosisResponse toCustomer(ServiceDiagnosis d){return CustomerDiagnosisResponse.from(d,evidence.findWithPhoto(d.getId()).stream().map(DiagnosisEvidenceResponse::from).toList());}
    private void emit(ServiceDiagnosis d,String type,DiagnosisState from,DiagnosisState to,Long idem){events.record(ServiceQuoteEvent.builder().serviceOrderId(d.getServiceOrder().getId()).diagnosisId(d.getId()).aggregateType("DIAGNOSIS").aggregateId(d.getId()).transitionKey(type+":"+d.getId()+":"+d.getOptimisticVersion()).eventType(type).fromState(from==null?null:from.name()).toState(to.name()).actorId(d.getPlumber().getId()).actorRole(Role.PLUMBER.name()).idempotencyKeyId(idem).build(),"phase2.diagnosis",type);}
    private String requiredKey(String k){if(k==null||k.isBlank())throw bad("Idempotency-Key is required");return k;}
    private String fingerprint(String op,Object value){try{return digestFingerprint(op,mapper.valueToTree(value));}catch(Exception e){throw bad("Invalid request");}}
    private String fileFingerprint(MultipartFile file){try{ObjectNode content=mapper.createObjectNode().put("contentType",file.getContentType()).put("size",file.getSize()).put("contentSha256",sha256Hex(file.getBytes()));return digestFingerprint("evidence",content);}catch(Exception e){throw bad("Invalid request");}}
    private String digestFingerprint(String op,JsonNode content)throws Exception{return "sha256:"+sha256Hex((op+":"+mapper.writeValueAsString(canonicalize(content))).getBytes(StandardCharsets.UTF_8));}
    private JsonNode canonicalize(JsonNode node){
        if(node.isObject()){
            ObjectNode sorted=mapper.createObjectNode();
            List<String> names=new ArrayList<>();node.fieldNames().forEachRemaining(names::add);Collections.sort(names);
            for(String name:names)sorted.set(name,canonicalize(node.get(name)));
            return sorted;
        }
        if(node.isArray()){
            var sorted=mapper.createArrayNode();node.forEach(value->sorted.add(canonicalize(value)));
            return sorted;
        }
        if(node.isBigDecimal()){
            BigDecimal normalized=node.decimalValue().stripTrailingZeros();
            return DecimalNode.valueOf(normalized.signum()==0?BigDecimal.ZERO:normalized);
        }
        return node.deepCopy();
    }
    private String sha256Hex(byte[] content){
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));}
        catch(NoSuchAlgorithmException e){throw new IllegalStateException("SHA-256 is unavailable",e);}
    }
    private String json(Object o){try{return mapper.writeValueAsString(o);}catch(Exception e){throw new IllegalStateException(e);}}
    private <T> T replay(String s){try{return (T)mapper.readValue(s,PlumberDiagnosisResponse.class);}catch(Exception e){throw new IllegalStateException(e);}}
    private DiagnosisEvidenceResponse replayEvidence(String s){try{return mapper.readValue(s,DiagnosisEvidenceResponse.class);}catch(Exception e){throw new IllegalStateException(e);}}
    private ResponseStatusException bad(String m){return new ResponseStatusException(HttpStatus.BAD_REQUEST,m);} private ResponseStatusException conflict(String m){return new ResponseStatusException(HttpStatus.CONFLICT,m);} private ResponseStatusException notFound(String m){return new ResponseStatusException(HttpStatus.NOT_FOUND,m);}
}
