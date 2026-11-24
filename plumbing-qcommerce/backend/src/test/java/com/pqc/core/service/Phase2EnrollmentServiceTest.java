package com.pqc.core.service;

import com.pqc.core.config.Phase2Properties;
import com.pqc.core.entity.*;
import com.pqc.core.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class Phase2EnrollmentServiceTest {
    @Mock Phase2EnrollmentRepository enrollments;
    @Mock ServiceOrderRepository orders;

    @Test
    void enrollmentIsCreatedOnlyWhenEnabledAndAfterArrival() {
        Phase2Properties properties = new Phase2Properties(); properties.setEnabled(true);
        ServiceOrder order = ServiceOrder.builder().id(12L).arrivedAt(LocalDateTime.now()).build();
        when(orders.findByIdForUpdate(12L)).thenReturn(Optional.of(order));
        when(enrollments.findByServiceOrderIdForUpdate(12L)).thenReturn(Optional.empty());
        when(enrollments.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
        var result = new Phase2EnrollmentService(enrollments, orders, properties).enrollIfEnabledAfterArrival(12L);
        assertThat(result.isEnabledSnapshot()).isTrue();
        verify(enrollments).saveAndFlush(any(Phase2Enrollment.class));
    }
}
