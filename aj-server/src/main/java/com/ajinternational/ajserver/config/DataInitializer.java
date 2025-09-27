package com.ajinternational.ajserver.config;

import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. ADMIN rolü var mı kontrol et, yoksa oluştur.
        Role adminRole = roleRepository.findByName("ADMIN").orElseGet(() -> {
            Role newRole = new Role("ADMIN");
            // Gelecekte tüm yetkileri buraya ekleyebiliriz.
            // newRole.setPermissions(Set.of("USER_MANAGE", "ROLE_MANAGE"));
            return roleRepository.save(newRole);
        });

        // 2. USER rolü var mı kontrol et, yoksa oluştur.
        roleRepository.findByName("USER").orElseGet(() -> roleRepository.save(new Role("USER")));

        // 3. "admin" kullanıcısı var mı kontrol et, yoksa oluştur.
        if (!userRepository.existsByUsername("admin")) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setPassword(passwordEncoder.encode("admin")); // Şifreyi hash'leyerek kaydet
            adminUser.setFullName("System Administrator");
            adminUser.setRoleIds(Set.of(adminRole.getId()));
            adminUser.setActive(true);
            adminUser.setTenantId("SYSTEM"); // Sistem admini için özel bir tenantId
            userRepository.save(adminUser);
            System.out.println(">>> Varsayılan 'admin' kullanıcısı oluşturuldu.");
        }
    }
}