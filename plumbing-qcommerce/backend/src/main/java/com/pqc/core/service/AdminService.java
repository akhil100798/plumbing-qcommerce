package com.pqc.core.service;

import com.pqc.core.entity.OrderStatus;
import com.pqc.core.entity.Role;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ServiceOrderRepository serviceOrderRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getGlobalMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        BigDecimal totalRevenue = serviceOrderRepository.sumCompletedOrdersRevenue();
        metrics.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);

        metrics.put("activePlumbers", userRepository.countByRole(Role.PLUMBER));
        metrics.put("totalOrders", serviceOrderRepository.count());
        metrics.put("pendingOrders", serviceOrderRepository.countByStatus(OrderStatus.PENDING));

        return metrics;
    }
}
