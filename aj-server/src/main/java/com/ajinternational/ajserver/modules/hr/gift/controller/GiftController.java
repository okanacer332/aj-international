package com.ajinternational.ajserver.modules.hr.gift.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.hr.gift.dto.CreateGiftRequest;
import com.ajinternational.ajserver.modules.hr.gift.dto.GiftRecordResponse;
import com.ajinternational.ajserver.modules.hr.gift.model.GiftRecord;
import com.ajinternational.ajserver.modules.hr.gift.service.GiftRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hr/gifts")
@RequiredArgsConstructor
public class GiftController {

    private final GiftRecordService service;

    @GetMapping
    @HasPermission("PAGE_GIFTS:READ")
    @PreAuthorize("hasAuthority('PAGE_GIFTS:READ')")
    public ResponseEntity<List<GiftRecordResponse>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @PostMapping
    @HasPermission("PAGE_GIFTS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_GIFTS:WRITE')")
    public ResponseEntity<GiftRecord> create(@Valid @RequestBody CreateGiftRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_GIFTS:WRITE")
    @PreAuthorize("hasAuthority('PAGE_GIFTS:WRITE')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}