package com.ajinternational.ajserver.config;

import com.ajinternational.ajserver.modules.iam.model.Role;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.RoleRepository;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import com.ajinternational.ajserver.modules.iam.service.PermissionService;
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionService permissionService;
    private final MasterProductRepository masterProductRepository;

    private static final String SYSTEM_TENANT_ID = "SYSTEM";
    private static final String ADMIN_ROLE_NAME = "ADMIN";
    private static final String ADMIN_USERNAME = "admin";

    private static final List<String> TARGET_TENANTS = List.of("TR", "AE", "RU");
    private static final String TENANT_ADMIN_ROLE_NAME = "Tenant Admin";


    @Override
    public void run(String... args) throws Exception {
        // cleanDatabase(); // Veritabanını temizlemek için yorumu kaldırabilirsiniz (DİKKATLİ OLUN!)
        createSystemAdmin();
        createTenantInitialData();
        logger.info(">>> Veri başlatma işlemi tamamlandı.");
    }

    /*
    // Veritabanını temizleme metodu (Sadece Geliştirme Ortamı!)
    private void cleanDatabase() {
        logger.warn("!!! VERİTABANI TEMİZLENİYOR !!!");
        userRepository.deleteAll();
        roleRepository.deleteAll();
        masterProductRepository.deleteAll();
        // Diğerlerini de ekle: auditLogRepository.deleteAll(); knowledgeRepository.deleteAll();
        logger.warn("!!! VERİTABANI TEMİZLENDİ !!!");
    }
    */

    private void createSystemAdmin() {
        Set<String> allPermissions = permissionService.getSystemPermissions();

        Role systemAdminRole = roleRepository.findByTenantIdAndName(SYSTEM_TENANT_ID, ADMIN_ROLE_NAME).orElseGet(() -> {
            Role newAdminRole = new Role(SYSTEM_TENANT_ID, ADMIN_ROLE_NAME);
            newAdminRole.setPermissions(allPermissions);
            logger.info(">>> '{}' rolü (Tenant: {}) tüm yetkilerle oluşturuluyor...", ADMIN_ROLE_NAME, SYSTEM_TENANT_ID);
            Role savedRole = roleRepository.save(newAdminRole);
            logger.info(">>> '{}' rolü (Tenant: {}) oluşturuldu.", ADMIN_ROLE_NAME, SYSTEM_TENANT_ID);
            return savedRole;
        });

        // --- DEĞİŞİKLİK: Kullanıcı varlığını tenant bazında kontrol et ---
        if (!userRepository.existsByUsernameAndTenantId(ADMIN_USERNAME, SYSTEM_TENANT_ID)) {
            // --- DEĞİŞİKLİK SONU ---
            User adminUser = new User();
            adminUser.setUsername(ADMIN_USERNAME);
            adminUser.setPassword(passwordEncoder.encode("admin"));
            adminUser.setFullName("System Administrator");
            adminUser.setEmail("admin@ajinternational.com");
            adminUser.setRoleIds(Set.of(systemAdminRole.getId()));
            adminUser.setActive(true);
            adminUser.setTenantId(SYSTEM_TENANT_ID);

            logger.info(">>> '{}' kullanıcısı (Tenant: {}) oluşturuluyor...", ADMIN_USERNAME, SYSTEM_TENANT_ID);
            userRepository.save(adminUser);
            logger.info(">>> '{}' kullanıcısı (Tenant: {}) oluşturuldu.", ADMIN_USERNAME, SYSTEM_TENANT_ID);
        } else {
            // --- DEĞİŞİKLİK: Mevcut kullanıcıyı tenant bazında kontrol etmeye gerek yok, exists kontrolü yeterli ---
            logger.info(">>> '{}' kullanıcısı (Tenant: {}) zaten mevcut.", ADMIN_USERNAME, SYSTEM_TENANT_ID);
            // --- DEĞİŞİKLİK SONU ---
        }
    }

    private void createTenantInitialData() {
        Set<String> allPermissions = permissionService.getSystemPermissions();

        for (String tenantId : TARGET_TENANTS) {
            logger.info(">>> Tenant '{}' için başlangıç verileri kontrol ediliyor/oluşturuluyor...", tenantId);

            Role tenantAdminRole = roleRepository.findByTenantIdAndName(tenantId, TENANT_ADMIN_ROLE_NAME).orElseGet(() -> {
                Role newTenantAdminRole = new Role(tenantId, TENANT_ADMIN_ROLE_NAME);
                newTenantAdminRole.setPermissions(allPermissions);
                logger.info(">>> '{}' rolü (Tenant: {}) tüm yetkilerle oluşturuluyor...", TENANT_ADMIN_ROLE_NAME, tenantId);
                Role savedRole = roleRepository.save(newTenantAdminRole);
                logger.info(">>> '{}' rolü (Tenant: {}) oluşturuldu.", TENANT_ADMIN_ROLE_NAME, tenantId);
                return savedRole;
            });

            if (!userRepository.existsByUsernameAndTenantId(ADMIN_USERNAME, tenantId)) {
                User tenantUser = new User();
                tenantUser.setUsername(ADMIN_USERNAME);
                tenantUser.setPassword(passwordEncoder.encode("admin"));
                tenantUser.setFullName(tenantId + " Administrator");
                tenantUser.setEmail(ADMIN_USERNAME + "+" + tenantId.toLowerCase() + "@ajinternational.com");
                tenantUser.setRoleIds(Set.of(tenantAdminRole.getId()));
                tenantUser.setActive(true);
                tenantUser.setTenantId(tenantId);

                logger.info(">>> '{}' kullanıcısı (Tenant: {}) oluşturuluyor...", ADMIN_USERNAME, tenantId);
                userRepository.save(tenantUser);
                logger.info(">>> '{}' kullanıcısı (Tenant: {}) oluşturuldu.", ADMIN_USERNAME, tenantId);
            } else {
                logger.info(">>> '{}' kullanıcısı (Tenant: {}) zaten mevcut.", ADMIN_USERNAME, tenantId);
            }

            createSampleProducts(tenantId);
            logger.info(">>> Tenant '{}' için başlangıç verileri tamamlandı.", tenantId);
        }
    }

    private void createSampleProducts(String tenantId) {
        if (masterProductRepository.countByTenantIdAndParentProductIdIsNull(tenantId) == 0) {
            logger.info(">>> Tenant '{}' için örnek ürünler oluşturuluyor...", tenantId);

            MasterProduct textil = new MasterProduct();
            textil.setTenantId(tenantId);
            textil.setCode("TEXTILE");
            textil.setName(tenantId + " Ana Tekstil");
            textil.setDescription("Ana tekstil kategorisi");
            textil = masterProductRepository.save(textil);

            MasterProduct tshirt = new MasterProduct();
            tshirt.setTenantId(tenantId);
            tshirt.setCode("TSHIRT");
            tshirt.setName(tenantId + " T-Shirt");
            tshirt.setParentProductId(textil.getId());
            masterProductRepository.save(tshirt);

            MasterProduct polo = new MasterProduct();
            polo.setTenantId(tenantId);
            polo.setCode("POLO");
            polo.setName(tenantId + " Polo Yaka");
            polo.setParentProductId(tshirt.getId());
            masterProductRepository.save(polo);

            MasterProduct plastic = new MasterProduct();
            plastic.setTenantId(tenantId);
            plastic.setCode("PLASTIC");
            plastic.setName(tenantId + " Ana Plastik");
            plastic = masterProductRepository.save(plastic);

            logger.info(">>> Tenant '{}' için örnek ürünler oluşturuldu.", tenantId);
        } else {
            logger.info(">>> Tenant '{}' için zaten ürünler mevcut, örnekler eklenmedi.", tenantId);
        }
    }
}