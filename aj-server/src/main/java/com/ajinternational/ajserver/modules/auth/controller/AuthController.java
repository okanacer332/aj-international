package com.ajinternational.ajserver.modules.auth.controller;

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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Register endpoint'i kaldırıldı.
    // Kullanıcılar artık sadece admin tarafından IAM UserController üzerinden oluşturulacak.

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}