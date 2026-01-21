package com.ajinternational.ajserver.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * MongoDB Index Configuration
 * 
 * Creates indexes on application startup for performance optimization.
 * Includes TTL indexes for automatic data expiration.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MongoIndexConfig {

    private final MongoTemplate mongoTemplate;

    // TTL values
    private static final long AUDIT_LOG_TTL_DAYS = 90; // 90 gün sonra otomatik silme

    @PostConstruct
    public void initIndexes() {
        log.info("Initializing MongoDB indexes for performance optimization...");

        try {
            // MasterData indexes
            createTenantIndex("masterProducts");
            createCompoundIndex("masterProducts", "tenantId", "createdAt");
            createCompoundIndex("masterProducts", "tenantId", "code");

            // Service definitions
            createTenantIndex("serviceDefinitions");

            // Skills, Measures, Currencies
            createTenantIndex("skillDefinitions");
            createTenantIndex("measureDefinitions");
            createTenantIndex("currencyDefinitions");
            createTenantIndex("unitDefinitions");
            createTenantIndex("productionUnitDefinitions");

            // Inventory indexes
            createTenantIndex("depotDefinitions");
            createTenantIndex("materialDefinitions");
            createTenantIndex("supplierDefinitions");
            createTenantIndex("customerDefinitions");
            createTenantIndex("inventoryEntries");
            createTenantIndex("inventoryDispatches");
            createCompoundIndex("inventoryEntries", "tenantId", "createdAt");
            createCompoundIndex("inventoryDispatches", "tenantId", "createdAt");

            // Personnel indexes
            createTenantIndex("personnel");
            createCompoundIndex("personnel", "tenantId", "unitId");
            createCompoundIndex("personnel", "tenantId", "isActive");

            // Operations indexes
            createTenantIndex("operations");
            createCompoundIndex("operations", "tenantId", "status");
            createCompoundIndex("operations", "tenantId", "createdAt");

            // IAM indexes
            createTenantIndex("users");
            createTenantIndex("roles");
            createCompoundIndex("users", "tenantId", "email");

            // Audit logs with TTL (auto-expire after 90 days)
            createTenantIndex("auditLogs");
            createCompoundIndex("auditLogs", "tenantId", "timestamp");
            createTTLIndex("auditLogs", "timestamp", AUDIT_LOG_TTL_DAYS);

            log.info("MongoDB indexes initialized successfully!");

        } catch (Exception e) {
            log.error("Error initializing MongoDB indexes: {}", e.getMessage());
        }
    }

    /**
     * Creates a simple index on tenantId field
     */
    private void createTenantIndex(String collectionName) {
        try {
            if (mongoTemplate.collectionExists(collectionName)) {
                mongoTemplate.indexOps(collectionName)
                        .ensureIndex(new Index().on("tenantId", Sort.Direction.ASC).background());
                log.debug("Created tenantId index on collection: {}", collectionName);
            }
        } catch (Exception e) {
            log.warn("Could not create index on {}: {}", collectionName, e.getMessage());
        }
    }

    /**
     * Creates a compound index on tenantId and another field
     */
    private void createCompoundIndex(String collectionName, String field1, String field2) {
        try {
            if (mongoTemplate.collectionExists(collectionName)) {
                mongoTemplate.indexOps(collectionName)
                        .ensureIndex(new Index()
                                .on(field1, Sort.Direction.ASC)
                                .on(field2, Sort.Direction.DESC)
                                .background());
                log.debug("Created compound index ({}, {}) on collection: {}", field1, field2, collectionName);
            }
        } catch (Exception e) {
            log.warn("Could not create compound index on {}: {}", collectionName, e.getMessage());
        }
    }

    /**
     * Creates a TTL index for automatic document expiration
     * 
     * @param collectionName The collection to create TTL index on
     * @param dateField      The date field to base expiration on
     * @param expireDays     Number of days after which documents expire
     */
    private void createTTLIndex(String collectionName, String dateField, long expireDays) {
        try {
            if (mongoTemplate.collectionExists(collectionName)) {
                mongoTemplate.indexOps(collectionName)
                        .ensureIndex(new Index()
                                .on(dateField, Sort.Direction.ASC)
                                .expire(Duration.ofDays(expireDays))
                                .named(collectionName + "_ttl_" + expireDays + "d")
                                .background());
                log.info("Created TTL index on {} (expires after {} days)", collectionName, expireDays);
            }
        } catch (Exception e) {
            log.warn("Could not create TTL index on {}: {}", collectionName, e.getMessage());
        }
    }
}
