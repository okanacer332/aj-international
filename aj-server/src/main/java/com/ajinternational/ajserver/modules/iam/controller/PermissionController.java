package com.ajinternational.ajserver.modules.iam.controller;

import com.ajinternational.ajserver.config.security.HasPermission; // Yeni import
import com.ajinternational.ajserver.modules.iam.service.PermissionService;
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
// @PreAuthorize("hasRole('ADMIN')") // Bu satırı siliyoruz
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    @HasPermission("PAGE_ROLES:READ") // Yetki tarayıcısı için işaretleyici
    @PreAuthorize("hasAuthority('PAGE_ROLES:READ')") // Güvenlik kontrolü
    public ResponseEntity<Set<String>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getSystemPermissions());
    }
}