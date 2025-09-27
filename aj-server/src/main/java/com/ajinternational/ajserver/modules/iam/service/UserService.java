package com.ajinternational.ajserver.modules.iam.service;

import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.iam.dto.ChangePasswordRequest;
import com.ajinternational.ajserver.modules.iam.dto.CreateUserRequest;
import com.ajinternational.ajserver.modules.iam.dto.UpdateProfileRequest;
import com.ajinternational.ajserver.modules.iam.dto.UpdateUserRequest;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

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

    public User createUser(CreateUserRequest request) {
        String generatedUsername = generateUsername(request.fullName());
        if (userRepository.existsByUsername(generatedUsername)) {
            throw new IllegalArgumentException("Bu kullanıcı adı zaten mevcut: " + generatedUsername);
        }
        User newUser = new User();
        newUser.setFullName(request.fullName());
        newUser.setUsername(generatedUsername);
        newUser.setEmail(request.email());
        newUser.setTenantId(request.tenantId());
        newUser.setPassword(passwordEncoder.encode("1234"));
        newUser.setRoleIds(request.roleIds());
        newUser.setActive(true);
        User savedUser = userRepository.save(newUser);
        auditLogService.logAction(getCurrentUsername(), "USER_CREATED", "Yeni kullanıcı oluşturuldu: " + savedUser.getUsername());
        return savedUser;
    }

    public User updateUser(String userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + userId));
        long foundRoles = roleRepository.countByIdIn(request.roleIds());
        if (foundRoles != request.roleIds().size()) {
            throw new IllegalArgumentException("Geçersiz veya bulunamayan rol ID'leri gönderildi.");
        }
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setActive(request.active());
        user.setRoleIds(request.roleIds());
        User updatedUser = userRepository.save(user);
        auditLogService.logAction(getCurrentUsername(), "USER_UPDATED", "Kullanıcı güncellendi: " + updatedUser.getUsername());
        return updatedUser;
    }

    public void deleteUser(String userId) {
        Optional<User> userToDelete = userRepository.findById(userId);
        if(userToDelete.isPresent()) {
            String username = userToDelete.get().getUsername();
            userRepository.deleteById(userId);
            auditLogService.logAction(getCurrentUsername(), "USER_DELETED", "Kullanıcı silindi: " + username);
        } else {
            throw new RuntimeException("Silinecek kullanıcı bulunamadı: " + userId);
        }
    }

    private String generateUsername(String fullName) {
        return fullName.trim().toLowerCase()
                .replace("ı", "i").replace("ğ", "g").replace("ü", "u")
                .replace("ş", "s").replace("ö", "o").replace("ç", "c")
                .replaceAll("\\s+", ".");
    }

    public List<User> getAllUsers() { return userRepository.findAll(); }
    public Optional<User> getUserById(String id) { return userRepository.findById(id); }

    public User updateMyProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        user.setFullName(request.fullName());
        user.setEmail(request.email());

        User updatedUser = userRepository.save(user);
        auditLogService.logAction(username, "USER_PROFILE_UPDATED", "Kullanıcı kendi profilini güncelledi.");
        return updatedUser;
    }

    public void changeMyPassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        // Mevcut şifre doğru mu diye kontrol et
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mevcut şifre hatalı.");
        }

        // Yeni şifreyi hash'leyerek kaydet
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        auditLogService.logAction(username, "USER_PASSWORD_CHANGED", "Kullanıcı kendi şifresini değiştirdi.");
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public void updateAvatarUrl(String username, String avatarUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        auditLogService.logAction(username, "USER_AVATAR_UPDATED", "Kullanıcı profil fotoğrafını güncelledi.");
    }
}