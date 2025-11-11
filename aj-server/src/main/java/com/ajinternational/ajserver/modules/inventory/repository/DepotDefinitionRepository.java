// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/repository/DepotDefinitionRepository.java
package com.ajinternational.ajserver.modules.inventory.repository;

import com.ajinternational.ajserver.modules.inventory.model.DepotDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepotDefinitionRepository extends MongoRepository<DepotDefinition, String> {
    List<DepotDefinition> findByTenantId(String tenantId);
    Optional<DepotDefinition> findByTenantIdAndId(String tenantId, String id);
    Optional<DepotDefinition> findByTenantIdAndName(String tenantId, String name);
}