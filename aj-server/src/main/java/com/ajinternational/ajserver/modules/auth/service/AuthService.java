package com.ajinternational.ajserver.modules.auth.service;

import com.ajinternational.ajserver.config.JwtUtil;
import com.ajinternational.ajserver.modules.auth.dto.AuthResponse;
import com.ajinternational.ajserver.modules.auth.dto.LoginRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    // AuthenticationManager'ı SecurityConfig'de bean olarak oluşturup buraya enjekte edeceğiz.
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public AuthResponse login(LoginRequest request) {
        // 1. Spring Security'nin AuthenticationManager'ını kullanarak kimlik doğrulaması yap.
        // Bu, arka planda CustomUserDetailsService'i ve PasswordEncoder'ı kullanır.
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        // 2. Kimlik doğrulama başarılıysa, token oluşturmak için UserDetails'i al.
        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.username());

        // 3. JWT'yi oluştur.
        final String accessToken = jwtUtil.generateToken(userDetails);

        return new AuthResponse(accessToken);
    }
}