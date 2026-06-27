package com.pqc.core.repository;

import com.pqc.core.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    java.util.Optional<Store> findFirstByManager_Id(Long managerId);
}
