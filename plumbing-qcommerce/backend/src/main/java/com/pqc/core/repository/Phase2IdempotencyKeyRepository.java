package com.pqc.core.repository;

import com.pqc.core.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;

public interface Phase2IdempotencyKeyRepository extends JpaRepository<Phase2IdempotencyKey, Long> {
    @Modifying
    @Query(value = "INSERT INTO phase2_idempotency_keys (actor_id, operation, resource_type, resource_id, idempotency_key, request_fingerprint, status, created_at, updated_at) VALUES (:actorId, :operation, :resourceType, :resourceId, :idempotencyKey, :fingerprint, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING", nativeQuery = true)
    int claimIfAbsent(@Param("actorId") Long actorId, @Param("operation") String operation,
                      @Param("resourceType") String resourceType, @Param("resourceId") Long resourceId,
                      @Param("idempotencyKey") String idempotencyKey, @Param("fingerprint") String fingerprint);
    Optional<Phase2IdempotencyKey> findByActorIdAndOperationAndResourceTypeAndResourceIdAndIdempotencyKey(Long actorId, String operation, String resourceType, Long resourceId, String idempotencyKey);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select k from Phase2IdempotencyKey k where k.id = :id")
    Optional<Phase2IdempotencyKey> findByIdForUpdate(@Param("id") Long id);
}
