package com.ajinternational.ajserver.modules.hr.knowledge.service;

// --- NEW IMPORTS ---
import com.ajinternational.ajserver.config.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// --- NEW IMPORTS END ---
import com.ajinternational.ajserver.modules.hr.knowledge.dto.KnowledgeUpdateRequest;
import com.ajinternational.ajserver.modules.hr.knowledge.model.UserProductKnowledge;
import com.ajinternational.ajserver.modules.hr.knowledge.repository.UserProductKnowledgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserProductKnowledgeService {

    // --- Logger added ---
    private static final Logger logger = LoggerFactory.getLogger(UserProductKnowledgeService.class);
    // --- Logger added end ---

    private final UserProductKnowledgeRepository repository;

    // --- Helper method added ---
    private String getCurrentTenantId() {
        String tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            logger.error("Tenant ID not found in context during knowledge operation!");
            throw new IllegalStateException("Tenant ID not found in context.");
        }
        return tenantId;
    }
    // --- Helper method end ---

    public List<UserProductKnowledge> getKnowledgeByUserId(String userId) {
        // --- MODIFIED: Use tenant-specific query ---
        String currentTenantId = getCurrentTenantId();
        logger.debug("Fetching knowledge for User ID: {} in Tenant: {}", userId, currentTenantId);
        return repository.findByTenantIdAndUserId(currentTenantId, userId);
        // --- MODIFICATION END ---
    }

    public void saveOrUpdateKnowledge(String userId, List<KnowledgeUpdateRequest> requests) {
        // --- MODIFIED: Fetch existing records based on tenant and user ---
        String currentTenantId = getCurrentTenantId();
        logger.info("Saving/Updating knowledge for User ID: {} in Tenant: {}", userId, currentTenantId);

        // Fetch existing records for the specific user within the current tenant
        Map<String, UserProductKnowledge> existingKnowledgeMap = repository.findByTenantIdAndUserId(currentTenantId, userId).stream()
                .collect(Collectors.toMap(UserProductKnowledge::getProductId, Function.identity()));
        // --- MODIFICATION END ---

        List<UserProductKnowledge> toSave = new ArrayList<>();

        for (KnowledgeUpdateRequest req : requests) {
            UserProductKnowledge existing = existingKnowledgeMap.get(req.productId());
            if (existing != null) {
                // If record exists, update score and timestamp
                if (existing.getScore() != req.score()) { // Only update if score changed
                    existing.setScore(req.score());
                    existing.setUpdatedAt(LocalDateTime.now());
                    toSave.add(existing);
                    logger.debug("Updating knowledge: Tenant={}, User={}, Product={}, Score={}", currentTenantId, userId, req.productId(), req.score());
                } else {
                    logger.debug("Skipping update (score unchanged): Tenant={}, User={}, Product={}", currentTenantId, userId, req.productId());
                }
            } else {
                // If record doesn't exist, create a new one with tenantId
                // --- MODIFIED: Pass tenantId to constructor ---
                toSave.add(new UserProductKnowledge(currentTenantId, userId, req.productId(), req.score()));
                logger.debug("Creating new knowledge: Tenant={}, User={}, Product={}, Score={}", currentTenantId, userId, req.productId(), req.score());
                // --- MODIFICATION END ---
            }
        }

        if (!toSave.isEmpty()) {
            repository.saveAll(toSave);
            logger.info("Saved/Updated {} knowledge records for User ID: {} in Tenant: {}", toSave.size(), userId, currentTenantId);
        } else {
            logger.info("No knowledge records needed saving/updating for User ID: {} in Tenant: {}", userId, currentTenantId);
        }
    }

    // --- NEW METHOD (Optional but useful for dashboard/aggregations) ---
    /**
     * Gets all knowledge records for the current tenant.
     * Use with caution, can return a large dataset.
     * @return List of all knowledge records for the current tenant.
     */
    public List<UserProductKnowledge> getAllKnowledgeForCurrentTenant() {
        String currentTenantId = getCurrentTenantId();
        logger.debug("Fetching all knowledge records for Tenant: {}", currentTenantId);
        return repository.findAllByTenantId(currentTenantId);
    }
    // --- NEW METHOD END ---
}