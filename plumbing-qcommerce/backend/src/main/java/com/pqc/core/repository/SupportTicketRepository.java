package com.pqc.core.repository;

import com.pqc.core.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long>, JpaSpecificationExecutor<SupportTicket> {
    Optional<SupportTicket> findTopByOrderByIdDesc();
    long countByStatus(SupportTicketStatus status);
    long countByPriority(SupportTicketPriority priority);
    long countByCategory(SupportTicketCategory category);
    long countByStatusAndResolvedAtBetween(SupportTicketStatus status, LocalDateTime start, LocalDateTime end);
    List<SupportTicket> findTop5ByOrderByUpdatedAtDesc();
    List<SupportTicket> findTop5ByPriorityOrderByUpdatedAtDesc(SupportTicketPriority priority);
    List<SupportTicket> findTop5ByStatusOrderByUpdatedAtDesc(SupportTicketStatus status);
    List<SupportTicket> findTop10ByRequesterIdOrderByUpdatedAtDesc(Long requesterId);
    List<SupportTicket> findByStatusIn(Collection<SupportTicketStatus> statuses);
}