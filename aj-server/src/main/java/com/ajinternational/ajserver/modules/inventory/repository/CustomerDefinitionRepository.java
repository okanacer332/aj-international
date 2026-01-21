// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/repository/CustomerDefinitionRepository.java
package com.ajinternational.ajserver.modules.inventory.repository;

import com.ajinternational.ajserver.modules.inventory.model.CustomerDefinition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerDefinitionRepository extends MongoRepository<CustomerDefinition, String> {
    List<CustomerDefinition> findByTenantId(String tenantId);

    Page<CustomerDefinition> findByTenantId(String tenantId, Pageable pageable);

    Optional<CustomerDefinition> findByTenantIdAndId(String tenantId, String id);

    Optional<CustomerDefinition> findByTenantIdAndName(String tenantId, String name);
}