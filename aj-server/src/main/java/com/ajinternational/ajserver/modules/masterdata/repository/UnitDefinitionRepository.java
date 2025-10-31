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

    // Tenant içinde benzersizlik kontrolü için (YENİ)
    Optional<UnitDefinition> findByTenantIdAndParentUnitIdAndName(String tenantId, String parentUnitId, String name);

    // Kök departmanları (parent'ı null olanları) bulmak için (YENİ)
    List<UnitDefinition> findByTenantIdAndParentUnitIdIsNull(String tenantId);

    // Bir departmanın alt birimlerini bulmak için (YENİ)
    List<UnitDefinition> findByParentUnitId(String parentUnitId);

    // (Eski findByTenantIdAndDepartmentNameAndUnitName metodu kaldırıldı)
}