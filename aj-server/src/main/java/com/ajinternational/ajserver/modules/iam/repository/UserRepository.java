package com.ajinternational.ajserver.modules.iam.repository;

import com.ajinternational.ajserver.modules.iam.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // Eklendi
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    // YENİ EKLENDİ: Belirli bir tenant'taki tüm kullanıcıları getirir
    List<User> findByTenantId(String tenantId);

    // YENİ EKLENDİ: Belirli bir tenant'taki belirli bir kullanıcıyı ID ile getirir
    Optional<User> findByTenantIdAndId(String tenantId, String id);
}