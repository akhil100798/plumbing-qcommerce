package com.pqc.core.service;

import com.pqc.core.entity.*;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

class ServiceOrderDtoMapperTest {
    @Test
    void customerAndPlumberDtosDoNotContainJpaRelationships() {
        User customer = User.builder().id(1L).fullName("Customer").phone("111").email("customer@example.com").build();
        User plumber = User.builder().id(2L).fullName("Plumber").phone("222").email("plumber@example.com").build();
        ServiceOrder order = ServiceOrder.builder().id(3L).customer(customer).plumber(plumber)
                .status(OrderStatus.ACCEPTED).requestType(RequestType.NEARBY_AUTO).description("Leak").build();

        var mapper = new ServiceOrderDtoMapper();
        var customerDto = mapper.customerDetail(order);
        var plumberDto = mapper.plumberDetail(order);

        assertThat(customerDto).hasNoNullFieldsOrPropertiesExcept(
                "issueCategory", "urgency", "scheduledFor", "addressLine1", "addressLine2", "landmark", "city", "postalCode",
                "customerPhoneSnapshot", "customerLatitude", "customerLongitude", "visitFee", "currency",
                "laborCharge", "partsCharge", "platformFee", "totalAmount", "createdAt", "acceptedAt", "arrivedAt", "startedAt", "completedAt", "estimatedArrivalAt");
        assertThat(customerDto.getClass().getDeclaredFields()).extracting("name").doesNotContain("customer", "plumber", "store");
        assertThat(plumberDto.customerName()).isEqualTo("Customer");
        assertThat(plumberDto.customerPhone()).isEqualTo("111");
        assertThat(customerDto.plumberName()).isEqualTo("Plumber");
        assertThat(customerDto.estimatedArrivalAt()).isNull();
    }

    @Test
    void serializedDtosContainNoEntityOrSensitiveFields() throws Exception {
        User customer = User.builder().id(1L).fullName("Customer").phone("111")
                .email("customer@example.com").password("secret").authProvider("GOOGLE").providerId("oauth-id").build();
        User plumber = User.builder().id(2L).fullName("Plumber").phone("222")
                .email("plumber@example.com").password("secret").build();
        ServiceOrder order = ServiceOrder.builder().id(3L).customer(customer).plumber(plumber)
                .status(OrderStatus.ACCEPTED).requestType(RequestType.NEARBY_AUTO).description("Leak").build();
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        String customerJson = mapper.writeValueAsString(new ServiceOrderDtoMapper().customerDetail(order));
        String plumberJson = mapper.writeValueAsString(new ServiceOrderDtoMapper().plumberDetail(order));

        var customerTree = mapper.readTree(customerJson);
        var plumberTree = mapper.readTree(plumberJson);
        for (String field : new String[]{"password", "authProvider", "providerId", "customer", "store", "kyc"}) {
            assertThat(customerTree.has(field)).as(field).isFalse();
            assertThat(plumberTree.has(field)).as(field).isFalse();
        }
        assertThat(customerTree.get("estimatedArrivalAt").isNull()).isTrue();
    }
}
