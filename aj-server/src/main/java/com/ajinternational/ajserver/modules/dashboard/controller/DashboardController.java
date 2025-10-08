package com.ajinternational.ajserver.modules.dashboard.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.dashboard.dto.DashboardSummaryDto;
import com.ajinternational.ajserver.modules.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @HasPermission("PAGE_DASHBOARD:READ")
    @PreAuthorize("hasAuthority('PAGE_DASHBOARD:READ')")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary() {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(summary);
    }
}