// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/controller/StockReportController.java
package com.ajinternational.ajserver.modules.inventory.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.inventory.dto.StockReportDto;
import com.ajinternational.ajserver.modules.inventory.service.StockCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/report")
@RequiredArgsConstructor
public class StockReportController {

    private final StockCalculationService stockService;

    @GetMapping("/stock")
    @HasPermission("PAGE_INVENTORY_REPORTS:READ")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_REPORTS:READ')")
    public ResponseEntity<List<StockReportDto>> getStockReport() {
        List<StockReportDto> report = stockService.getRealTimeStockReport();
        return ResponseEntity.ok(report);
    }
}