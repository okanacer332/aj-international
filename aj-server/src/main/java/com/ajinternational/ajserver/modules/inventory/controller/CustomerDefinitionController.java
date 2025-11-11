// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/controller/CustomerDefinitionController.java
package com.ajinternational.ajserver.modules.inventory.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.inventory.model.CustomerDefinition;
import com.ajinternational.ajserver.modules.inventory.service.CustomerDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/definitions/customers")
@RequiredArgsConstructor
public class CustomerDefinitionController {

    private final CustomerDefinitionService service;

    @GetMapping
    @HasPermission("PAGE_INVENTORY_DEFINITIONS:READ")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DEFINITIONS:READ')")
    public ResponseEntity<List<CustomerDefinition>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    @HasPermission("PAGE_INVENTORY_DEFINITIONS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DEFINITIONS:WRITE')")
    public ResponseEntity<CustomerDefinition> save(@Valid @RequestBody CustomerDefinition definition) {
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