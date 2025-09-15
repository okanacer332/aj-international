package com.ajinternational.ajserver.modules.auth.controller;

import com.ajinternational.ajserver.modules.auth.dto.LoginRequest;
import com.ajinternational.ajserver.modules.auth.dto.RegisterRequest;
import com.ajinternational.ajserver.modules.auth.dto.AuthResponse;
import com.ajinternational.ajserver.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok("Kayıt başarılı");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
