// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/controller/MaterialDefinitionController.java
package com.ajinternational.ajserver.modules.inventory.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.inventory.model.MaterialDefinition;
import com.ajinternational.ajserver.modules.inventory.service.MaterialDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/definitions/materials")
@RequiredArgsConstructor
public class MaterialDefinitionController {

    private final MaterialDefinitionService service;

    @GetMapping
    @HasPermission("PAGE_INVENTORY_DEFINITIONS:READ")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DEFINITIONS:READ')")
    public ResponseEntity<List<MaterialDefinition>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    @HasPermission("PAGE_INVENTORY_DEFINITIONS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DEFINITIONS:WRITE')")
    public ResponseEntity<MaterialDefinition> save(@Valid @RequestBody MaterialDefinition definition) {
        return ResponseEntity.ok(service.save(definition));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_INVENTORY_DEFINITIONS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DEFINITIONS:WRITE')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}