package com.pqc.core.repository;

import com.pqc.core.entity.MarketingNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MarketingNotificationRepository extends JpaRepository<MarketingNotification, Long> {
    List<MarketingNotification> findAllByOrderByCreatedAtDesc();
}
