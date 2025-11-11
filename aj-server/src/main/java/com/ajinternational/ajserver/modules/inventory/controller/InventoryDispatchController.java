// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/controller/InventoryDispatchController.java
package com.ajinternational.ajserver.modules.inventory.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.inventory.dto.InventoryDispatchRequest;
import com.ajinternational.ajserver.modules.inventory.dto.InventoryDispatchResponse;
import com.ajinternational.ajserver.modules.inventory.model.InventoryDispatch;
import com.ajinternational.ajserver.modules.inventory.service.InventoryDispatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/dispatch")
@RequiredArgsConstructor
public class InventoryDispatchController {

    private final InventoryDispatchService dispatchService;

    // Yeni İzin Anahtarı: PAGE_INVENTORY_DISPATCH
    @GetMapping
    @HasPermission("PAGE_INVENTORY_DISPATCH:READ")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DISPATCH:READ')")
    public ResponseEntity<List<InventoryDispatchResponse>> getAllDispatches() {
        return ResponseEntity.ok(dispatchService.findAllDispatches());
    }

    @PostMapping
    @HasPermission("PAGE_INVENTORY_DISPATCH:WRITE")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DISPATCH:WRITE')")
    public ResponseEntity<InventoryDispatch> createDispatch(@Valid @RequestBody InventoryDispatchRequest request) {
        return ResponseEntity.ok(dispatchService.createDispatch(request));
    }

    @PutMapping("/{id}")
    @HasPermission("PAGE_INVENTORY_DISPATCH:WRITE")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DISPATCH:WRITE')")
    public ResponseEntity<InventoryDispatch> updateDispatch(@PathVariable String id, @Valid @RequestBody InventoryDispatchRequest request) {
        return ResponseEntity.ok(dispatchService.updateDispatch(id, request));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_INVENTORY_DISPATCH:WRITE")
    @PreAuthorize("hasAuthority('PAGE_INVENTORY_DISPATCH:WRITE')")
    public ResponseEntity<Void> deleteDispatch(@PathVariable String id) {
        dispatchService.deleteDispatch(id);
        return ResponseEntity.noContent().build();
    }
}