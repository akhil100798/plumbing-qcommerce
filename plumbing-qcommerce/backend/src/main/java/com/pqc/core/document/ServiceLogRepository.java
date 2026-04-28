package com.pqc.core.document;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceLogRepository extends MongoRepository<ServiceLog, String> {
    List<ServiceLog> findByOrderId(Long orderId);
    List<ServiceLog> findByPlumberId(Long plumberId);
}
