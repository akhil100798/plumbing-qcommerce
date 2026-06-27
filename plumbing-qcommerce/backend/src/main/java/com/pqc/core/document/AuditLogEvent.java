package com.pqc.core.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "audit_log_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogEvent {
    
    @Id
    private String id;
    
    private String aggregateId;
    private String aggregateType;
    private String eventType;
    private String payload;
    private LocalDateTime timestamp;
}
