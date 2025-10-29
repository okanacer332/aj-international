package com.ajinternational.ajserver.modules.iam.repository;

import com.ajinternational.ajserver.modules.iam.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByUsername(String username); // Global unique username kontrolü için kalabilir

    boolean existsByUsername(String username); // Global unique username kontrolü için kalabilir

    List<User> findByTenantId(String tenantId);

    Optional<User> findByIdAndTenantId(String id, String tenantId);

    // --- YENİ METOT ---
    /**
     * Belirli bir tenant içinde belirli bir kullanıcı adına sahip kullanıcıyı bulur.
     * @param username Kullanıcı adı
     * @param tenantId Tenant ID (Ülke Kodu)
     * @return Bulunan kullanıcı nesnesi veya boş Optional
     */
    Optional<User> findByUsernameAndTenantId(String username, String tenantId);
    // --- YENİ METOT SONU ---

    // --- YENİ METOT (Opsiyonel ama DataInitializer için kullanışlı) ---
    /**
     * Belirli bir tenant içinde belirli bir kullanıcı adının olup olmadığını kontrol eder.
     * @param username Kullanıcı adı
     * @param tenantId Tenant ID
     * @return Kullanıcı varsa true, yoksa false
     */
    boolean existsByUsernameAndTenantId(String username, String tenantId);
    // --- YENİ METOT SONU ---

}