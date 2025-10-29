package com.ajinternational.ajserver.modules.hr.knowledge.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed; // Added Indexed import
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "user_product_knowledge")
// --- MODIFIED: Compound index now includes tenantId for uniqueness ---
@CompoundIndex(name = "tenant_user_product_idx", def = "{'tenantId': 1, 'userId': 1, 'productId': 1}", unique = true)
public class UserProductKnowledge {

    @Id
    private String id;

    // --- NEW FIELD: tenantId added ---
    @Indexed // Index for efficient tenant-based queries
    private String tenantId;
    // --- NEW FIELD END ---

    @Indexed // Keep index on userId as well
    private String userId;

    @Indexed // Keep index on productId as well
    private String productId;

    private int score; // 1-10 arası puan

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // --- MODIFIED: Constructor now includes tenantId ---
    public UserProductKnowledge(String tenantId, String userId, String productId, int score) {
        this.tenantId = tenantId; // Assign tenantId
        this.userId = userId;
        this.productId = productId;
        this.score = score;
        // createdAt and updatedAt are handled by Spring Data MongoDB automatically if configured
    }
}