package com.ajinternational.ajserver.modules.iam.service;

// --- Gerekli importlar eklendi ---
import com.ajinternational.ajserver.config.JwtUtil;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.iam.dto.ChangePasswordRequest;
import com.ajinternational.ajserver.modules.iam.dto.CreateUserRequest;
import com.ajinternational.ajserver.modules.iam.dto.UpdateProfileRequest;
import com.ajinternational.ajserver.modules.iam.dto.UpdateUserRequest;
import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
// GrantedAuthority import edildi
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
// --- Importlar sonu ---

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final JwtUtil jwtUtil;

    // --- Tenant Context Helper Metodu ---
    // Değişiklik: isAdmin boolean'ı isSuperAdmin olarak yeniden adlandırıldı ve rol kontrolü eklendi
    private record TenantContext(String tenantId, boolean isSuperAdmin) {}

    private TenantContext getCurrentTenantContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            logger.warn("Kimliği doğrulanmamış kullanıcı veya anonymousUser tenant bilgisi almaya çalıştı.");
            throw new AccessDeniedException("Bu işlem için kimlik doğrulaması gerekiyor.");
        }

        String username = authentication.getName();
        // --- DEĞİŞİKLİK BURADA: Rol kontrolü ---
        // Kullanıcının yetkilerini al ve 'ROLE_SUPER_ADMIN' içerip içermediğini kontrol et
        boolean isSuperAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_SUPER_ADMIN"::equals);
        // --- DEĞİŞİKLİK SONU ---

        // isSuperAdmin değilse, tenantId'yi token'dan al
        if (!isSuperAdmin) {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String authHeader = request.getHeader("Authorization");
            if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    String tenantIdFromToken = jwtUtil.extractTenantId(token);
                    if (!StringUtils.hasText(tenantIdFromToken)) {
                        logger.error("Kullanıcı token'ında tenantId bulunamadı: {}", username);
                        throw new AccessDeniedException("Tenant bilgisi eksik.");
                    }
                    logger.debug("Kullanıcı '{}' için Tenant ID token'dan alındı: {}", username, tenantIdFromToken);
                    // Değişiklik: isAdmin yerine isSuperAdmin
                    return new TenantContext(tenantIdFromToken, false);
                } catch (Exception e) {
                    logger.error("Kullanıcı '{}' için token parse edilemedi veya geçersiz: {}", username, e.getMessage());
                    throw new AccessDeniedException("Geçersiz veya süresi dolmuş token.");
                }
            } else {
                logger.warn("Kullanıcı '{}' için Authorization header bulunamadı veya Bearer token değil.", username);
                throw new AccessDeniedException("Authorization token eksik.");
            }
        }

        // isSuperAdmin ise log mesajını güncelle ve tenantId=null dön
        logger.debug("SUPER_ADMIN kullanıcısı '{}' işlem yapıyor. Tenant filtresi uygulanmayacak.", username);
        // Değişiklik: isAdmin yerine isSuperAdmin
        return new TenantContext(null, true); // Admin için tenantId null
    }
    // --- Helper Metot Sonu ---


    public List<User> getAllUsers() {
        TenantContext context = getCurrentTenantContext();

        // Değişiklik: isAdmin yerine isSuperAdmin
        if (context.isSuperAdmin()) {
            logger.info("SUPER_ADMIN kullanıcısı tüm tenantlardaki kullanıcıları listeliyor.");
            return userRepository.findAll();
        } else {
            logger.info("Tenant '{}' için kullanıcılar listeleniyor.", context.tenantId());
            return userRepository.findByTenantId(context.tenantId());
        }
    }

    public Optional<User> getUserById(String id) {
        TenantContext context = getCurrentTenantContext();
        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Değişiklik: isAdmin yerine isSuperAdmin
            if (!context.isSuperAdmin() && !user.getTenantId().equals(context.tenantId())) {
                logger.warn("Yetkisiz Erişim Denemesi: Kullanıcı (Tenant: {}), farklı tenanta (Tenant: {}) ait kullanıcıyı (ID: {}) sorgulamaya çalıştı.",
                        context.tenantId(), user.getTenantId(), id);
                return Optional.empty();
            }
            logger.debug("Kullanıcı bulundu: ID={}, Username={}, Tenant={}", user.getId(), user.getUsername(), user.getTenantId());
            return userOpt;
        } else {
            logger.warn("Arama Hatası: ID'si '{}' olan kullanıcı bulunamadı.", id);
            return Optional.empty();
        }
    }


    public User createUser(CreateUserRequest request) {
        TenantContext context = getCurrentTenantContext();
        String targetTenantId;

        // Değişiklik: isAdmin yerine isSuperAdmin
        if (context.isSuperAdmin()) {
            if (!StringUtils.hasText(request.tenantId())) {
                logger.error("SUPER_ADMIN kullanıcısı kullanıcı oluştururken tenant ID belirtmedi.");
                throw new IllegalArgumentException("SUPER_ADMIN kullanıcılar, kullanıcı oluştururken tenant ID belirtmelidir.");
            }
            targetTenantId = request.tenantId();
            logger.info("SUPER_ADMIN yeni kullanıcıyı Tenant '{}' için oluşturuyor.", targetTenantId);
        } else {
            if (!request.tenantId().equals(context.tenantId())) {
                logger.error("Yetkisiz Kullanıcı Oluşturma Denemesi: Kullanıcı (Tenant: {}), farklı bir tenant'a ({}) kullanıcı eklemeye çalıştı.", context.tenantId(), request.tenantId());
                throw new AccessDeniedException("Sadece kendi operasyon ülkenize kullanıcı ekleyebilirsiniz.");
            }
            targetTenantId = context.tenantId();
            logger.info("Kullanıcı (Tenant: {}) kendi tenant'ına yeni kullanıcı oluşturuyor.", targetTenantId);
        }

        // --- SUPER_ADMIN rol atama kontrolü ---
        Optional<Role> superAdminRoleOpt = roleRepository.findByName("SUPER_ADMIN");
        if (request.roleIds().contains(superAdminRoleOpt.map(Role::getId).orElse(""))) {
            if (!context.isSuperAdmin()) {
                logger.error("Yetkisiz SUPER_ADMIN Rol Atama Denemesi: Kullanıcı (Tenant: {}), SUPER_ADMIN rolünü atamaya çalıştı.", context.tenantId());
                throw new AccessDeniedException("SUPER_ADMIN rolünü atama yetkiniz yok.");
            }
        }
        // --- Kontrol sonu ---


        String generatedUsername = generateUsername(request.fullName());
        if (userRepository.existsByUsernameAndTenantId(generatedUsername, targetTenantId)) {
            logger.error("Kullanıcı Oluşturma Hatası: Kullanıcı adı '{}', Tenant '{}' için zaten mevcut.", generatedUsername, targetTenantId);
            throw new IllegalArgumentException("Bu kullanıcı adı bu operasyon ülkesi için zaten mevcut: " + generatedUsername);
        }

        validateRoleIds(request.roleIds()); // Rol ID'lerini doğrula

        User newUser = new User();
        // ... (newUser alanlarını ayarlama kısmı aynı) ...
        newUser.setFullName(request.fullName());
        newUser.setUsername(generatedUsername);
        newUser.setEmail(request.email());
        newUser.setTenantId(targetTenantId);
        newUser.setPassword(passwordEncoder.encode("1234"));
        newUser.setRoleIds(request.roleIds());
        newUser.setActive(true);

        User savedUser = userRepository.save(newUser);
        auditLogService.logAction(getCurrentUsername(), "USER_CREATED", String.format("Yeni kullanıcı oluşturuldu: %s (Tenant: %s)", savedUser.getUsername(), savedUser.getTenantId()));
        logger.info("Yeni kullanıcı başarıyla oluşturuldu: ID={}, Username={}, Tenant={}", savedUser.getId(), savedUser.getUsername(), savedUser.getTenantId());
        return savedUser;
    }

    // getCurrentUsername metodu aynı kalabilir
    private String getCurrentUsername() { /* ... */
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return "SYSTEM";
        }
        return authentication.getName();
    }

    public User updateUser(String userId, UpdateUserRequest request) {
        TenantContext context = getCurrentTenantContext();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Güncellenecek kullanıcı bulunamadı: " + userId));

        // Değişiklik: isAdmin yerine isSuperAdmin
        if (!context.isSuperAdmin() && !user.getTenantId().equals(context.tenantId())) {
            logger.error("Yetkisiz Güncelleme Denemesi: Kullanıcı (Tenant: {}), farklı tenanta (Tenant: {}) ait kullanıcıyı (ID: {}) güncellemeye çalıştı.",
                    context.tenantId(), user.getTenantId(), userId);
            throw new AccessDeniedException("Bu kullanıcıyı güncelleme yetkiniz yok.");
        }

        // --- SUPER_ADMIN rol atama/kaldırma kontrolü ---
        Optional<Role> superAdminRoleOpt = roleRepository.findByName("SUPER_ADMIN");
        String superAdminRoleId = superAdminRoleOpt.map(Role::getId).orElse("");

        boolean tryingToAssignSuperAdmin = request.roleIds().contains(superAdminRoleId);
        boolean userHadSuperAdmin = user.getRoleIds().contains(superAdminRoleId);

        // Eğer SUPER_ADMIN rolü eklenmeye veya kaldırılmaya çalışılıyorsa VE işlemi yapan SUPER_ADMIN değilse hata ver
        if ((tryingToAssignSuperAdmin || userHadSuperAdmin) && !context.isSuperAdmin()) {
            logger.error("Yetkisiz SUPER_ADMIN Rol Değişikliği Denemesi: Kullanıcı (Tenant: {}), SUPER_ADMIN rolünü değiştirmeye çalıştı.", context.tenantId());
            throw new AccessDeniedException("SUPER_ADMIN rolünü değiştirme yetkiniz yok.");
        }
        // --- Kontrol sonu ---

        validateRoleIds(request.roleIds()); // Rol ID'lerini doğrula

        // ... (alanları güncelleme kısmı aynı) ...
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setActive(request.active());
        user.setRoleIds(request.roleIds());

        User updatedUser = userRepository.save(user);
        auditLogService.logAction(getCurrentUsername(), "USER_UPDATED", String.format("Kullanıcı güncellendi: %s (Tenant: %s)", updatedUser.getUsername(), updatedUser.getTenantId()));
        logger.info("Kullanıcı başarıyla güncellendi: ID={}, Username={}, Tenant={}", updatedUser.getId(), updatedUser.getUsername(), updatedUser.getTenantId());
        return updatedUser;
    }

    public void deleteUser(String userId) {
        TenantContext context = getCurrentTenantContext();
        User userToDelete = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Silinecek kullanıcı bulunamadı: " + userId));

        // Değişiklik: isAdmin yerine isSuperAdmin
        if (!context.isSuperAdmin() && !userToDelete.getTenantId().equals(context.tenantId())) {
            logger.error("Yetkisiz Silme Denemesi: Kullanıcı (Tenant: {}), farklı tenanta (Tenant: {}) ait kullanıcıyı (ID: {}) silmeye çalıştı.",
                    context.tenantId(), userToDelete.getTenantId(), userId);
            throw new AccessDeniedException("Bu kullanıcıyı silme yetkiniz yok.");
        }

        // --- SUPER_ADMIN silme kontrolü ---
        // Sadece başka bir SUPER_ADMIN, bir SUPER_ADMIN'i silebilir (kendini silemez durumu eklenebilir)
        Optional<Role> superAdminRoleOpt = roleRepository.findByName("SUPER_ADMIN");
        String superAdminRoleId = superAdminRoleOpt.map(Role::getId).orElse("");
        if (userToDelete.getRoleIds().contains(superAdminRoleId) && !context.isSuperAdmin()) {
            logger.error("Yetkisiz SUPER_ADMIN Silme Denemesi: Kullanıcı (Tenant: {}), SUPER_ADMIN kullanıcısını silmeye çalıştı.", context.tenantId());
            throw new AccessDeniedException("SUPER_ADMIN kullanıcısını silme yetkiniz yok.");
        }
        // İsteğe bağlı: Kendini silme kontrolü
        // if (userToDelete.getUsername().equals(context.username)) { // context'e username eklemek gerekir
        //    throw new IllegalArgumentException("Kendinizi silemezsiniz.");
        // }
        // --- Kontrol sonu ---


        String username = userToDelete.getUsername();
        String tenantId = userToDelete.getTenantId();
        userRepository.deleteById(userId);
        auditLogService.logAction(getCurrentUsername(), "USER_DELETED", String.format("Kullanıcı silindi: %s (Tenant: %s)", username, tenantId));
        logger.info("Kullanıcı başarıyla silindi: ID={}, Username={}, Tenant={}", userId, username, tenantId);
    }

    // --- generateUsername, updateMyProfile, changeMyPassword, getUserByUsername, updateAvatarUrl metotları aynı kalabilir ---
    private String generateUsername(String fullName) { /* ... */
        return fullName.trim().toLowerCase()
                .replace("ı", "i").replace("ğ", "g").replace("ü", "u")
                .replace("ş", "s").replace("ö", "o").replace("ç", "c")
                .replaceAll("\\s+", ".");
    }
    public User updateMyProfile(String username, UpdateProfileRequest request) { /* ... */
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + username));
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        User updatedUser = userRepository.save(user);
        auditLogService.logAction(username, "USER_PROFILE_UPDATED", "Kullanıcı kendi profilini güncelledi.");
        logger.info("Kullanıcı profilini güncelledi: Username={}", username);
        return updatedUser;
    }
    public void changeMyPassword(String username, ChangePasswordRequest request) { /* ... */
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + username));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            logger.warn("Kullanıcı '{}' için hatalı mevcut şifre denemesi.", username);
            throw new IllegalArgumentException("Mevcut şifre hatalı.");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        auditLogService.logAction(username, "USER_PASSWORD_CHANGED", "Kullanıcı kendi şifresini değiştirdi.");
        logger.info("Kullanıcı şifresini değiştirdi: Username={}", username);
    }
    public Optional<User> getUserByUsername(String username) { /* ... */
        Optional<User> userOptional = userRepository.findByUsername(username);
        userOptional.ifPresent(user -> {
            List<Role> roles = roleRepository.findAllById(user.getRoleIds());
            Set<String> permissions = roles.stream()
                    .flatMap(role -> role.getPermissions().stream())
                    .collect(Collectors.toSet());
            user.setPermissions(permissions);
            logger.debug("Kullanıcı '{}' için yetkiler yüklendi.", username);
        });
        if(userOptional.isEmpty()) {
            logger.warn("/me: Kullanıcı bulunamadı: {}", username);
        }
        return userOptional;
    }
    public void updateAvatarUrl(String username, String avatarUrl) { /* ... */
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + username));
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        auditLogService.logAction(username, "USER_AVATAR_UPDATED", "Kullanıcı profil fotoğrafını güncelledi.");
        logger.info("Kullanıcı avatarını güncelledi: Username={}", username);
    }

    // validateRoleIds metodu aynı kalabilir
    private void validateRoleIds(Set<String> roleIds) { /* ... */
        if (roleIds == null || roleIds.isEmpty()) {
            logger.error("Rol ID listesi boş olamaz.");
            throw new IllegalArgumentException("En az bir rol seçilmelidir.");
        }
        long foundRoles = roleRepository.countByIdIn(roleIds);
        if (foundRoles != roleIds.size()) {
            logger.error("Gönderilen rol ID'lerinden bazıları geçersiz veya bulunamadı. Gönderilen: {}, Bulunan: {}", roleIds.size(), foundRoles);
            throw new IllegalArgumentException("Geçersiz veya bulunamayan rol ID'leri gönderildi.");
        }
        logger.debug("Rol ID'leri doğrulandı: {}", roleIds);
    }
}