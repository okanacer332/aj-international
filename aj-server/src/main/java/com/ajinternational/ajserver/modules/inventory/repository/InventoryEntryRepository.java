// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/repository/InventoryEntryRepository.java
package com.ajinternational.ajserver.modules.inventory.repository;

import com.ajinternational.ajserver.modules.inventory.model.InventoryEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryEntryRepository extends MongoRepository<InventoryEntry, String> {
    List<InventoryEntry> findByTenantId(String tenantId);

    Page<InventoryEntry> findByTenantId(String tenantId, Pageable pageable);

    Optional<InventoryEntry> findByTenantIdAndId(String tenantId, String id);
}