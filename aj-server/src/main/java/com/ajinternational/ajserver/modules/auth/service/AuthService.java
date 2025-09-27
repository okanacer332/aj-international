package com.ajinternational.ajserver.modules.auth.service;

import com.ajinternational.ajserver.config.JwtUtil;
import com.ajinternational.ajserver.modules.auth.dto.AuthResponse;
import com.ajinternational.ajserver.modules.auth.dto.LoginRequest;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService; // Log servisini import et
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final AuditLogService auditLogService; // Log servisini enjekte et

    public AuthResponse login(LoginRequest request) {
        try {
            // Kimlik doğrulama denemesi
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            // Başarılı olursa, token üret
            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.username());
            final String accessToken = jwtUtil.generateToken(userDetails);

            // Başarılı giriş logu oluştur
            auditLogService.logAction(request.username(), "USER_LOGIN_SUCCESS", "Kullanıcı başarıyla giriş yaptı.");

            return new AuthResponse(accessToken);
        } catch (Exception e) {
            // Başarısız giriş denemesi logu oluştur
            auditLogService.logAction(request.username(), "USER_LOGIN_FAILURE", "Hatalı giriş denemesi.");
            // Hatayı tekrar fırlatarak frontend'in haberdar olmasını sağla
            throw e;
        }
    }
}