package com.ajinternational.ajserver.modules.audit.controller;

import com.ajinternational.ajserver.config.security.HasPermission; // Yeni import
import com.ajinternational.ajserver.modules.audit.model.AuditLog;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Yeni import
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit/logs")
@RequiredArgsConstructor
// @PreAuthorize("hasRole('ADMIN')") // Bu satırı siliyoruz
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @HasPermission("PAGE_LOGS:READ")
    @PreAuthorize("hasAuthority('PAGE_LOGS:READ')")
    public ResponseEntity<Page<AuditLog>> getLogs(
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<AuditLog> logs = auditLogService.getLogs(pageable);
        return ResponseEntity.ok(logs);
    }
}