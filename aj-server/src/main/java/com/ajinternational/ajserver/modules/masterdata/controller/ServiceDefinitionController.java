package com.ajinternational.ajserver.modules.masterdata.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.masterdata.model.ServiceDefinition;
import com.ajinternational.ajserver.modules.masterdata.service.ServiceDefinitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/masterdata/services") // API yolunu 'services' olarak belirledik
@RequiredArgsConstructor
public class ServiceDefinitionController {

    private final ServiceDefinitionService service;

    @GetMapping
    @HasPermission("PAGE_SERVICES:READ")
    @PreAuthorize("hasAuthority('PAGE_SERVICES:READ')")
    public ResponseEntity<List<ServiceDefinition>> getAllServices() {
        return ResponseEntity.ok(service.findAllServices());
    }

    @PostMapping
    @HasPermission("PAGE_SERVICES:WRITE")
    @PreAuthorize("hasAuthority('PAGE_SERVICES:WRITE')")
    public ResponseEntity<ServiceDefinition> saveService(@Valid @RequestBody ServiceDefinition serviceDefinition) {
        return ResponseEntity.ok(service.saveService(serviceDefinition));
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_SERVICES:WRITE")
    @PreAuthorize("hasAuthority('PAGE_SERVICES:WRITE')")
    public ResponseEntity<Void> deleteService(@PathVariable String id) {
        service.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}