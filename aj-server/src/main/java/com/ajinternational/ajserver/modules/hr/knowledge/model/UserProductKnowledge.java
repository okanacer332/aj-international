package com.ajinternational.ajserver.modules.hr.knowledge.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed; // Eklendi
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "user_product_knowledge")
// Güncellendi: Artık tenant'ı da içermeli (Bir kullanıcı, bir ürüne her tenant'ta farklı puan verebilir mi? Şimdilik hayır, user+product unique)
@CompoundIndex(name = "user_product_idx", def = "{'userId' : 1, 'productId' : 1}", unique = true)
public class UserProductKnowledge {

    @Id
    private String id;

    @Indexed // Eklendi: Tenant'a göre sorgulamak için
    private String tenantId;

    @Indexed // Eklendi
    private String userId;

    @Indexed // Eklendi
    private String productId;

    private int score; // 1-10 arası puan

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Güncellendi: Artık tenantId alıyor
    public UserProductKnowledge(String tenantId, String userId, String productId, int score) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.productId = productId;
        this.score = score;
    }
}