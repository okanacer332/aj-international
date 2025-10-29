package com.ajinternational.ajserver.modules.iam.repository;

import com.ajinternational.ajserver.modules.iam.model.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // List importu eklendi
import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends MongoRepository<Role, String> {

    // Artık name tek başına unique değil, tenantId ile birlikte unique.
    // Bu metot tenant bazlı çalışmalı.
    // Optional<Role> findByName(String name); // Bu metodu kaldırıyoruz veya tenant bazlı yapıyoruz.

    // Yeni eklenen metot: Verilen ID listesindeki rollerden kaç tanesinin DB'de olduğunu sayar.
    // Bu metot tenant'tan bağımsız olabilir, çünkü ID'ler zaten global unique.
    long countByIdIn(Set<String> ids);

    // --- YENİ METOTLAR ---

    /**
     * Belirli bir tenant'a ait tüm rolleri listeler.
     * @param tenantId Tenant ID (Ülke Kodu)
     * @return O tenant'a ait rollerin listesi
     */
    List<Role> findByTenantId(String tenantId);

    /**
     * Belirli bir tenant içinde belirli bir role adını arar.
     * @param tenantId Tenant ID (Ülke Kodu)
     * @param name Rol adı
     * @return Bulunan rol nesnesi veya boş Optional
     */
    Optional<Role> findByTenantIdAndName(String tenantId, String name);

    /**
     * Belirli bir tenant içinde belirli bir ID'ye sahip rolü bulur.
     * @param id Rol ID'si
     * @param tenantId Tenant ID (Ülke Kodu)
     * @return Bulunan rol nesnesi veya boş Optional
     */
    Optional<Role> findByIdAndTenantId(String id, String tenantId);

    // --- YENİ METOTLAR SONU ---
}