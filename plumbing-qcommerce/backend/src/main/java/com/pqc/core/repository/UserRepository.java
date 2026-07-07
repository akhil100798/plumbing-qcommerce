package com.pqc.core.repository;

import com.pqc.core.entity.User;
import com.pqc.core.entity.Role;
import com.pqc.core.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    long countByRole(Role role);
    long countByRoleIn(Collection<Role> roles);
    Page<User> findByRoleIn(Collection<Role> roles, Pageable pageable);
    long countByRoleAndStatus(Role role, UserStatus status);
    List<User> findByRole(Role role);
}
