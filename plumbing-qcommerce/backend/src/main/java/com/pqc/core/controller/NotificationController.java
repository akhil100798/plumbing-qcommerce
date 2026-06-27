package com.pqc.core.controller;

import com.pqc.core.entity.Notification;
import com.pqc.core.entity.User;
import com.pqc.core.repository.NotificationRepository;
import com.pqc.core.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final CurrentUser currentUser;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications() {
        User user = currentUser.require();
        return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        User user = currentUser.require();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + id));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied to this notification");
        }

        notification.setRead(true);
        return ResponseEntity.ok(notificationRepository.save(notification));
    }

    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<Void> markAllAsRead() {
        User user = currentUser.require();
        notificationRepository.markAllReadByUserId(user.getId());
        return ResponseEntity.ok().build();
    }
}
