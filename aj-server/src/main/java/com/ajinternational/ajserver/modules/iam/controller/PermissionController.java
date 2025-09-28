package com.ajinternational.ajserver.modules.iam.controller;

import com.ajinternational.ajserver.modules.iam.service.PermissionService; // Yeni servisi import et
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/iam/permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PermissionController {

    private final PermissionService permissionService; // Artık servisi enjekte ediyoruz

    @GetMapping
    public ResponseEntity<Set<String>> getAllPermissions() {
        // Yetkileri servisten alıp döndürüyoruz
        return ResponseEntity.ok(permissionService.getSystemPermissions());
    }
}