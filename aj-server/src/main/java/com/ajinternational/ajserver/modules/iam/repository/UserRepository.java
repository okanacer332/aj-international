package com.ajinternational.ajserver.modules.iam.repository;

import com.ajinternational.ajserver.modules.iam.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

// List import edildi
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /**
     * Kullanıcıyı kullanıcı adına göre bulur.
     * @param username Kullanıcı adı
     * @return Bulunan kullanıcı nesnesi veya boş Optional
     * @deprecated Username artık tek başına unique değil. findByUsernameAndTenantId kullanın.
     */
    @Deprecated
    Optional<User> findByUsername(String username);

    /**
     * Belirtilen kullanıcı adının sistemde olup olmadığını kontrol eder.
     * @param username Kontrol edilecek kullanıcı adı
     * @return kullanıcı adı varsa true, yoksa false
     * @deprecated Username artık tek başına unique değil. existsByUsernameAndTenantId kullanın.
     */
    @Deprecated
    boolean existsByUsername(String username);

    /**
     * Kullanıcıyı, belirtilen kullanıcı adı ve tenant ID'si ile bulur.
     * @param username Kullanıcı adı
     * @param tenantId Tenant ID
     * @return Bulunan kullanıcı nesnesi veya boş Optional
     */
    Optional<User> findByUsernameAndTenantId(String username, String tenantId);

    /**
     * Belirtilen kullanıcı adının belirtilen tenant ID'si için sistemde olup olmadığını kontrol eder.
     * @param username Kontrol edilecek kullanıcı adı
     * @param tenantId Kontrol edilecek tenant ID
     * @return kullanıcı adı ve tenant ID kombinasyonu varsa true, yoksa false
     */
    boolean existsByUsernameAndTenantId(String username, String tenantId);

    // --- YENİ METOT: Belirli bir tenant'a ait tüm kullanıcıları bulur ---
    /**
     * Belirtilen tenant ID'sine sahip tüm kullanıcıları listeler.
     * @param tenantId Aranacak Tenant ID
     * @return Bu tenant'a ait kullanıcıların listesi
     */
    List<User> findByTenantId(String tenantId);
    // --- YENİ METOT SONU ---

}