// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/controller/InventoryEntryController.java
package com.ajinternational.ajserver.modules.inventory.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.inventory.dto.InventoryEntryRequest;
import com.ajinternational.ajserver.modules.inventory.dto.InventoryEntryResponse;
import com.ajinternational.ajserver.modules.inventory.model.InventoryEntry;
import com.ajinternational.ajserver.modules.inventory.service.InventoryEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/entry")
@RequiredArgsConstructor
public class InventoryEntryController {

    private final InventoryEntryService entryService;

    // Yeni İzin Anahtarı: PAGE_INVENTORY_ENTRY
    @GetMapping
    @HasPermission("PAGE_INVENTORY_ENTRY:READ")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_ENTRY:READ')")
    public ResponseEntity<List<InventoryEntryResponse>> getAllEntries() {
        return ResponseEntity.ok(entryService.findAllEntries());
    }

    @PostMapping
    @HasPermission("PAGE_INVENTORY_ENTRY:WRITE")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_ENTRY:WRITE')")
    public ResponseEntity<InventoryEntry> createEntry(@Valid @RequestBody InventoryEntryRequest request) {
        return ResponseEntity.ok(entryService.createEntry(request));
    }

    @PutMapping("/{id}")
    @HasPermission("PAGE_INVENTORY_ENTRY:WRITE")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_ENTRY:WRITE')")
    public ResponseEntity<InventoryEntry> updateEntry(@PathVariable String id, @Valid @RequestBody InventoryEntryRequest request) {
        return ResponseEntity.ok(entryService.updateEntry(id, request));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_INVENTORY_ENTRY:WRITE")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_ENTRY:WRITE')")
    public ResponseEntity<Void> deleteEntry(@PathVariable String id) {
        entryService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }
}