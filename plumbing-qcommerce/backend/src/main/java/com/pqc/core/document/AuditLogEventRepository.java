package com.pqc.core.document;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogEventRepository extends MongoRepository<AuditLogEvent, String> {
    List<AuditLogEvent> findByEventType(String eventType);
}
