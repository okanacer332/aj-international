package com.ajinternational.ajserver.modules.auth.service;

import com.ajinternational.ajserver.config.JwtUtil;
import com.ajinternational.ajserver.modules.auth.dto.AuthResponse;
import com.ajinternational.ajserver.modules.auth.dto.LoginRequest;
import com.ajinternational.ajserver.modules.auth.dto.RegisterRequest;
import com.ajinternational.ajserver.modules.auth.model.User;
import com.ajinternational.ajserver.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Bu email zaten kayıtlı");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password())); // şifre hash
        user.setTenantId(request.tenantId());
        user.getRoles().add("USER");
        user.setActive(true);

        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new RuntimeException("Şifre hatalı");
        }

        // Gerçek JWT üret
        String accessToken = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(accessToken, "dummy-refresh-token");
    }
}
