package com.ajinternational.ajserver.modules.operation.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.operation.dto.*;
import com.ajinternational.ajserver.modules.operation.model.ActiveSession;
import com.ajinternational.ajserver.modules.operation.model.OperationConfig;
import com.ajinternational.ajserver.modules.operation.model.OperationTable;
import com.ajinternational.ajserver.modules.operation.model.OperationTicket;
import com.ajinternational.ajserver.modules.operation.service.OperationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/operation")
@RequiredArgsConstructor
public class OperationController {

    private final OperationService service;

    @GetMapping("/field-panel/ping")
    @HasPermission("PAGE_FIELD_PANEL:READ")
    public ResponseEntity<String> checkFieldPanelAccess() {
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/config")
    @HasPermission("PAGE_OPERATION_SETTINGS:READ")
    public ResponseEntity<OperationConfig> getConfig() {
        return ResponseEntity.ok(service.getConfig());
    }

    @PostMapping("/config")
    @HasPermission("PAGE_OPERATION_SETTINGS:WRITE")
    public ResponseEntity<OperationConfig> updateConfig(@RequestBody OperationConfig config) {
        return ResponseEntity.ok(service.updateConfig(config));
    }

    @GetMapping("/tables")
    @HasPermission("PAGE_OPERATION_DEFINITIONS:READ")
    public ResponseEntity<List<OperationTable>> getTables() {
        return ResponseEntity.ok(service.getTables());
    }

    @PostMapping("/tables")
    @HasPermission("PAGE_OPERATION_DEFINITIONS:WRITE")
    public ResponseEntity<OperationTable> saveTable(@RequestBody OperationTable table) {
        return ResponseEntity.ok(service.saveTable(table));
    }

    @DeleteMapping("/tables/{id}")
    @HasPermission("PAGE_OPERATION_DEFINITIONS:WRITE")
    public ResponseEntity<Void> deleteTable(@PathVariable String id) {
        service.deleteTable(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tables/{tableId}/stats")
    @HasPermission("PAGE_OPERATION_DAILY:READ")
    public ResponseEntity<TableStatsDto> getTableStats(@PathVariable String tableId) {
        return ResponseEntity.ok(service.getTableStats(tableId));
    }

    @GetMapping("/available-workers")
    @HasPermission("PAGE_OPERATION_DAILY:READ")
    public ResponseEntity<List<WorkerAvailabilityDto>> getAvailableWorkers() {
        return ResponseEntity.ok(service.getAvailableWorkers());
    }

    @PostMapping("/assign")
    @HasPermission("PAGE_OPERATION_DAILY:WRITE")
    public ResponseEntity<List<ActiveSession>> assignWorkers(@RequestBody AssignWorkerRequest request) {
        return ResponseEntity.ok(service.assignWorkers(request));
    }

    @PostMapping("/release")
    @HasPermission("PAGE_OPERATION_DAILY:WRITE")
    public ResponseEntity<ActiveSession> releaseWorker(@RequestBody ReleaseWorkerRequest request) {
        return ResponseEntity.ok(service.releaseWorker(request));
    }

    @GetMapping("/tables/{tableId}/sessions")
    @HasPermission("PAGE_OPERATION_DAILY:READ")
    public ResponseEntity<List<TableSessionDto>> getTableSessions(@PathVariable String tableId) {
        return ResponseEntity.ok(service.getTableActiveSessions(tableId));
    }

    @PostMapping("/ticket")
    @HasPermission("PAGE_OPERATION_DAILY:WRITE")
    public ResponseEntity<OperationTicket> addTicket(@RequestBody TicketEntryRequest request) {
        return ResponseEntity.ok(service.addTicket(request));
    }

    @PostMapping("/transfer")
    @HasPermission("PAGE_OPERATION_DAILY:WRITE")
    public ResponseEntity<Void> transferStock(@RequestBody StockTransferRequest request) {
        service.transferStock(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/tables/{tableId}/close")
    @HasPermission("PAGE_OPERATION_DAILY:WRITE")
    public ResponseEntity<OperationTicket> closeTable(@PathVariable String tableId, @RequestBody Double actualRemainingKg) {
        return ResponseEntity.ok(service.closeTableAndRollover(tableId, actualRemainingKg));
    }

    @PostMapping("/close-all-empty")
    @HasPermission("PAGE_OPERATION_DAILY:WRITE")
    public ResponseEntity<Void> closeAllEmptyTables() {
        service.closeAllRemainingTablesWithZero();
        return ResponseEntity.ok().build();
    }

    // V5.0 Endpointler
    @GetMapping("/dashboard/stats")
    @HasPermission("PAGE_FIELD_PANEL:READ")
    public ResponseEntity<FieldDashboardDto> getDashboardStats() {
        return ResponseEntity.ok(service.getFieldDashboardStats());
    }

    @PostMapping("/demo-seed")
    @HasPermission("PAGE_OPERATION_DAILY:WRITE")
    public ResponseEntity<Void> generateDemoData() {
        service.generateDemoData();
        return ResponseEntity.ok().build();
    }
}