package com.ajinternational.ajserver.modules.masterdata.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.masterdata.model.UnitDefinition;
import com.ajinternational.ajserver.modules.masterdata.service.UnitDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/masterdata/units")
@RequiredArgsConstructor
public class UnitDefinitionController {

    private final UnitDefinitionService unitService;

    @GetMapping
    @HasPermission("PAGE_UNITS:READ") // <-- DEĞİŞTİ
    @PreAuthorize("hasAuthority('PAGE_UNITS:READ')") // <-- DEĞİŞTİ
    public ResponseEntity<List<UnitDefinition>> getAllUnits() {
        return ResponseEntity.ok(unitService.findAllUnits());
    }

    @PostMapping
    @HasPermission("PAGE_UNITS:WRITE") // <-- DEĞİŞTİ
    @PreAuthorize("hasAuthority('PAGE_UNITS:WRITE')") // <-- DEĞİŞTİ
    public ResponseEntity<UnitDefinition> saveUnit(@Valid @RequestBody UnitDefinition unit) {
        return ResponseEntity.ok(unitService.saveUnit(unit));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_UNITS:WRITE") // <-- DEĞİŞTİ
    @PreAuthorize("hasAuthority('PAGE_UNITS:WRITE')") // <-- DEĞİŞTİ
    public ResponseEntity<Void> deleteUnit(@PathVariable String id) {
        unitService.deleteUnit(id);
        return ResponseEntity.noContent().build();
    }
}