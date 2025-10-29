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

import java.util.List; // List import edildi
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionService permissionService;

    // Başlangıçta oluşturulacak tenant'lar
    private static final List<String> INITIAL_TENANTS = List.of("TR", "RU", "AE");
    private static final String SYSTEM_TENANT_ID = "SYSTEM"; // Süper admin için tenant ID

    @Override
    public void run(String... args) throws Exception {

        // Sistemdeki tüm yetkileri al (rolleri oluşturmadan önce)
        Set<String> allPermissions = permissionService.getSystemPermissions();

        // --- 1. SUPER_ADMIN Rolünü Oluştur/Güncelle ---
        Role superAdminRole = roleRepository.findByName("SUPER_ADMIN").orElseGet(() -> {
            Role newSuperAdminRole = new Role("SUPER_ADMIN");
            System.out.println(">>> Varsayılan 'SUPER_ADMIN' rolü oluşturuluyor...");
            return newSuperAdminRole; // Kaydetmeden önce yetkileri ata
        });
        // Her başlatmada tüm yetkilerin SUPER_ADMIN rolüne eklendiğinden emin ol
        if (!superAdminRole.getPermissions().equals(allPermissions)) {
            superAdminRole.setPermissions(allPermissions);
            roleRepository.save(superAdminRole);
            System.out.println(">>> 'SUPER_ADMIN' rolü tüm sistem yetkileriyle güncellendi.");
        }


        // --- 2. ADMIN Rolünü Oluştur/Güncelle ---
        Role adminRole = roleRepository.findByName("ADMIN").orElseGet(() -> {
            Role newAdminRole = new Role("ADMIN");
            System.out.println(">>> Varsayılan 'ADMIN' rolü oluşturuluyor...");
            return newAdminRole; // Kaydetmeden önce yetkileri ata
        });
        // Her başlatmada tüm yetkilerin ADMIN rolüne eklendiğinden emin ol (şimdilik)
        // İleride ADMIN rolünün yetkileri kısıtlanabilir.
        if (!adminRole.getPermissions().equals(allPermissions)) {
            adminRole.setPermissions(allPermissions);
            roleRepository.save(adminRole);
            System.out.println(">>> 'ADMIN' rolü tüm sistem yetkileriyle güncellendi.");
        }


        // --- 3. Süper Admin Kullanıcısını Oluştur ---
        // Kullanıcı adını kontrol et (tenantId fark etmeksizin) - Şimdilik SYSTEM tenant'ı varsayalım
        if (!userRepository.existsByUsernameAndTenantId("aj-admin", SYSTEM_TENANT_ID)) {
            User superAdminUser = new User();
            superAdminUser.setUsername("aj-admin");
            superAdminUser.setPassword(passwordEncoder.encode("superadmin")); // Yeni şifre
            superAdminUser.setFullName("Super Admin");
            superAdminUser.setEmail("superadmin@ajinternational.com"); // Email güncellendi
            superAdminUser.setRoleIds(Set.of(superAdminRole.getId())); // SUPER_ADMIN rolü atandı
            superAdminUser.setActive(true);
            superAdminUser.setTenantId(SYSTEM_TENANT_ID); // Özel tenant ID
            userRepository.save(superAdminUser);
            System.out.println(">>> Varsayılan 'aj-admin' (SUPER_ADMIN) kullanıcısı oluşturuldu.");
        }

        // --- 4. Her Tenant İçin 'admin' Kullanıcısını Oluştur ---
        for (String tenantId : INITIAL_TENANTS) {
            // Hem username hem de tenantId ile kontrol et
            if (!userRepository.existsByUsernameAndTenantId("admin", tenantId)) {
                User tenantAdminUser = new User();
                tenantAdminUser.setUsername("admin"); // Kullanıcı adı aynı kalabilir
                tenantAdminUser.setPassword(passwordEncoder.encode("admin")); // Şifre aynı
                tenantAdminUser.setFullName("Admin (" + tenantId + ")"); // Adı tenant ile ayırt edelim
                tenantAdminUser.setEmail("admin@" + tenantId.toLowerCase() + ".ajinternational.com"); // Email tenant bazlı
                tenantAdminUser.setRoleIds(Set.of(adminRole.getId())); // ADMIN rolü atandı
                tenantAdminUser.setActive(true);
                tenantAdminUser.setTenantId(tenantId); // İlgili tenant ID
                userRepository.save(tenantAdminUser);
                System.out.println(">>> Tenant '" + tenantId + "' için varsayılan 'admin' kullanıcısı oluşturuldu.");
            }
        }
    }
}