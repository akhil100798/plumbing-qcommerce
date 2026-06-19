package com.pqc.core.controller;

import com.pqc.core.document.ServiceLog;
import com.pqc.core.security.CurrentUser;
import com.pqc.core.service.ServiceLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/logs")
@RequiredArgsConstructor
public class ServiceLogController {

    private final ServiceLogService serviceLogService;
    private final CurrentUser currentUser;

    @PostMapping
    @PreAuthorize("hasRole('PLUMBER')")
    public ResponseEntity<ServiceLog> createLog(@RequestBody Map<String, Object> body) {
        Long orderId = Long.valueOf(body.get("orderId").toString());
        Long plumberId = currentUser.require().getId();
        String diagnosis = body.getOrDefault("diagnosis", "").toString();
        String workDone = body.getOrDefault("workDone", "").toString();
        String notes = body.getOrDefault("notes", "").toString();
        String photoUrl = body.getOrDefault("photoUrl", "").toString();

        List<ServiceLog.PartUsed> partsUsed = null;
        if (body.containsKey("partsUsed")) {
            List<Map<String, Object>> partsList = (List<Map<String, Object>>) body.get("partsUsed");
            partsUsed = partsList.stream().map(p -> new ServiceLog.PartUsed(
                    p.get("partName").toString(),
                    Integer.valueOf(p.get("quantity").toString()),
                    new java.math.BigDecimal(p.get("unitPrice").toString())
            )).toList();
        }

        return ResponseEntity.ok(serviceLogService.createLog(
                orderId, plumberId, diagnosis, workDone, partsUsed, notes, photoUrl));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("@orderAuthorization.canRead(#orderId, authentication)")
    public ResponseEntity<List<ServiceLog>> getByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(serviceLogService.getLogsByOrder(orderId));
    }

    @GetMapping("/plumber/{plumberId}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('PLUMBER') and @currentUser.require().id == #plumberId)")
    public ResponseEntity<List<ServiceLog>> getByPlumber(@PathVariable Long plumberId) {
        return ResponseEntity.ok(serviceLogService.getLogsByPlumber(plumberId));
    }
}
