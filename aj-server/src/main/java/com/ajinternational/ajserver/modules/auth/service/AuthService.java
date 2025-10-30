package com.ajinternational.ajserver.modules.auth.service;

import com.ajinternational.ajserver.config.JwtUtil;
import com.ajinternational.ajserver.modules.auth.dto.AuthResponse;
import com.ajinternational.ajserver.modules.auth.dto.LoginRequest;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.iam.model.User; // Eklendi
import com.ajinternational.ajserver.modules.iam.repository.UserRepository; // Eklendi
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException; // Eklendi
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
    private final AuditLogService auditLogService;
    private final UserRepository userRepository; // Eklendi

    public AuthResponse login(LoginRequest request) {
        try {
            // 1. Adım: Kullanıcı adı ve şifreyi doğrula (Spring Security)
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            // 2. Adım: Kullanıcı detaylarını ve rollerini çek
            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.username());

            // 3. Adım: Süper Admin mi kontrol et
            boolean isSuperAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

            // 4. Adım: Tenant (Ülke) doğrulaması
            if (!isSuperAdmin) {
                // Süper admin değilse, kullanıcının DB'deki tenantId'sini kontrol et
                User user = userRepository.findByUsername(request.username())
                        .orElseThrow(() -> new BadCredentialsException("Kullanıcı veritabanında bulunamadı."));

                if (!user.getTenantId().equals(request.tenantId())) {
                    // Kullanıcı var ama yanlış ülkeye girmeye çalışıyor
                    auditLogService.logAction(request.tenantId(), request.username(), "USER_LOGIN_FAILURE", "Hatalı tenant (ülke) seçimi.");
                    throw new BadCredentialsException("Kullanıcı bu operasyon ülkesi için yetkili değil.");
                }
            }

            // 5. Adım: Token üret (Artık tenantId'yi de token'a ekleyeceğiz)
            // (JwtUtil'i bir sonraki adımda güncelleyeceğiz)
            final String accessToken = jwtUtil.generateToken(userDetails, request.tenantId());

            // 6. Adım: Başarılı giriş logu (tenantId ile birlikte)
            // (AuditLogService'i bir sonraki adımda güncelleyeceğiz)
            auditLogService.logAction(request.tenantId(), request.username(), "USER_LOGIN_SUCCESS", "Kullanıcı başarıyla giriş yaptı.");

            return new AuthResponse(accessToken);

        } catch (Exception e) {
            // 7. Adım: Başarısız giriş denemesi logu
            auditLogService.logAction(request.tenantId(), request.username(), "USER_LOGIN_FAILURE", "Hatalı giriş denemesi: " + e.getMessage());
            // Hatayı tekrar fırlatarak frontend'in haberdar olmasını sağla
            throw e;
        }
    }
}