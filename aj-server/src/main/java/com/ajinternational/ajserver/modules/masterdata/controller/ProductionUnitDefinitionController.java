package com.ajinternational.ajserver.modules.masterdata.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.masterdata.model.ProductionUnitDefinition;
import com.ajinternational.ajserver.modules.masterdata.service.ProductionUnitDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/masterdata/production-units") // Yeni API yolu
@RequiredArgsConstructor
public class ProductionUnitDefinitionController {

    private final ProductionUnitDefinitionService unitService;

    // YENİ YETKİ ANAHTARI: PAGE_PRODUCTION_UNITS

    @GetMapping
    @HasPermission("PAGE_PRODUCTION_UNITS:READ")
    @PreAuthorize("hasAuthority('PAGE_PRODUCTION_UNITS:READ')")
    public ResponseEntity<List<ProductionUnitDefinition>> getAllUnits() {
        return ResponseEntity.ok(unitService.findAllHierarchicalUnits());
    }

    @PostMapping
    @HasPermission("PAGE_PRODUCTION_UNITS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_PRODUCTION_UNITS:WRITE')")
    public ResponseEntity<ProductionUnitDefinition> saveUnit(@Valid @RequestBody ProductionUnitDefinition unit) {
        return ResponseEntity.ok(unitService.saveUnit(unit));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_PRODUCTION_UNITS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_PRODUCTION_UNITS:WRITE')")
    public ResponseEntity<Void> deleteUnit(@PathVariable String id) {
        unitService.deleteUnit(id);
        return ResponseEntity.noContent().build();
    }
}