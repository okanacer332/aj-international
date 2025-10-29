package com.ajinternational.ajserver.modules.auth.service;

import com.ajinternational.ajserver.config.JwtUtil;
import com.ajinternational.ajserver.modules.auth.dto.AuthResponse;
import com.ajinternational.ajserver.modules.auth.dto.LoginRequest;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
// User modelini import et
import com.ajinternational.ajserver.modules.iam.model.User;
// UserRepository'yi import et
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException; // Eklendi
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException; // Eklendi

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final AuditLogService auditLogService;
    // UserRepository'yi enjekte et
    private final UserRepository userRepository;

    public AuthResponse login(LoginRequest request) {
        try {
            // 1. Kullanıcı adı ve şifre ile kimlik doğrulama denemesi
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            // 2. Kimlik doğrulama başarılıysa, UserDetails nesnesini al
            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.username());

            // 3. Tam User nesnesini veritabanından çek
            User user = userRepository.findByUsername(request.username())
                    .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı: " + request.username()));

            // 4. Tenant ID Kontrolü VE Aktiflik Kontrolü
            boolean isSuperAdmin = "admin".equals(request.username());
            // Tenant ID'yi belirle: Süper admin ise kullanıcının kendi tenant'ı, değilse istekteki tenant
            String effectiveTenantId = isSuperAdmin ? user.getTenantId() : request.tenantId();

            if (!isSuperAdmin && !user.getTenantId().equals(request.tenantId())) {
                auditLogService.logAction(request.username(), "USER_LOGIN_FAILURE", "Hatalı tenant ID girişi denemesi: " + request.tenantId());
                throw new BadCredentialsException("Kullanıcı bu operasyon ülkesi için yetkili değil.");
            }
            if (!user.isActive()) {
                auditLogService.logAction(request.username(), "USER_LOGIN_FAILURE", "Pasif kullanıcı girişi denemesi.");
                throw new BadCredentialsException("Kullanıcı hesabı pasif durumdadır.");
            }

            // 5. Tüm kontrollerden geçerse token üret
            // --- DEĞİŞİKLİK BURADA: generateToken'a effectiveTenantId geçiriliyor ---
            final String accessToken = jwtUtil.generateToken(userDetails, effectiveTenantId);
            // --- DEĞİŞİKLİK SONU ---

            // 6. Başarılı giriş logu oluştur (Tenant bilgisi eklenebilir)
            auditLogService.logAction(request.username(), "USER_LOGIN_SUCCESS", "Kullanıcı başarıyla giriş yaptı. Tenant: " + effectiveTenantId); // Logda da effectiveTenantId kullanıldı

            return new AuthResponse(accessToken);

        } catch (BadCredentialsException e) { // Sadece şifre hatasını yakala
            auditLogService.logAction(request.username(), "USER_LOGIN_FAILURE", "Hatalı şifre girişi denemesi.");
            throw e; // Orijinal hatayı fırlat
        } catch (Exception e) { // Diğer potansiyel hatalar
            if (!(e instanceof BadCredentialsException || e instanceof UsernameNotFoundException)) {
                auditLogService.logAction(request.username(), "USER_LOGIN_FAILURE", "Giriş sırasında bilinmeyen hata: " + e.getMessage());
            }
            throw new BadCredentialsException("Kullanıcı adı, şifre veya operasyon ülkesi hatalı ya da hesap aktif değil.");
        }
    }
}