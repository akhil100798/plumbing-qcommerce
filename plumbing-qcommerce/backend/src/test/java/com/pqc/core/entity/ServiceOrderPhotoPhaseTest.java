package com.pqc.core.entity;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class ServiceOrderPhotoPhaseTest {
    @Test
    void preservesExistingPhasesAndAddsDiagnosis() {
        assertThat(ServiceOrderPhotoPhase.values()).containsExactly(ServiceOrderPhotoPhase.BEFORE, ServiceOrderPhotoPhase.DIAGNOSIS, ServiceOrderPhotoPhase.AFTER);
        assertThat(ServiceOrderPhotoPhase.valueOf("DIAGNOSIS")).isEqualTo(ServiceOrderPhotoPhase.DIAGNOSIS);
    }
}
