package com.pqc.core.dto;

import com.pqc.core.entity.Permission;
import com.pqc.core.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class RolePermissionResponse {
    private Role role;
    private Set<Permission> permissions;
}
