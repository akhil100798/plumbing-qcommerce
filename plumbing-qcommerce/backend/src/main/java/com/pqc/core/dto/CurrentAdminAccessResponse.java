package com.pqc.core.dto;

import com.pqc.core.entity.Permission;
import com.pqc.core.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class CurrentAdminAccessResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private Role role;
    private Set<Permission> permissions;
}
