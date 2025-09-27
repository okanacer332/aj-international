package com.ajinternational.ajserver.modules.iam.repository;

import com.ajinternational.ajserver.modules.iam.model.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends MongoRepository<Role, String> {

    Optional<Role> findByName(String name);

    // Yeni eklenen metot: Verilen ID listesindeki rollerden kaç tanesinin DB'de olduğunu sayar.
    long countByIdIn(Set<String> ids);
}