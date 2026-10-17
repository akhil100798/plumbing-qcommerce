package com.pqc.core.integration;

import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import com.pqc.core.security.JwtService;
import com.pqc.core.service.ServiceOrderAssignmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PhaseOneAssignmentFlowIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired ServiceOrderRepository orders;
    @Autowired PlumberKycRepository kyc;
    @Autowired ServiceOrderAssignmentRepository assignments;
    @Autowired ServiceOrderPlumberDispositionRepository dispositions;
    @Autowired ServiceOrderStatusHistoryRepository histories;
    @Autowired OutboxEventRepository outbox;
    @Autowired JwtService jwt;
    @Autowired ServiceOrderAssignmentService assignmentService;

    private User customer;
    private User plumberA;
    private User plumberB;
    private User operator;
    private User operatorB;

    @BeforeEach
    void reset() {
        jdbc.execute("SET REFERENTIAL_INTEGRITY FALSE");
        for (String table : List.of("service_order_assignments", "service_order_plumber_dispositions",
                "service_order_status_history", "outbox_events", "service_orders", "plumber_kyc", "users")) {
            jdbc.execute("TRUNCATE TABLE " + table + " RESTART IDENTITY");
        }
        jdbc.execute("SET REFERENTIAL_INTEGRITY TRUE");
        customer = save("customer@phase1.test", "Customer", Role.CUSTOMER);
        plumberA = save("a@phase1.test", "Plumber A", Role.PLUMBER);
        plumberB = save("b@phase1.test", "Plumber B", Role.PLUMBER);
        operator = save("ops@phase1.test", "Operations", Role.OPERATIONS_ADMIN);
        operatorB = save("ops-b@phase1.test", "Operations B", Role.ADMIN);
        kyc.save(onlineKyc(plumberA));
        kyc.save(onlineKyc(plumberB));
    }

    @Test
    void concurrentHttpFirstAcceptHasOneWinnerAndOneAssignmentEvent() throws Exception {
        Long orderId = createOrderHttp();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<Integer> acceptA = () -> acceptConcurrently(orderId, plumberA, ready, start);
        Callable<Integer> acceptB = () -> acceptConcurrently(orderId, plumberB, ready, start);
        List<Future<Integer>> results = pool.invokeAll(List.of(acceptA, acceptB));
        pool.shutdown();

        List<Integer> statuses = List.of(results.get(0).get(), results.get(1).get());
        assertThat(statuses).containsExactlyInAnyOrder(200, 409);
        ServiceOrder persisted = orders.findById(orderId).orElseThrow();
        assertThat(persisted.getStatus()).isEqualTo(OrderStatus.ACCEPTED);
        assertThat(persisted.getPlumber().getId()).isIn(plumberA.getId(), plumberB.getId());
        assertThat(assignments.findByServiceOrderIdOrderByCreatedAtAsc(orderId)).hasSize(1);
        assertThat(assignments.findByServiceOrderIdOrderByCreatedAtAsc(orderId).get(0).getStatus())
                .isEqualTo(ServiceOrderAssignmentStatus.ACCEPTED);
        assertThat(outbox.findAll().stream().filter(e -> "SERVICE_ORDER_ASSIGNED".equals(e.getEventType())).count()).isEqualTo(1);
        assertThat(histories.findByServiceOrderIdOrderByCreatedAtAsc(orderId).stream()
                .filter(h -> "ACCEPTED".equals(h.getNewStatus())).count()).isEqualTo(1);
    }

    @Test
    void declineExcludesOnlyDecliningPlumberAndOtherPlumberCanAcceptOverHttp() throws Exception {
        Long orderId = createOrderHttp();
        mvc.perform(patch("/api/v1/orders/{id}/reject", orderId).header("Authorization", bearer(plumberA)))
                .andExpect(status().isOk());
        assertThat(offersFor(plumberA)).doesNotContain(orderId.intValue());
        assertThat(offersFor(plumberB)).contains(orderId.intValue());

        mvc.perform(patch("/api/v1/orders/{id}/accept", orderId).header("Authorization", bearer(plumberB)))
                .andExpect(status().isOk());
        mvc.perform(patch("/api/v1/orders/{id}/accept", orderId).header("Authorization", bearer(plumberA)))
                .andExpect(status().isConflict());
        assertThat(dispositions.findByServiceOrderIdAndPlumberId(orderId, plumberA.getId())).isPresent();
        assertThat(orders.findById(orderId).orElseThrow().getPlumber().getId()).isEqualTo(plumberB.getId());
    }

    @Test
    void operatorAssignmentPersistsReassignmentHistoryAndSafeHistoryOmitsAuditFields() throws Exception {
        Long orderId = createOrderHttp();
        mvc.perform(patch("/api/v1/admin/operations/service-jobs/{id}/reassign-plumber", orderId)
                        .header("Authorization", bearer(operator)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plumberId\":" + plumberA.getId() + ",\"reason\":\"Initial assignment\"}"))
                .andExpect(status().isOk());
        mvc.perform(patch("/api/v1/admin/operations/service-jobs/{id}/reassign-plumber", orderId)
                        .header("Authorization", bearer(operator)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plumberId\":" + plumberB.getId() + ",\"reason\":\"Reassignment\"}"))
                .andExpect(status().isOk());

        List<ServiceOrderAssignment> history = assignments.findByServiceOrderIdOrderByCreatedAtAsc(orderId);
        assertThat(history).hasSize(2);
        assertThat(history.get(0).getStatus()).isEqualTo(ServiceOrderAssignmentStatus.REASSIGNED);
        assertThat(history.get(0).getPlumberId()).isEqualTo(plumberA.getId());
        assertThat(history.get(0).getReason()).isEqualTo("Initial assignment");
        assertThat(history.get(1).getStatus()).isEqualTo(ServiceOrderAssignmentStatus.ASSIGNED);
        assertThat(history.get(1).getPlumberId()).isEqualTo(plumberB.getId());
        assertThat(orders.findById(orderId).orElseThrow().getPlumber().getId()).isEqualTo(plumberB.getId());
        assertThat(outbox.findAll().stream().filter(e -> "SERVICE_ORDER_ASSIGNED".equals(e.getEventType())).count()).isEqualTo(2);

        mvc.perform(get("/api/v1/orders/{id}/assignment-history", orderId).header("Authorization", bearer(customer)))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[0].actorId").doesNotExist())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[0].reason").doesNotExist());
        mvc.perform(get("/api/v1/orders/{id}/assignment-history", orderId).header("Authorization", bearer(plumberB)))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[0].actorId").doesNotExist())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$[0].reason").doesNotExist());
        mvc.perform(get("/api/v1/admin/operations/service-jobs/{id}", orderId).header("Authorization", bearer(operator)))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.assignmentHistory[0].plumberName").value("Plumber A"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.assignmentHistory[0].status").value("REASSIGNED"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.assignmentHistory[0].assignmentMode").value("OPERATOR"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.assignmentHistory[0].actorId").value(operator.getId()))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.assignmentHistory[0].actorRole").value("OPERATIONS_ADMIN"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.assignmentHistory[0].reason").value("Initial assignment"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.assignmentHistory[0].createdAt").exists())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.assignmentHistory[1].plumberName").value("Plumber B"));
    }

    @Test
    void initialOperatorAssignmentIsOneShotAndExplicitReassignmentIsSeparate() throws Exception {
        Long orderId = createOrderHttp();

        mvc.perform(patch("/api/v1/admin/operations/service-jobs/{id}/assign-plumber", orderId)
                        .header("Authorization", bearer(operator)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plumberId\":" + plumberA.getId() + ",\"reason\":\"Initial assignment\"}"))
                .andExpect(status().isOk());

        mvc.perform(patch("/api/v1/admin/operations/service-jobs/{id}/assign-plumber", orderId)
                        .header("Authorization", bearer(operator)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plumberId\":" + plumberB.getId() + ",\"reason\":\"Second initial assignment\"}"))
                .andExpect(status().isConflict());

        assertThat(orders.findById(orderId).orElseThrow().getPlumber().getId()).isEqualTo(plumberA.getId());
        assertThat(assignments.findByServiceOrderIdAndStatusIn(orderId,
                java.util.EnumSet.of(ServiceOrderAssignmentStatus.ASSIGNED, ServiceOrderAssignmentStatus.ACCEPTED))).hasSize(1);
        assertThat(outbox.findAll().stream().filter(e -> "SERVICE_ORDER_ASSIGNED".equals(e.getEventType())).count()).isEqualTo(1);

        mvc.perform(patch("/api/v1/admin/operations/service-jobs/{id}/reassign-plumber", orderId)
                        .header("Authorization", bearer(operator)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plumberId\":" + plumberB.getId() + ",\"reason\":\"Explicit reassignment\"}"))
                .andExpect(status().isOk());

        assertThat(orders.findById(orderId).orElseThrow().getPlumber().getId()).isEqualTo(plumberB.getId());
        assertThat(assignments.findByServiceOrderIdAndStatusIn(orderId,
                java.util.EnumSet.of(ServiceOrderAssignmentStatus.ASSIGNED, ServiceOrderAssignmentStatus.ACCEPTED)))
                .hasSize(1).first().extracting(ServiceOrderAssignment::getPlumberId).isEqualTo(plumberB.getId());
        assertThat(assignments.findByServiceOrderIdOrderByCreatedAtAsc(orderId)).extracting(ServiceOrderAssignment::getStatus)
                .containsExactly(ServiceOrderAssignmentStatus.REASSIGNED, ServiceOrderAssignmentStatus.ASSIGNED);
        assertThat(outbox.findAll().stream().filter(e -> "SERVICE_ORDER_ASSIGNED".equals(e.getEventType())).count()).isEqualTo(2);
    }

    @Test
    void operatorAssignmentToTerminalStateIsRejected() throws Exception {
        ServiceOrder order = orders.saveAndFlush(newOrder());
        order.setStatus(OrderStatus.COMPLETED);
        order = orders.saveAndFlush(order);
        mvc.perform(patch("/api/v1/admin/operations/service-jobs/{id}/reassign-plumber", order.getId())
                        .header("Authorization", bearer(operator)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plumberId\":" + plumberA.getId() + ",\"reason\":\"Too late\"}"))
                .andExpect(status().isConflict());
        assertThat(assignments.findByServiceOrderIdOrderByCreatedAtAsc(order.getId())).isEmpty();
    }

    @Test
    void concurrentOperatorAssignmentHasOneWinnerAndOneCurrentAssignment() throws Exception {
        Long orderId = createOrderHttp();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<Integer> first = () -> operatorAssign(orderId, operator, plumberA, ready, start);
        Callable<Integer> second = () -> operatorAssign(orderId, operatorB, plumberB, ready, start);
        List<Future<Integer>> results = pool.invokeAll(List.of(first, second));
        pool.shutdown();

        assertThat(List.of(results.get(0).get(), results.get(1).get())).containsExactlyInAnyOrder(200, 409);
        assertThat(assignments.findByServiceOrderIdAndStatusIn(orderId,
                java.util.EnumSet.of(ServiceOrderAssignmentStatus.ASSIGNED, ServiceOrderAssignmentStatus.ACCEPTED))).hasSize(1);
        assertThat(outbox.findAll().stream().filter(e -> "SERVICE_ORDER_ASSIGNED".equals(e.getEventType())).count()).isEqualTo(1);
        assertThat(histories.findByServiceOrderIdOrderByCreatedAtAsc(orderId).stream()
                .filter(h -> "ACCEPTED".equals(h.getNewStatus())).count()).isEqualTo(1);
    }

    @Test
    void cancellationCutoffAndMetadataArePersisted() throws Exception {
        Long beforeArrival = createOrderHttp();
        mvc.perform(patch("/api/v1/orders/{id}/cancel", beforeArrival).header("Authorization", bearer(customer))
                        .param("reason", "Customer changed plans"))
                .andExpect(status().isOk());
        ServiceOrder cancelled = orders.findById(beforeArrival).orElseThrow();
        assertThat(cancelled.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(cancelled.getCancelledAt()).isNotNull();
        assertThat(cancelled.getCancelledBy().getId()).isEqualTo(customer.getId());
        assertThat(cancelled.getCancellationReason()).isEqualTo("Customer changed plans");
        assertThat(assignments.findByServiceOrderIdAndStatusIn(beforeArrival,
                java.util.EnumSet.of(ServiceOrderAssignmentStatus.ASSIGNED, ServiceOrderAssignmentStatus.ACCEPTED))).isEmpty();
        assertThat(histories.findByServiceOrderIdOrderByCreatedAtAsc(beforeArrival).stream()
                .filter(h -> "CANCELLED".equals(h.getNewStatus()))).hasSize(1);

        Long arrived = createOrderHttp();
        ServiceOrder arrivedOrder = orders.findById(arrived).orElseThrow();
        arrivedOrder.setStatus(OrderStatus.ACCEPTED);
        arrivedOrder.setPlumber(plumberA);
        arrivedOrder.setArrivedAt(java.time.LocalDateTime.now());
        orders.saveAndFlush(arrivedOrder);
        mvc.perform(patch("/api/v1/orders/{id}/cancel", arrived).header("Authorization", bearer(customer)))
                .andExpect(status().isForbidden());

        Long started = createOrderHttp();
        ServiceOrder startedOrder = orders.findById(started).orElseThrow();
        startedOrder.setStatus(OrderStatus.IN_PROGRESS);
        startedOrder.setPlumber(plumberA);
        startedOrder.setStartedAt(java.time.LocalDateTime.now());
        orders.saveAndFlush(startedOrder);
        mvc.perform(patch("/api/v1/orders/{id}/cancel", started).header("Authorization", bearer(customer)))
                .andExpect(status().isForbidden());
    }

    @Test
    void eachSupportedOperatorRoleCanCancelAndUnauthorizedRoleCannot() throws Exception {
        for (Role role : List.of(Role.ADMIN, Role.SUPER_ADMIN, Role.OPERATIONS_ADMIN)) {
            User actor = save("cancel-" + role + "@phase1.test", role.name(), role);
            Long id = createOrderHttp();
            mvc.perform(patch("/api/v1/orders/{id}/cancel", id).header("Authorization", bearer(actor))
                            .param("reason", "Operator cancellation"))
                    .andExpect(status().isOk());
            ServiceOrder order = orders.findById(id).orElseThrow();
            assertThat(order.getCancelledBy().getId()).isEqualTo(actor.getId());
            assertThat(order.getCancellationReason()).isEqualTo("Operator cancellation");
            assertThat(histories.findByServiceOrderIdOrderByCreatedAtAsc(id).stream()
                    .filter(h -> "CANCELLED".equals(h.getNewStatus()))).hasSize(1);
        }
        User plumber = plumberA;
        Long id = createOrderHttp();
        mvc.perform(patch("/api/v1/orders/{id}/cancel", id).header("Authorization", bearer(plumber)))
                .andExpect(status().isForbidden());
    }

    private int acceptConcurrently(Long orderId, User plumber, CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        ready.await(5, TimeUnit.SECONDS);
        start.countDown();
        start.await(5, TimeUnit.SECONDS);
        MvcResult result = mvc.perform(patch("/api/v1/orders/{id}/accept", orderId)
                        .header("Authorization", bearer(plumber))).andReturn();
        return result.getResponse().getStatus();
    }

    private int operatorAssign(Long orderId, User actor, User plumber, CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        ready.await(5, TimeUnit.SECONDS);
        start.countDown();
        start.await(5, TimeUnit.SECONDS);
        return mvc.perform(patch("/api/v1/admin/operations/service-jobs/{id}/assign-plumber", orderId)
                        .header("Authorization", bearer(actor)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"plumberId\":" + plumber.getId() + ",\"reason\":\"Concurrent assignment\"}"))
                .andReturn().getResponse().getStatus();
    }

    private Long createOrderHttp() throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/orders").header("Authorization", bearer(customer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"issueCategory\":\"pipe\",\"description\":\"Leak\",\"requestType\":\"NEARBY_AUTO\",\"addressLine1\":\"1 Main Street\",\"city\":\"Mumbai\",\"postalCode\":\"400001\",\"contactPhone\":\"+919876543210\",\"urgency\":\"NORMAL\"}"))
                .andExpect(status().isOk()).andReturn();
        Number id = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private List<Integer> offersFor(User plumber) throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/orders/plumber/jobs/offers").header("Authorization", bearer(plumber)))
                .andExpect(status().isOk()).andReturn();
        return com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$[*].jobId");
    }

    private ServiceOrder newOrder() {
        return ServiceOrder.builder().customer(customer).description("Leak").issueCategory("pipe")
                .requestType(RequestType.NEARBY_AUTO).addressLine1("1 Main Street").city("Mumbai")
                .postalCode("400001").customerPhoneSnapshot("+919876543210").status(OrderStatus.PENDING).build();
    }

    private User save(String email, String name, Role role) {
        return users.save(User.builder().email(email).fullName(name).phone("9999999999")
                .password("Password123!").role(role).status(UserStatus.ACTIVE).build());
    }

    private PlumberKyc onlineKyc(User plumber) {
        return PlumberKyc.builder().plumberId(plumber.getId()).status(PlumberKycStatus.APPROVED)
                .availabilityStatus(PlumberAvailabilityStatus.ONLINE).build();
    }

    private String bearer(User user) {
        return "Bearer " + jwt.generateToken(user.getEmail(), user.getRole().name());
    }
}
