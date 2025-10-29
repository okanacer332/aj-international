package com.ajinternational.ajserver.modules.iam.service;

// --- YENİ IMPORT ---
import com.ajinternational.ajserver.config.tenant.TenantContext;
// --- YENİ IMPORT SONU ---
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.iam.dto.ChangePasswordRequest;
import com.ajinternational.ajserver.modules.iam.dto.CreateUserRequest;
import com.ajinternational.ajserver.modules.iam.dto.UpdateProfileRequest;
import com.ajinternational.ajserver.modules.iam.dto.UpdateUserRequest;
import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger; // Logger eklendi
import org.slf4j.LoggerFactory; // Logger eklendi
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    // --- Logger eklendi ---
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    // --- Logger eklendi sonu ---

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
            return "SYSTEM";
        }
        return authentication.getName();
    }

    private String getCurrentTenantId() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            logger.error("İşlem sırasında geçerli Tenant ID bulunamadı!");
            throw new IllegalStateException("Tenant ID context'te bulunamadı.");
        }
        return tenantId;
    }


    public User createUser(CreateUserRequest request) {
        String currentTenantId = getCurrentTenantId();
        // İsteğin tenantId'si context ile uyuşmuyorsa hata verebiliriz (opsiyonel ama önerilir)
        if (!request.tenantId().equals(currentTenantId)) {
            logger.warn("createUser isteğindeki tenantId ({}) ile context'teki tenantId ({}) uyuşmuyor. Context'teki kullanılacak.", request.tenantId(), currentTenantId);
            // throw new IllegalArgumentException("İstek tenantId'si ile aktif tenant uyuşmuyor.");
        }

        String generatedUsername = generateUsername(request.fullName());
        // ÖNEMLİ NOT: Kullanıcı adlarının tenant bazında mı yoksa global mi unique olacağına karar verilmeli.
        // Mevcut kod global unique varsayıyor. Tenant bazında olacaksa existsByUsernameAndTenantId gibi bir metot gerekir.
        if (userRepository.existsByUsername(generatedUsername)) {
            logger.error("HATA: Tenant '{}' - Kullanıcı adı '{}' zaten mevcut. Yeni kullanıcı oluşturulamadı.", currentTenantId, generatedUsername);
            throw new IllegalArgumentException("Bu kullanıcı adı zaten mevcut: " + generatedUsername);
        }

        // Rollerin varlığını kontrol et (isteğe bağlı, güvenlik katmanı)
        long foundRoles = roleRepository.countByIdIn(request.roleIds());
        if (foundRoles != request.roleIds().size()) {
            logger.error("HATA: Tenant '{}' - Yeni kullanıcı için geçersiz rol ID'leri gönderildi: {}", currentTenantId, request.roleIds());
            throw new IllegalArgumentException("Geçersiz veya bulunamayan rol ID'leri gönderildi.");
        }

        User newUser = new User();
        newUser.setFullName(request.fullName());
        newUser.setUsername(generatedUsername);
        newUser.setEmail(request.email());
        // --- DEĞİŞİKLİK: Context'ten alınan tenantId kullanıldı ---
        newUser.setTenantId(currentTenantId);
        // --- DEĞİŞİKLİK SONU ---
        newUser.setPassword(passwordEncoder.encode("1234")); // Varsayılan şifre
        newUser.setRoleIds(request.roleIds());
        newUser.setActive(true); // Yeni kullanıcı varsayılan olarak aktif
        User savedUser = userRepository.save(newUser);

        logger.info("Yeni kullanıcı oluşturuldu: Tenant={}, Username={}", currentTenantId, savedUser.getUsername());
        auditLogService.logAction(getCurrentUsername(), "USER_CREATED", "Yeni kullanıcı oluşturuldu: " + savedUser.getUsername() + " (Tenant: " + currentTenantId + ")");
        return savedUser;
    }

    public User updateUser(String userId, UpdateUserRequest request) {
        String currentTenantId = getCurrentTenantId();
        // --- DEĞİŞİKLİK: findById yerine findByIdAndTenantId kullanıldı ---
        User user = userRepository.findByIdAndTenantId(userId, currentTenantId)
                .orElseThrow(() -> {
                    logger.error("Güncelleme Hatası: Tenant '{}' için ID'si '{}' olan kullanıcı bulunamadı.", currentTenantId, userId);
                    return new RuntimeException("Kullanıcı bulunamadı: " + userId);
                });
        // --- DEĞİŞİKLİK SONU ---

        long foundRoles = roleRepository.countByIdIn(request.roleIds());
        if (foundRoles != request.roleIds().size()) {
            logger.error("HATA: Tenant '{}' - Kullanıcı ({}) güncellemesi için geçersiz rol ID'leri gönderildi: {}", currentTenantId, user.getUsername(), request.roleIds());
            throw new IllegalArgumentException("Geçersiz veya bulunamayan rol ID'leri gönderildi.");
        }
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setActive(request.active());
        user.setRoleIds(request.roleIds());
        User updatedUser = userRepository.save(user);

        logger.info("Kullanıcı güncellendi: Tenant={}, Username={}", currentTenantId, updatedUser.getUsername());
        auditLogService.logAction(getCurrentUsername(), "USER_UPDATED", "Kullanıcı güncellendi: " + updatedUser.getUsername() + " (Tenant: " + currentTenantId + ")");
        return updatedUser;
    }

    public void deleteUser(String userId) {
        String currentTenantId = getCurrentTenantId();
        // --- DEĞİŞİKLİK: findById yerine findByIdAndTenantId kullanıldı ---
        Optional<User> userToDeleteOpt = userRepository.findByIdAndTenantId(userId, currentTenantId);
        // --- DEĞİŞİKLİK SONU ---

        if(userToDeleteOpt.isPresent()) {
            User userToDelete = userToDeleteOpt.get();
            String username = userToDelete.getUsername();
            userRepository.deleteById(userId); // ID ile silme yeterli
            logger.info("Kullanıcı silindi: Tenant={}, Username={}", currentTenantId, username);
            auditLogService.logAction(getCurrentUsername(), "USER_DELETED", "Kullanıcı silindi: " + username + " (Tenant: " + currentTenantId + ")");
        } else {
            logger.error("Silme Hatası: Tenant '{}' için ID'si '{}' olan kullanıcı bulunamadı.", currentTenantId, userId);
            throw new RuntimeException("Silinecek kullanıcı bulunamadı: " + userId);
        }
    }

    private String generateUsername(String fullName) {
        // Bu metot aynı kalabilir, kullanıcı adının tenant'tan bağımsız olduğunu varsayıyoruz.
        return fullName.trim().toLowerCase()
                .replace("ı", "i").replace("ğ", "g").replace("ü", "u")
                .replace("ş", "s").replace("ö", "o").replace("ç", "c")
                .replaceAll("\\s+", ".");
    }

    public List<User> getAllUsers() {
        String currentTenantId = getCurrentTenantId();
        logger.debug("Tenant '{}' için tüm kullanıcılar listeleniyor.", currentTenantId);
        // --- DEĞİŞİKLİK: findAll yerine findByTenantId kullanıldı ---
        return userRepository.findByTenantId(currentTenantId);
        // --- DEĞİŞİKLİK SONU ---
    }

    public Optional<User> getUserById(String id) {
        String currentTenantId = getCurrentTenantId();
        logger.debug("Tenant '{}' için ID'si '{}' olan kullanıcı aranıyor.", currentTenantId, id);
        // --- DEĞİŞİKLİK: findById yerine findByIdAndTenantId kullanıldı ---
        return userRepository.findByIdAndTenantId(id, currentTenantId);
        // --- DEĞİŞİKLİK SONU ---
    }

    // Kullanıcının kendi profilini güncellemesi (tenantId değişmez)
    public User updateMyProfile(String username, UpdateProfileRequest request) {
        // Kullanıcıyı username ile buluyoruz (global unique varsayımı)
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + username));

        // Güvenlik katmanı: İşlemi yapan kullanıcının tenant'ı ile güncellenen kullanıcının tenant'ı aynı mı?
        String currentTenantId = getCurrentTenantId();
        if (!user.getTenantId().equals(currentTenantId)) {
            logger.error("Yetkisiz profil güncelleme denemesi: Kullanıcı '{}' (Tenant: {}), aktif tenant ({}) dışında.", username, user.getTenantId(), currentTenantId);
            throw new SecurityException("Başka bir tenanta ait profili güncelleyemezsiniz.");
        }


        user.setFullName(request.fullName());
        user.setEmail(request.email());

        User updatedUser = userRepository.save(user);
        logger.info("Kullanıcı kendi profilini güncelledi: Tenant={}, Username={}", currentTenantId, username);
        auditLogService.logAction(username, "USER_PROFILE_UPDATED", "Kullanıcı kendi profilini güncelledi.");
        return updatedUser;
    }

    // Kullanıcının kendi şifresini değiştirmesi (tenantId değişmez)
    public void changeMyPassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + username));

        // Güvenlik katmanı: İşlemi yapan kullanıcının tenant'ı ile şifresi değiştirilen kullanıcının tenant'ı aynı mı?
        String currentTenantId = getCurrentTenantId();
        if (!user.getTenantId().equals(currentTenantId)) {
            logger.error("Yetkisiz şifre değiştirme denemesi: Kullanıcı '{}' (Tenant: {}), aktif tenant ({}) dışında.", username, user.getTenantId(), currentTenantId);
            throw new SecurityException("Başka bir tenanta ait şifreyi değiştiremezsiniz.");
        }

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            logger.warn("Başarısız şifre değiştirme denemesi (yanlış mevcut şifre): Tenant={}, Username={}", currentTenantId, username);
            throw new IllegalArgumentException("Mevcut şifre hatalı.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        logger.info("Kullanıcı şifresini değiştirdi: Tenant={}, Username={}", currentTenantId, username);
        auditLogService.logAction(username, "USER_PASSWORD_CHANGED", "Kullanıcı kendi şifresini değiştirdi.");
    }

    // /me endpoint'i için kullanıcı bilgilerini getirir (tenantId'ye göre filtrelemeye gerek yok, username ile buluyor)
    public Optional<User> getUserByUsername(String username) {
        // Kullanıcıyı username ile buluyoruz (global unique varsayımı)
        Optional<User> userOptional = userRepository.findByUsername(username);

        // Güvenlik katmanı: Token'daki kullanıcı adı ile bulunan kullanıcının tenant'ı,
        // isteğin geldiği tenant (context) ile aynı mı? (Opsiyonel ama önerilir)
        String currentTenantId = getCurrentTenantId(); // Bu metot çağrıldığında context set edilmiş olmalı
        userOptional = userOptional.filter(user -> {
            if (user.getTenantId().equals(currentTenantId)) {
                return true;
            } else {
                logger.warn("getUserByUsername: Kullanıcı '{}' (Tenant: {}) bulundu ancak aktif tenant ({}) ile uyuşmuyor.", username, user.getTenantId(), currentTenantId);
                return false; // Farklı tenant ise kullanıcıyı bulamadık gibi davran
            }
        });


        userOptional.ifPresent(user -> {
            List<Role> roles = roleRepository.findAllById(user.getRoleIds());
            Set<String> permissions = roles.stream()
                    .flatMap(role -> role.getPermissions().stream())
                    .collect(Collectors.toSet());
            user.setPermissions(permissions);
            logger.debug("Kullanıcı '{}' için yetkiler yüklendi: {} adet.", username, permissions.size());
        });

        return userOptional;
    }

    // Kullanıcının kendi avatarını güncellemesi (tenantId değişmez)
    public void updateAvatarUrl(String username, String avatarUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + username));

        // Güvenlik katmanı:
        String currentTenantId = getCurrentTenantId();
        if (!user.getTenantId().equals(currentTenantId)) {
            logger.error("Yetkisiz avatar güncelleme denemesi: Kullanıcı '{}' (Tenant: {}), aktif tenant ({}) dışında.", username, user.getTenantId(), currentTenantId);
            throw new SecurityException("Başka bir tenanta ait avatarı güncelleyemezsiniz.");
        }

        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        logger.info("Kullanıcı avatarını güncelledi: Tenant={}, Username={}", currentTenantId, username);
        auditLogService.logAction(username, "USER_AVATAR_UPDATED", "Kullanıcı profil fotoğrafını güncelledi.");
    }
}