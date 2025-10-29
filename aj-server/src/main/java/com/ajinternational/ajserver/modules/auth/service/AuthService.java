package com.ajinternational.ajserver.modules.auth.service;

import com.ajinternational.ajserver.config.JwtUtil;
import com.ajinternational.ajserver.modules.auth.dto.AuthResponse;
import com.ajinternational.ajserver.modules.auth.dto.LoginRequest;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.iam.model.Role; // Role import edildi
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository; // RoleRepository import edildi
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
// AuthenticationManager kaldırıldı
// import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
// UsernamePasswordAuthenticationToken kaldırıldı
// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// GrantedAuthority ve SimpleGrantedAuthority import edildi
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder; // PasswordEncoder import edildi
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.util.Collection; // Collection import edildi
import java.util.Set; // Set import edildi
import java.util.stream.Collectors; // Collectors import edildi
import java.util.stream.Stream; // Stream import edildi

@Service
@RequiredArgsConstructor
public class AuthService {

    // AuthenticationManager kaldırıldı
    // private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService; // UserDetails oluşturmak için hala kullanılabilir veya manuel yapabiliriz
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // PasswordEncoder enjekte edildi
    private final RoleRepository roleRepository; // RoleRepository enjekte edildi (Yetkiler için)

    public AuthResponse login(LoginRequest request) {
        String username = request.username();
        String tenantId = request.tenantId();
        String password = request.password();

        try {
            // 1. Kullanıcıyı username ve tenantId ile bul
            // BU METODU UserRepository'ye eklememiz gerekecek!
            User user = userRepository.findByUsernameAndTenantId(username, tenantId)
                    .orElseThrow(() -> {
                        // Kullanıcı bulunamadıysa, hangi tenantta arandığını logla
                        auditLogService.logAction(username, "USER_LOGIN_FAILURE", "Kullanıcı bulunamadı. Aranan Tenant: " + tenantId);
                        // Genel hata mesajı fırlat
                        return new BadCredentialsException("Kullanıcı adı, şifre veya operasyon ülkesi hatalı.");
                    });

            // 2. Şifreyi manuel olarak kontrol et
            if (!passwordEncoder.matches(password, user.getPassword())) {
                auditLogService.logAction(username, "USER_LOGIN_FAILURE", "Hatalı şifre girişi. Tenant: " + tenantId);
                throw new BadCredentialsException("Kullanıcı adı, şifre veya operasyon ülkesi hatalı.");
            }

            // 3. Kullanıcı aktif mi kontrol et
            if (!user.isActive()) {
                auditLogService.logAction(username, "USER_LOGIN_FAILURE", "Pasif kullanıcı girişi denemesi. Tenant: " + tenantId);
                throw new BadCredentialsException("Kullanıcı hesabı pasif durumdadır.");
            }

            // 4. UserDetails nesnesini manuel olarak oluştur (Yetkiler için)
            // Roller ve izinlerden yetkileri oluştur
            Set<Role> roles = roleRepository.findAllById(user.getRoleIds()).stream().collect(Collectors.toSet());
            Set<GrantedAuthority> authorities = roles.stream()
                    .flatMap(role -> Stream.concat(
                            Stream.of(new SimpleGrantedAuthority("ROLE_" + role.getName().toUpperCase())), // Rol yetkisi (ROLE_ADMIN gibi)
                            role.getPermissions().stream().map(SimpleGrantedAuthority::new) // İzin yetkileri (PAGE_USERS:READ gibi)
                    ))
                    .collect(Collectors.toSet());

            // Spring Security'nin UserDetails arayüzünü implemente eden User nesnesini oluştur
            UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                    user.getUsername(),
                    user.getPassword(), // Şifre hash'i (token'a eklenmez, sadece nesne için)
                    user.isActive(),
                    true, // accountNonExpired
                    true, // credentialsNonExpired
                    true, // accountNonLocked
                    authorities // Hesaplanan yetkiler
            );


            // 5. Token üretimi için tenant ID'yi belirle
            boolean isSuperAdmin = "admin".equals(username); // Basit admin kontrolü
            // Süper admin ise kendi tenantını (örn: "SYSTEM"), değilse istekteki tenantı kullan
            String effectiveTenantId = isSuperAdmin ? user.getTenantId() : tenantId;

            // 6. Token üret
            final String accessToken = jwtUtil.generateToken(userDetails, effectiveTenantId);

            // 7. Başarılı giriş logu oluştur
            auditLogService.logAction(username, "USER_LOGIN_SUCCESS", "Kullanıcı başarıyla giriş yaptı. Tenant: " + effectiveTenantId);

            return new AuthResponse(accessToken);

        } catch (BadCredentialsException e) {
            // Hatalı şifre veya kullanıcı bulunamadı durumları zaten loglandı.
            // Sadece hatayı tekrar fırlat.
            throw e;
        } catch (Exception e) {
            // Beklenmedik diğer hatalar için loglama
            auditLogService.logAction(username, "USER_LOGIN_FAILURE", "Giriş sırasında bilinmeyen hata: " + e.getMessage() + ". Tenant: " + tenantId);
            // Genel hata mesajı fırlat
            throw new BadCredentialsException("Giriş sırasında bir hata oluştu.");
        }
    }
}