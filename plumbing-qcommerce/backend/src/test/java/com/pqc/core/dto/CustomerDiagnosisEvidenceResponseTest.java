package com.pqc.core.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pqc.core.entity.*;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CustomerDiagnosisEvidenceResponseTest {
    @Test
    void serializesOnlyCustomerSafeFields() throws Exception {
        User customer = User.builder().id(7L).email("safe@test").fullName("Customer").role(Role.CUSTOMER).build();
        ServiceOrder order = ServiceOrder.builder().id(11L).customer(customer).build();
        ServiceOrderPhoto photo = ServiceOrderPhoto.builder().id(19L).serviceOrder(order)
                .phase(ServiceOrderPhotoPhase.DIAGNOSIS).storageKey("private/internal.key")
                .contentType("image/png").sizeBytes(12).build();
        String json = new ObjectMapper().writeValueAsString(CustomerDiagnosisEvidenceResponse.from(photo));
        Map<String, Object> body = new ObjectMapper().readValue(json, new com.fasterxml.jackson.core.type.TypeReference<>() {});
        assertThat(body).containsKeys("photoId", "phase", "contentType", "sizeBytes", "createdAt", "binaryUrl");
        assertThat(body).doesNotContainKey("storageKey");
        assertThat(json).doesNotContain("private/internal.key");
        assertThat(body.get("binaryUrl")).isEqualTo("/api/v1/customer/orders/11/diagnosis/evidence/19/file");
    }
}
