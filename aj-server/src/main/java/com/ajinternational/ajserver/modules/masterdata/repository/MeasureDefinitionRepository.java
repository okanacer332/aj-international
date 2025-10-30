package com.ajinternational.ajserver.modules.masterdata.repository;

import com.ajinternational.ajserver.modules.masterdata.model.MeasureDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeasureDefinitionRepository extends MongoRepository<MeasureDefinition, String> {

    List<MeasureDefinition> findByTenantId(String tenantId);

    Optional<MeasureDefinition> findByTenantIdAndId(String tenantId, String id);

    Optional<MeasureDefinition> findByTenantIdAndName(String tenantId, String name);
}