// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/controller/SupplierDefinitionController.java
package com.ajinternational.ajserver.modules.inventory.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.inventory.model.SupplierDefinition;
import com.ajinternational.ajserver.modules.inventory.service.SupplierDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/definitions/suppliers")
@RequiredArgsConstructor
public class SupplierDefinitionController {

    private final SupplierDefinitionService service;

    @GetMapping
    @HasPermission("PAGE_INVENTORY_DEFINITIONS:READ")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DEFINITIONS:READ')")
    public ResponseEntity<List<SupplierDefinition>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    @HasPermission("PAGE_INVENTORY_DEFINITIONS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DEFINITIONS:WRITE')")
    public ResponseEntity<SupplierDefinition> save(@Valid @RequestBody SupplierDefinition definition) {
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