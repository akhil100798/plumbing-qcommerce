package com.pqc.core.dto;

import com.pqc.core.entity.Role;
import lombok.Data;

@Data
public class AssignRoleRequest {
    private Role role;
}
