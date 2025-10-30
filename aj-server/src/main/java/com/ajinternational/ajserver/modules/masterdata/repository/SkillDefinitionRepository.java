package com.ajinternational.ajserver.modules.masterdata.repository;

import com.ajinternational.ajserver.modules.masterdata.model.SkillDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillDefinitionRepository extends MongoRepository<SkillDefinition, String> {

    List<SkillDefinition> findByTenantId(String tenantId);

    Optional<SkillDefinition> findByTenantIdAndId(String tenantId, String id);

    Optional<SkillDefinition> findByTenantIdAndSkillName(String tenantId, String skillName);
}