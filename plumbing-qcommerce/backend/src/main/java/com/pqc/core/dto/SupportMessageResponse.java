package com.pqc.core.dto;

import com.pqc.core.entity.Role;
import java.time.LocalDateTime;

public record SupportMessageResponse(Long messageId, Long ticketId, Long senderId, String senderName, Role senderRole, String message, boolean internalNote, LocalDateTime createdAt) {}
