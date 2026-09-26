package com.pqc.core.security;

import com.pqc.core.entity.Role;
import com.pqc.core.entity.ServiceOrder;
import com.pqc.core.entity.User;
import com.pqc.core.repository.ServiceOrderRepository;
import com.pqc.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component("orderAuthorization")
@RequiredArgsConstructor
public class OrderAuthorization {

    private final ServiceOrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public boolean canRead(Long orderId, Authentication authentication) {
        User actor = actor(authentication);
        ServiceOrder order = orderRepository.findById(orderId).orElse(null);
        if (actor == null || order == null) {
            return false;
        }
        return actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.CUSTOMER && order.getCustomer().getId().equals(actor.getId())
                || actor.getRole() == Role.PLUMBER && order.getPlumber() != null
                    && order.getPlumber().getId().equals(actor.getId())
                || actor.getRole() == Role.STORE_MANAGER && order.getStore() != null
                    && order.getStore().getManager().getId().equals(actor.getId());
    }

    public boolean canReadCustomer(Long customerId, Authentication authentication) {
        User actor = actor(authentication);
        return actor != null && (actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.CUSTOMER && actor.getId().equals(customerId));
    }

    @Transactional(readOnly = true)
    public boolean isAssignedPlumber(Long orderId, Authentication authentication) {
        User actor = actor(authentication);
        if (actor == null || actor.getRole() != Role.PLUMBER) {
            return false;
        }
        return orderRepository.findById(orderId)
                .map(order -> order.getPlumber() != null && order.getPlumber().getId().equals(actor.getId()))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean canCancel(Long orderId, Authentication authentication) {
        User actor = actor(authentication);
        if (actor == null) {
            return false;
        }
        return orderRepository.findById(orderId)
                .map(order -> actor.getRole() == Role.ADMIN
                        || actor.getRole() == Role.CUSTOMER
                        && order.getCustomer().getId().equals(actor.getId()))
                .orElse(false);
    }

    private User actor(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }
}
