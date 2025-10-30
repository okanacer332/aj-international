package com.ajinternational.ajserver.modules.auth.controller;

import com.ajinternational.ajserver.config.TenantContextHolder; // YENİ IMPORT
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.auth.dto.AuthResponse;
import com.ajinternational.ajserver.modules.auth.dto.LoginRequest;
import com.ajinternational.ajserver.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuditLogService auditLogService;

    // Register endpoint'i kaldırıldı.

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {

            // GÜNCELLENDİ: Artık 4 parametre gönderiyoruz.
            // O anki tenantId'yi TenantContextHolder'dan alıyoruz.
            auditLogService.logAction(
                    TenantContextHolder.getCurrentTenantId(), // 1. tenantId
                    authentication.getName(),                 // 2. username
                    "USER_LOGOUT_SUCCESS",                    // 3. action
                    "Kullanıcı başarıyla çıkış yaptı."         // 4. details
            );
        }
        return ResponseEntity.ok("Çıkış loglandı.");
    }
}