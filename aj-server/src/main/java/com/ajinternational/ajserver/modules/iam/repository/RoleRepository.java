package com.ajinternational.ajserver.modules.iam.repository;

import com.ajinternational.ajserver.modules.iam.model.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // Eklendi
import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends MongoRepository<Role, String> {

    Optional<Role> findByName(String name); // Bu metot artık kullanılmamalı (eski)

    Optional<Role> findByTenantIdAndName(String tenantId, String name);

    long countByIdIn(Set<String> ids);

    // YENİ EKLENDİ: Belirli bir tenant'taki tüm rolleri getirir
    List<Role> findByTenantId(String tenantId);

    // YENİ EKLENDİ: Belirli bir tenant'taki belirli bir rolü ID ile getirir
    Optional<Role> findByTenantIdAndId(String tenantId, String id);
}