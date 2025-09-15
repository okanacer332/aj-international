package com.ajinternational.ajserver.modules.user.controller;

import com.ajinternational.ajserver.modules.auth.model.User;
import com.ajinternational.ajserver.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MeController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        String email = authentication.getName();
        User u = userRepository.findByEmail(email).orElse(null);

        return ResponseEntity.ok(Map.of(
                "email", email,
                "roles", authentication.getAuthorities(),
                "tenantId", u != null ? u.getTenantId() : null
        ));
    }
}
