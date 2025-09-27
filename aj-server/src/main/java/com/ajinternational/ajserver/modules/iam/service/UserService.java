package com.ajinternational.ajserver.modules.iam.service;

import com.ajinternational.ajserver.modules.iam.dto.CreateUserRequest;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public User updateUserRoles(String userId, Set<String> roleIds) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + userId));

        long foundRoles = roleRepository.countByIdIn(roleIds);
        if (foundRoles != roleIds.size()) {
            throw new IllegalArgumentException("Geçersiz veya bulunamayan rol ID'leri gönderildi.");
        }

        user.setRoleIds(roleIds);
        return userRepository.save(user);
    }

    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    // DTO ALACAK ŞEKİLDE GÜNCELLENDİ
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
        newUser.setPassword(passwordEncoder.encode("1234")); // Varsayılan şifre
        newUser.setRoleIds(request.roleIds());
        newUser.setActive(true);

        return userRepository.save(newUser);
    }

    // Ad Soyad'dan kullanıcı adı üreten yardımcı metot
    private String generateUsername(String fullName) {
        return fullName.trim().toLowerCase()
                .replace("ı", "i")
                .replace("ğ", "g")
                .replace("ü", "u")
                .replace("ş", "s")
                .replace("ö", "o")
                .replace("ç", "c")
                .replaceAll("\\s+", ".");
    }
}