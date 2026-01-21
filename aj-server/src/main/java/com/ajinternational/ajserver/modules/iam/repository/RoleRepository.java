package com.ajinternational.ajserver.modules.iam.repository;

import com.ajinternational.ajserver.modules.iam.model.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends MongoRepository<Role, String> {

    Optional<Role> findByName(String name);

    Optional<Role> findByTenantIdAndName(String tenantId, String name);

    long countByIdIn(Set<String> ids);

    List<Role> findByTenantId(String tenantId);

    Page<Role> findByTenantId(String tenantId, Pageable pageable);

    Optional<Role> findByTenantIdAndId(String tenantId, String id);
}