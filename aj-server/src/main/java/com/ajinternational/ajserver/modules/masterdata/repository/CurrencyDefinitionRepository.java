package com.ajinternational.ajserver.modules.masterdata.repository;

import com.ajinternational.ajserver.modules.masterdata.model.CurrencyDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CurrencyDefinitionRepository extends MongoRepository<CurrencyDefinition, String> {
    List<CurrencyDefinition> findByTenantId(String tenantId);
    Optional<CurrencyDefinition> findByTenantIdAndId(String tenantId, String id);
    Optional<CurrencyDefinition> findByTenantIdAndCode(String tenantId, String code);
}