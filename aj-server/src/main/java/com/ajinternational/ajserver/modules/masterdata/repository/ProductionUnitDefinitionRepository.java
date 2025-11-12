package com.ajinternational.ajserver.modules.masterdata.repository;

import com.ajinternational.ajserver.modules.masterdata.model.ProductionUnitDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionUnitDefinitionRepository extends MongoRepository<ProductionUnitDefinition, String> {

    List<ProductionUnitDefinition> findByTenantId(String tenantId);

    Optional<ProductionUnitDefinition> findByTenantIdAndId(String tenantId, String id);

    // Benzersizlik kontrolü için
    Optional<ProductionUnitDefinition> findByTenantIdAndParentProductionUnitIdAndName(String tenantId, String parentProductionUnitId, String name);

    // Kök grupları (parent'ı null olanları) bulmak için
    List<ProductionUnitDefinition> findByTenantIdAndParentProductionUnitIdIsNull(String tenantId);

    // Bir grubun alt bölümlerini bulmak için
    List<ProductionUnitDefinition> findByParentProductionUnitId(String parentProductionUnitId);

    // TODO: Silme kontrolü için bu repository'yi kullanan bir yer (örn: Üretim Emri) var mı diye kontrol edilmeli.
    // Şimdilik yok.
}