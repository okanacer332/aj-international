package com.ajinternational.ajserver.modules.iam.controller;

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
@PreAuthorize("hasRole('ADMIN')") // Sadece Admin'ler erişebilir
public class PermissionController {

    // Bu liste, projemizdeki tüm yetkileri tanımlar.
    // Gelecekte yeni bir yetki eklendiğinde, bu listeye de eklenmesi gerekir.
    private static final Set<String> SYSTEM_PERMISSIONS = Set.of(
            // Kullanıcı Yönetimi Yetkileri
            "USER:CREATE",
            "USER:READ",
            "USER:UPDATE",
            "USER:DELETE",

            // Rol Yönetimi Yetkileri
            "ROLE:CREATE",
            "ROLE:READ",
            "ROLE:UPDATE",
            "ROLE:DELETE",

            // Görev Yönetimi Yetkileri (Gelecek için)
            "TASK:CREATE",
            "TASK:READ",
            "TASK:UPDATE",
            "TASK:DELETE",
            "TASK:ASSIGN",

            // Raporlama Yetkileri (Gelecek için)
            "REPORT:READ"
    );

    @GetMapping
    public ResponseEntity<Set<String>> getAllPermissions() {
        return ResponseEntity.ok(SYSTEM_PERMISSIONS);
    }
}