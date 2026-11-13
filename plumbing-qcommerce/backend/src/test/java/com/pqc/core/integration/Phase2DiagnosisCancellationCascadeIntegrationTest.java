package com.pqc.core.integration;

import com.pqc.core.dto.*;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.service.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class Phase2DiagnosisCancellationCascadeIntegrationTest {
    private static final String URL=com.pqc.core.testsupport.PostgresTestTargetGuard.requireUrl();
    private static final String USER=com.pqc.core.testsupport.PostgresTestTargetGuard.requireUsername();
    private static final String PASSWORD=com.pqc.core.testsupport.PostgresTestTargetGuard.requirePassword();
    private static final String SCHEMA="phase2_cancel_"+UUID.randomUUID().toString().replace("-","");
    @DynamicPropertySource static void postgres(DynamicPropertyRegistry r){JdbcTemplate a=new JdbcTemplate(new DriverManagerDataSource(URL,USER,PASSWORD));a.execute("CREATE SCHEMA "+SCHEMA);Flyway.configure().dataSource(URL,USER,PASSWORD).schemas(SCHEMA).defaultSchema(SCHEMA).locations("classpath:db/migration").load().migrate();r.add("spring.datasource.url",()->URL+(URL.contains("?")?"&":"?")+"currentSchema="+SCHEMA);r.add("spring.datasource.username",()->USER);r.add("spring.datasource.password",()->PASSWORD);r.add("spring.datasource.driver-class-name",()->"org.postgresql.Driver");r.add("spring.jpa.hibernate.ddl-auto",()->"none");r.add("spring.jpa.properties.hibernate.dialect",()->"org.hibernate.dialect.PostgreSQLDialect");r.add("spring.flyway.enabled",()->false);r.add("phase2-diagnosis-quotes.enabled",()->true);r.add("app.photos.storage-dir",()->"target/phase2-cancel-photos");}
    @Autowired ServiceDiagnosisService diagnosis; @Autowired ServiceOrderService orderService; @Autowired UserRepository users; @Autowired ServiceOrderRepository orders; @Autowired ServiceDiagnosisRepository diagnoses; @Autowired ServiceQuoteEventRepository events; @Autowired OutboxEventRepository outbox; @Autowired ServiceOrderStatusHistoryRepository history;
    @AfterEach void clear(){SecurityContextHolder.clearContext();}

    @Test void draftCascadeAndRetryPreserveHistoryAndCardinality(){Fixture f=fixture(); ServiceDiagnosis d=create(f); as(f.operations,()->orderService.cancelOrder(f.order.getId(),"test cancellation")); assertThat(orders.findById(f.order.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.CANCELLED); assertThat(diagnoses.findById(d.getId()).orElseThrow().getState()).isEqualTo(DiagnosisState.CANCELLED); assertCounts(d.getId(),"DIAGNOSIS_CANCELLED",1); assertThat(history.findByServiceOrderIdOrderByCreatedAtAsc(f.order.getId())).hasSize(1); as(f.operations,()->orderService.cancelOrder(f.order.getId(),"retry cancellation")); assertCounts(d.getId(),"DIAGNOSIS_CANCELLED",1); assertThat(diagnoses.findById(d.getId()).orElseThrow().getDiagnosisNarrative()).isEqualTo("cascade"); assertThat(history.findByServiceOrderIdOrderByCreatedAtAsc(f.order.getId())).hasSize(2);}

    @Test void submittedCascadeIsCancelled(){Fixture f=fixture(); ServiceDiagnosis submitted=create(f); as(f.plumber,()->diagnosis.linkEvidence(f.order.getId(),submitted.getId(),new MockMultipartFile("file","x.jpg","image/jpeg",new byte[]{1}),"ev")); as(f.plumber,()->diagnosis.submit(f.order.getId(),submitted.getId(),"submit")); as(f.operations,()->orderService.cancelOrder(f.order.getId(),"cancel submitted")); assertThat(diagnoses.findById(submitted.getId()).orElseThrow().getState()).isEqualTo(DiagnosisState.CANCELLED); assertCounts(submitted.getId(),"DIAGNOSIS_CANCELLED",1);}

    @Test void operationsCanCancelDraft(){Fixture f=fixture();ServiceDiagnosis d=create(f);as(f.operations,()->diagnosis.cancel(f.order.getId(),d.getId(),"ops"));assertThat(diagnoses.findById(d.getId()).orElseThrow().getState()).isEqualTo(DiagnosisState.CANCELLED);assertCounts(d.getId(),"DIAGNOSIS_CANCELLED",1);}
    @Test void plumberAndCustomerCannotCancel(){Fixture f=fixture();ServiceDiagnosis d=create(f);assertDenied(f.plumber,f.order,d);assertDenied(f.customer,f.order,d);assertThat(diagnoses.findById(d.getId()).orElseThrow().getState()).isEqualTo(DiagnosisState.DRAFT);assertCounts(d.getId(),"DIAGNOSIS_CANCELLED",0);}
    @Test void wrongOrderDoesNotMutate(){Fixture f=fixture();Fixture other=fixture();ServiceDiagnosis d=create(f);assertThatThrownBy(()->as(f.operations,()->diagnosis.cancel(other.order.getId(),d.getId(),"wrong"))).isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");assertThat(diagnoses.findById(d.getId()).orElseThrow().getState()).isEqualTo(DiagnosisState.DRAFT);assertCounts(d.getId(),"DIAGNOSIS_CANCELLED",0);}
    @Test void alreadyCancelledAndSupersededAndSubmittedAreRejected(){Fixture f=fixture();ServiceDiagnosis cancelled=create(f);as(f.operations,()->diagnosis.cancel(f.order.getId(),cancelled.getId(),"first"));assertConflict(f.operations,f.order,cancelled,"second");Fixture submittedFixture=fixture();ServiceDiagnosis submitted=create(submittedFixture);as(submittedFixture.plumber,()->diagnosis.linkEvidence(submittedFixture.order.getId(),submitted.getId(),new MockMultipartFile("file","y.jpg","image/jpeg",new byte[]{2}),"ev2"));as(submittedFixture.plumber,()->diagnosis.submit(submittedFixture.order.getId(),submitted.getId(),"sub"));assertConflict(f.operations,submittedFixture.order,submitted,"subcancel");assertCounts(submitted.getId(),"DIAGNOSIS_CANCELLED",0);}
    @Test void supersededHistoryRemainsUntouchedDuringCurrentDraftCascade(){Fixture f=fixture();ServiceDiagnosis old=create(f);old.setState(DiagnosisState.SUPERSEDED);diagnoses.saveAndFlush(old);ServiceDiagnosis current=create(f);String narrative=diagnoses.findById(old.getId()).orElseThrow().getDiagnosisNarrative();as(f.operations,()->orderService.cancelOrder(f.order.getId(),"cancel current draft"));assertThat(diagnoses.findById(old.getId()).orElseThrow().getState()).isEqualTo(DiagnosisState.SUPERSEDED);assertThat(diagnoses.findById(old.getId()).orElseThrow().getDiagnosisNarrative()).isEqualTo(narrative);assertThat(diagnoses.findById(current.getId()).orElseThrow().getState()).isEqualTo(DiagnosisState.CANCELLED);assertCounts(old.getId(),"DIAGNOSIS_CANCELLED",0);assertCounts(current.getId(),"DIAGNOSIS_CANCELLED",1);}

    private void assertDenied(User actor,ServiceOrder o,ServiceDiagnosis d){assertThatThrownBy(()->as(actor,()->diagnosis.cancel(o.getId(),d.getId(),"denied"))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);}
    private void assertConflict(User actor,ServiceOrder o,ServiceDiagnosis d,String key){assertThatThrownBy(()->as(actor,()->diagnosis.cancel(o.getId(),d.getId(),key))).isInstanceOf(ResponseStatusException.class).extracting("statusCode.value").isEqualTo(409);}
    private void assertCounts(Long id,String type,long n){assertThat(events.findAll().stream().filter(e->id.equals(e.getDiagnosisId())&&type.equals(e.getEventType())).count()).isEqualTo(n);assertThat(outbox.findAll().stream().filter(e->String.valueOf(id).equals(e.getAggregateId())&&type.equals(e.getEventType())).count()).isEqualTo(n);}
    private ServiceDiagnosis create(Fixture f){PlumberDiagnosisResponse r=as(f.plumber,()->diagnosis.create(f.order.getId(),request("cascade"),"create-"+UUID.randomUUID()));return diagnoses.findById(r.id()).orElseThrow();}
    private Fixture fixture(){User c=user(Role.CUSTOMER,"customer"),p=user(Role.PLUMBER,"plumber"),o=user(Role.OPERATIONS_ADMIN,"operations");ServiceOrder so=orders.saveAndFlush(ServiceOrder.builder().customer(c).plumber(p).requestType(RequestType.NEARBY_AUTO).description("cancel").build());so.setStatus(OrderStatus.IN_PROGRESS);so.setArrivedAt(LocalDateTime.now());return new Fixture(orders.saveAndFlush(so),c,p,o);}
    private User user(Role role,String prefix){return users.saveAndFlush(User.builder().email(prefix+"-"+UUID.randomUUID()+"@test").password("x").fullName(prefix).phone("9"+Math.abs(UUID.randomUUID().hashCode())).role(role).build());}
    private DiagnosisDraftRequest request(String n){return new DiagnosisDraftRequest("pipe","condition",n,"repair",new BigDecimal("1.00"),"washer","none",false);}
    private <T>T as(User u,Callable<T> c){var x=SecurityContextHolder.createEmptyContext();x.setAuthentication(new UsernamePasswordAuthenticationToken(u.getEmail(),null,List.of(new SimpleGrantedAuthority("ROLE_"+u.getRole()))));SecurityContextHolder.setContext(x);try{return c.call();}catch(Exception e){if(e instanceof RuntimeException r)throw r;throw new RuntimeException(e);}finally{SecurityContextHolder.clearContext();}}
    private record Fixture(ServiceOrder order,User customer,User plumber,User operations){}
}
