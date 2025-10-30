package com.ajinternational.ajserver.modules.hr.personnel.repository;

import com.ajinternational.ajserver.modules.hr.personnel.model.Personnel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonnelRepository extends MongoRepository<Personnel, String> {

    List<Personnel> findByTenantId(String tenantId);

    Optional<Personnel> findByTenantIdAndId(String tenantId, String id);

    Optional<Personnel> findByTenantIdAndOnxCode(String tenantId, String onxCode);

    boolean existsByTenantIdAndOnxCode(String tenantId, String onxCode);
}