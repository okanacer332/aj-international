package com.ajinternational.ajserver.modules.hr.knowledge.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "user_product_knowledge")
@CompoundIndex(name = "user_product_idx", def = "{'userId': 1, 'productId': 1}", unique = true)
public class UserProductKnowledge {

    @Id
    private String id;

    private String userId;

    private String productId;

    private int score; // 1-10 arası puan

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public UserProductKnowledge(String userId, String productId, int score) {
        this.userId = userId;
        this.productId = productId;
        this.score = score;
    }
}