package com.ajinternational.ajserver.modules.hr.personnel.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.hr.personnel.model.BonusDefinition;
import com.ajinternational.ajserver.modules.hr.personnel.service.BonusDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/bonus-definitions")
@RequiredArgsConstructor
public class BonusDefinitionController {

    private final BonusDefinitionService service;

    @GetMapping
    @HasPermission("PAGE_BONUS_DEFINITIONS:READ")
    @PreAuthorize("hasAuthority('PAGE_BONUS_DEFINITIONS:READ')")
    public ResponseEntity<List<BonusDefinition>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    @HasPermission("PAGE_BONUS_DEFINITIONS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_BONUS_DEFINITIONS:WRITE')")
    public ResponseEntity<BonusDefinition> save(@RequestBody BonusDefinition bonusDefinition) {
        return ResponseEntity.ok(service.save(bonusDefinition));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_BONUS_DEFINITIONS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_BONUS_DEFINITIONS:WRITE')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}