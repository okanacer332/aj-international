// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/repository/MaterialDefinitionRepository.java
package com.ajinternational.ajserver.modules.inventory.repository;

import com.ajinternational.ajserver.modules.inventory.model.MaterialDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialDefinitionRepository extends MongoRepository<MaterialDefinition, String> {
    List<MaterialDefinition> findByTenantId(String tenantId);
    Optional<MaterialDefinition> findByTenantIdAndId(String tenantId, String id);
    Optional<MaterialDefinition> findByTenantIdAndName(String tenantId, String name);
    Optional<MaterialDefinition> findByTenantIdAndCode(String tenantId, String code);
}