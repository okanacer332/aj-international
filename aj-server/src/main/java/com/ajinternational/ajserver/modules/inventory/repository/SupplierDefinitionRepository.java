// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/repository/SupplierDefinitionRepository.java
package com.ajinternational.ajserver.modules.inventory.repository;

import com.ajinternational.ajserver.modules.inventory.model.SupplierDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierDefinitionRepository extends MongoRepository<SupplierDefinition, String> {
    List<SupplierDefinition> findByTenantId(String tenantId);
    Optional<SupplierDefinition> findByTenantIdAndId(String tenantId, String id);
    Optional<SupplierDefinition> findByTenantIdAndName(String tenantId, String name);
}