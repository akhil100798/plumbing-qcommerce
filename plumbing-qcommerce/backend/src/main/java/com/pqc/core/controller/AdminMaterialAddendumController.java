package com.pqc.core.controller;

import com.pqc.core.dto.AdminMaterialAddendumHistoryResponse;
import com.pqc.core.service.Phase2QuoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/admin/service-jobs/{orderId}/addenda")
public class AdminMaterialAddendumController {
    private final Phase2QuoteService addenda;
    @GetMapping @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','OPERATIONS_ADMIN')")
    public ResponseEntity<List<AdminMaterialAddendumHistoryResponse>> history(@PathVariable Long orderId) {
        return ResponseEntity.ok(addenda.adminAddendumHistory(orderId));
    }
}
