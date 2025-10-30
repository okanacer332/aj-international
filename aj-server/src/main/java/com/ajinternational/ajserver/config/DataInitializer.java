package com.ajinternational.ajserver.config;

import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import com.ajinternational.ajserver.modules.iam.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List; // Eklendi
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionService permissionService;

    // Tenant sabitlerini tanımlayalım
    private static final String SYSTEM_TENANT = "SYSTEM";
    private static final List<String> OPERATIONAL_TENANTS = List.of("TR", "RU", "DU"); // Türkiye, Rusya, Dubai

    @Override
    public void run(String... args) throws Exception {

        // 1. Sistemdeki tüm yetkileri çek
        Set<String> allPermissions = permissionService.getSystemPermissions();

        // --- YENİ EKLENDİ: Sadece kısıtlı yetkiler (Sadece Dashboard'u görsün) ---
        Set<String> personnelPermissions = Set.of("PAGE_DASHBOARD:READ");
        // --- BİTTİ ---

        // 2. Süper Admin Rolünü Oluştur (Tenant ID: SYSTEM)
        Role superAdminRole = roleRepository.findByTenantIdAndName(SYSTEM_TENANT, "SUPER_ADMIN").orElseGet(() -> {
            Role newRole = new Role(SYSTEM_TENANT, "SUPER_ADMIN");
            newRole.setPermissions(allPermissions); // Süper admin tüm yetkilere sahiptir
            System.out.println(">>> Varsayılan 'SUPER_ADMIN' rolü oluşturuldu.");
            return roleRepository.save(newRole);
        });

        // 3. Süper Admin Kullanıcısını Oluştur (Tenant ID: SYSTEM)
        if (!userRepository.existsByUsername("superadmin")) {
            User superAdminUser = new User();
            superAdminUser.setUsername("superadmin");
            superAdminUser.setPassword(passwordEncoder.encode("superadmin"));
            superAdminUser.setFullName("Süper Admin");
            superAdminUser.setEmail("superadmin@ajinternational.com");
            superAdminUser.setRoleIds(Set.of(superAdminRole.getId()));
            superAdminUser.setActive(true);
            superAdminUser.setTenantId(SYSTEM_TENANT);
            userRepository.save(superAdminUser);
            System.out.println(">>> Varsayılan 'superadmin' kullanıcısı oluşturuldu.");
        }

        // 4. Her Operasyonel Ülke (Tenant) için Roller ve Kullanıcılar Oluştur
        for (String tenantId : OPERATIONAL_TENANTS) {

            // 4a. O ülkenin ADMIN rolünü oluştur
            Role tenantAdminRole = roleRepository.findByTenantIdAndName(tenantId, "ADMIN").orElseGet(() -> {
                Role newRole = new Role(tenantId, "ADMIN");
                newRole.setPermissions(allPermissions); // Normal adminler de (şimdilik) tüm yetkilere sahip
                System.out.println(">>> '" + tenantId + "' ülkesi için 'ADMIN' rolü oluşturuldu.");
                return roleRepository.save(newRole);
            });

            // --- YENİ EKLENDİ: 4b. O ülkenin PERSONEL rolünü oluştur ---
            Role tenantPersonnelRole = roleRepository.findByTenantIdAndName(tenantId, "PERSONNEL").orElseGet(() -> {
                Role newRole = new Role(tenantId, "PERSONNEL");
                newRole.setPermissions(personnelPermissions); // Sadece kısıtlı yetkiler
                System.out.println(">>> '" + tenantId + "' ülkesi için 'PERSONNEL' rolü oluşturuldu.");
                return roleRepository.save(newRole);
            });
            // --- BİTTİ ---


            // 4c. O ülkenin admin kullanıcısını oluştur (örn: admin.tr)
            String tenantAdminUsername = "admin." + tenantId.toLowerCase();
            if (!userRepository.existsByUsername(tenantAdminUsername)) {
                User tenantAdminUser = new User();
                tenantAdminUser.setUsername(tenantAdminUsername);
                tenantAdminUser.setPassword(passwordEncoder.encode("admin")); // Şifre "admin"
                tenantAdminUser.setFullName(tenantId + " Admin");
                tenantAdminUser.setEmail("admin@" + tenantId.toLowerCase() + ".ajinternational.com");
                tenantAdminUser.setRoleIds(Set.of(tenantAdminRole.getId()));
                tenantAdminUser.setActive(true);
                tenantAdminUser.setTenantId(tenantId);
                userRepository.save(tenantAdminUser);
                System.out.println(">>> '" + tenantAdminUsername + "' kullanıcısı '" + tenantId + "' ülkesi için oluşturuldu.");
            }
        }
    }
}