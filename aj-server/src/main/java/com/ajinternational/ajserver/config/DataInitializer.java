package com.ajinternational.ajserver.config;

import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import com.ajinternational.ajserver.modules.iam.service.PermissionService; // PermissionController yerine PermissionService'i import et
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
    private final PermissionService permissionService; // Controller yerine servisi enjekte et

    @Override
    public void run(String... args) throws Exception {
        Role adminRole = roleRepository.findByName("ADMIN").orElseGet(() -> {
            Role newAdminRole = new Role("ADMIN");

            // Sistemdeki tüm yetkileri CONTROLLER YERİNE SERVİSTEN al
            Set<String> allPermissions = permissionService.getSystemPermissions();

            newAdminRole.setPermissions(allPermissions);

            System.out.println(">>> Varsayılan 'ADMIN' rolü tüm yetkilerle oluşturuldu.");
            return roleRepository.save(newAdminRole);
        });

        if (!userRepository.existsByUsername("admin")) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setPassword(passwordEncoder.encode("admin"));
            adminUser.setFullName("Admin");
            adminUser.setEmail("admin@ajinternational.com");
            adminUser.setRoleIds(Set.of(adminRole.getId()));
            adminUser.setActive(true);
            adminUser.setTenantId("SYSTEM");
            userRepository.save(adminUser);
            System.out.println(">>> Varsayılan 'admin' kullanıcısı oluşturuldu.");
        }
    }
}