package com.ajinternational.ajserver.modules.iam.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    // Helper for cache key generation
    public String getCurrentTenantIdForCache() {
        return TenantContextHolder.getCurrentTenantId();
    }

    @CacheEvict(value = "users", key = "#root.target.getCurrentTenantIdForCache()")
    public User createUser(CreateUserRequest request) {
        // --- GÜNCELLEME BAŞLANGIÇ: Tenant Güvenlik Kontrolü ---
        UserDetails currentUserDetails = TenantContextHolder.getCurrentUserDetails();
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = currentUserDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        String targetTenantId;

        if (isSuperAdmin) {
            // Süper Admin ise, formdan gelen tenantId'yi kullan (TR, RU, DU olabilir)
            targetTenantId = request.tenantId();
        } else {
            // Süper Admin değilse, formdan ne gelirse gelsin, işlemi yapanın tenantId'sini
            // zorla
            targetTenantId = currentTenantId;
        }
        // --- GÜNCELLEME BİTİŞ ---

        String generatedUsername = generateUsername(request.fullName());
        if (userRepository.existsByUsername(generatedUsername)) {
            throw new IllegalArgumentException("Bu kullanıcı adı zaten mevcut: " + generatedUsername);
        }
        User newUser = new User();
        newUser.setFullName(request.fullName());
        newUser.setUsername(generatedUsername);
        newUser.setEmail(request.email());
        newUser.setTenantId(targetTenantId); // GÜNCELLENDİ: Güvenli 'targetTenantId' kullanıldı
        newUser.setPassword(passwordEncoder.encode("1234"));
        newUser.setRoleIds(request.roleIds());
        newUser.setActive(true);
        User savedUser = userRepository.save(newUser);

        auditLogService.logAction(
                savedUser.getTenantId(),
                TenantContextHolder.getCurrentUsername(),
                "USER_CREATED",
                "Yeni kullanıcı oluşturuldu: " + savedUser.getUsername());
        return savedUser;
    }

    @CacheEvict(value = "users", key = "#root.target.getCurrentTenantIdForCache()")
    public User updateUser(String userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + userId));

        UserDetails currentUserDetails = TenantContextHolder.getCurrentUserDetails();
        String currentUserTenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = currentUserDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isSuperAdmin) {
            if (!user.getTenantId().equals(currentUserTenantId)) {
                throw new SecurityException("Bu kullanıcıyı güncelleme yetkiniz yok.");
            }
            // GÜNCELLENDİ: Normal admin'in, kullanıcının tenant'ını (ülkesini)
            // değiştirmesini engelle
            // (Sadece fullName, email, active, roleIds güncellenebilir)
        }

        // Rollerin, güncellenmek istenen kullanıcının tenant'ına ait olduğundan emin ol
        // (Bu kontrol daha da geliştirilebilir, şimdilik rol ID'lerinin varlığını
        // kontrol ediyoruz)
        long foundRoles = roleRepository.countByIdIn(request.roleIds());
        if (foundRoles != request.roleIds().size()) {
            throw new IllegalArgumentException("Geçersiz veya bulunamayan rol ID'leri gönderildi.");
        }

        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setActive(request.active());
        user.setRoleIds(request.roleIds());

        // GÜNCELLEME: Sadece Süper Admin bir kullanıcının tenant'ını (ülkesini)
        // değiştirebilir.
        // (Şu anki UpdateUserRequest DTO'su tenantId içermiyor, bu yüzden bu risk yok,
        // ancak gelecekte eklenirse diye bu mantık aklımızda bulunmalı.)

        User updatedUser = userRepository.save(user);

        auditLogService.logAction(
                updatedUser.getTenantId(),
                TenantContextHolder.getCurrentUsername(),
                "USER_UPDATED",
                "Kullanıcı güncellendi: " + updatedUser.getUsername());
        return updatedUser;
    }

    @CacheEvict(value = "users", key = "#root.target.getCurrentTenantIdForCache()")
    public void deleteUser(String userId) {
        User userToDelete = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Silinecek kullanıcı bulunamadı: " + userId));

        UserDetails currentUserDetails = TenantContextHolder.getCurrentUserDetails();
        boolean isSuperAdmin = currentUserDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isSuperAdmin) {
            String currentUserTenantId = TenantContextHolder.getCurrentTenantId();
            if (!userToDelete.getTenantId().equals(currentUserTenantId)) {
                throw new SecurityException("Bu kullanıcıyı silme yetkiniz yok.");
            }
        }

        String username = userToDelete.getUsername();
        String tenantId = userToDelete.getTenantId();

        userRepository.deleteById(userId);

        auditLogService.logAction(
                tenantId,
                TenantContextHolder.getCurrentUsername(),
                "USER_DELETED",
                "Kullanıcı silindi: " + username);
    }

    private String generateUsername(String fullName) {
        return fullName.trim().toLowerCase()
                .replace("ı", "i").replace("ğ", "g").replace("ü", "u")
                .replace("ş", "s").replace("ö", "o").replace("ç", "c")
                .replaceAll("\\s+", ".");
    }

    @Cacheable(value = "users", key = "#root.target.getCurrentTenantIdForCache()")
    public List<User> getAllUsers() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();

        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return userRepository.findAll();
        } else {
            return userRepository.findByTenantId(tenantId);
        }
    }

    public Optional<User> getUserById(String id) {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();

        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return userRepository.findById(id);
        } else {
            return userRepository.findByTenantIdAndId(tenantId, id);
        }
    }

    public User updateMyProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        user.setFullName(request.fullName());
        user.setEmail(request.email());

        User updatedUser = userRepository.save(user);

        auditLogService.logAction(
                TenantContextHolder.getCurrentTenantId(),
                username,
                "USER_PROFILE_UPDATED",
                "Kullanıcı kendi profilini güncelledi.");
        return updatedUser;
    }

    public void changeMyPassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mevcut şifre hatalı.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        auditLogService.logAction(
                TenantContextHolder.getCurrentTenantId(),
                username,
                "USER_PASSWORD_CHANGED",
                "Kullanıcı kendi şifresini değiştirdi.");
    }

    public Optional<User> getUserByUsername(String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);

        userOptional.ifPresent(user -> {
            List<Role> roles = roleRepository.findAllById(user.getRoleIds());
            Set<String> permissions = roles.stream()
                    .flatMap(role -> role.getPermissions().stream())
                    .collect(Collectors.toSet());
            user.setPermissions(permissions);
        });

        return userOptional;
    }

    public void updateAvatarUrl(String username, String avatarUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        auditLogService.logAction(
                TenantContextHolder.getCurrentTenantId(),
                username,
                "USER_AVATAR_UPDATED",
                "Kullanıcı profil fotoğrafını güncelledi.");
    }
}