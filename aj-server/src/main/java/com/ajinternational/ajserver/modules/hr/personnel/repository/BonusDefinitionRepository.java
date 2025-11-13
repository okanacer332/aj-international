package com.ajinternational.ajserver.modules.hr.personnel.repository;

import com.ajinternational.ajserver.modules.hr.personnel.model.BonusDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BonusDefinitionRepository extends MongoRepository<BonusDefinition, String> {
    List<BonusDefinition> findByTenantId(String tenantId);
    // Aynı bölüme aynı isimle prim tanımlanmasını engellemek için opsiyonel kontrol
    boolean existsByTenantIdAndProductionSectionIdAndName(String tenantId, String sectionId, String name);
}