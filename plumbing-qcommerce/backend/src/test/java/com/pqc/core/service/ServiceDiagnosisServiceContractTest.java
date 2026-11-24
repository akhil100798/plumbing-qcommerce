package com.pqc.core.service;

import com.pqc.core.dto.DiagnosisDraftRequest;
import com.pqc.core.entity.DiagnosisState;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;

class ServiceDiagnosisServiceContractTest {
    @Test
    void diagnosisStatesExposeOnlyCanonicalWireStates() {
        assertThat(java.util.Arrays.stream(DiagnosisState.values()).map(Enum::name).toList())
                .containsExactly("DRAFT", "SUBMITTED", "SUPERSEDED", "CANCELLED");
    }

    @Test
    void createDraftRequestContainsOnlyDiagnosisFields() {
        DiagnosisDraftRequest request = new DiagnosisDraftRequest("valve", "leaking", "Observed leak", "Replace seal", new BigDecimal("1.0"), "seal", "none", false);
        assertThat(request.affectedComponent()).isEqualTo("valve");
        assertThat(request.estimatedLaborUnits()).isEqualByComparingTo("1.0");
    }
}
