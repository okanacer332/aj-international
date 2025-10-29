package com.ajinternational.ajserver.modules.hr.knowledge.repository;

import com.ajinternational.ajserver.modules.hr.knowledge.model.UserProductKnowledge;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProductKnowledgeRepository extends MongoRepository<UserProductKnowledge, String> {

    // Keep this if you need to find *all* knowledge for a user *across tenants* (less likely now)
    // List<UserProductKnowledge> findByUserId(String userId);

    // Keep this if you need to find specific knowledge for a user *across tenants* (less likely now)
    // Optional<UserProductKnowledge> findByUserIdAndProductId(String userId, String productId);

    // --- NEW METHODS ---

    /**
     * Finds all knowledge records for a specific user within a specific tenant.
     * @param tenantId The tenant ID.
     * @param userId The user ID.
     * @return A list of knowledge records for the user in that tenant.
     */
    List<UserProductKnowledge> findByTenantIdAndUserId(String tenantId, String userId);

    /**
     * Finds a specific knowledge record for a user and product within a specific tenant.
     * @param tenantId The tenant ID.
     * @param userId The user ID.
     * @param productId The product ID.
     * @return An Optional containing the knowledge record if found.
     */
    Optional<UserProductKnowledge> findByTenantIdAndUserIdAndProductId(String tenantId, String userId, String productId);

    /**
     * Finds all knowledge records within a specific tenant.
     * (Useful for administrative tasks or dashboard aggregations)
     * @param tenantId The tenant ID.
     * @return A list of all knowledge records for that tenant.
     */
    List<UserProductKnowledge> findAllByTenantId(String tenantId); // Added this for potential future use

    // --- NEW METHODS END ---

}