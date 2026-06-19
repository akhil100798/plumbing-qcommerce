package com.pqc.core.scheduler;

import com.pqc.core.entity.OutboxEvent;
import com.pqc.core.entity.OutboxStatus;
import com.pqc.core.repository.OutboxEventRepository;
import com.pqc.core.service.OutboxPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPoller {

    private final OutboxEventRepository outboxRepository;
    private final OutboxPublisher outboxPublisher;

    @Scheduled(fixedDelay = 5000)
    public void pollAndPublish() {
        List<OutboxEvent> pendingEvents =
                outboxRepository.findTop50ByStatusAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
                        OutboxStatus.PENDING,
                        LocalDateTime.now());

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("Publishing {} due outbox event(s)", pendingEvents.size());
        for (OutboxEvent event : pendingEvents) {
            outboxPublisher.publish(event.getId());
        }
    }
}
