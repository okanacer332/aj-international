package com.ajinternational.ajserver.modules.masterdata.repository;

import com.ajinternational.ajserver.modules.masterdata.model.UnitDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UnitDefinitionRepository extends MongoRepository<UnitDefinition, String> {

    // Tenant'a göre tüm birimleri listele
    List<UnitDefinition> findByTenantId(String tenantId);

    // Tenant'a göre ID ile bul (Güvenlik için)
    Optional<UnitDefinition> findByTenantIdAndId(String tenantId, String id);

    // Tenant içinde benzersizlik kontrolü için
    Optional<UnitDefinition> findByTenantIdAndDepartmentNameAndUnitName(String tenantId, String departmentName, String unitName);
}