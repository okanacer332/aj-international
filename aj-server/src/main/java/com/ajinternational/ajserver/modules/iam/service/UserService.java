package com.ajinternational.ajserver.modules.iam.service;

import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public User updateUserRoles(String userId, Set<String> roleIds) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + userId));

        // Gönderilen rol ID'lerinin veritabanında gerçekten var olup olmadığını kontrol et
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
}