// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/repository/InventoryDispatchRepository.java
package com.ajinternational.ajserver.modules.inventory.repository;

import com.ajinternational.ajserver.modules.inventory.model.InventoryDispatch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryDispatchRepository extends MongoRepository<InventoryDispatch, String> {
    List<InventoryDispatch> findByTenantId(String tenantId);
    Optional<InventoryDispatch> findByTenantIdAndId(String tenantId, String id);
}