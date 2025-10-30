package com.ajinternational.ajserver.modules.masterdata.repository;

import com.ajinternational.ajserver.modules.masterdata.model.ServiceDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceDefinitionRepository extends MongoRepository<ServiceDefinition, String> {

    List<ServiceDefinition> findByTenantId(String tenantId);

    Optional<ServiceDefinition> findByTenantIdAndId(String tenantId, String id);

    // Plaka benzersizlik kontrolü için
    Optional<ServiceDefinition> findByTenantIdAndVehiclePlate(String tenantId, String vehiclePlate);
}