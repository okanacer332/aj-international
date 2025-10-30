package com.ajinternational.ajserver.modules.hr.knowledge.service;

import com.ajinternational.ajserver.config.TenantContextHolder; // Eklendi
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

    private final UserProductKnowledgeRepository repository;

    public List<UserProductKnowledge> getKnowledgeByUserId(String userId) {
        // Bu metot kullanıcıya özel çalıştığı için tenantId'ye gerek duymaz
        return repository.findByUserId(userId);
    }

    public void saveOrUpdateKnowledge(String userId, List<KnowledgeUpdateRequest> requests) {
        // GÜNCELLENDİ: Eylemi yapan kullanıcının o anki tenant'ını al
        String currentTenantId = TenantContextHolder.getCurrentTenantId();

        Map<String, UserProductKnowledge> existingKnowledgeMap = repository.findByUserId(userId).stream()
                .collect(Collectors.toMap(UserProductKnowledge::getProductId, Function.identity()));

        List<UserProductKnowledge> toSave = new ArrayList<>();

        for (KnowledgeUpdateRequest req : requests) {
            UserProductKnowledge existing = existingKnowledgeMap.get(req.productId());
            if (existing != null) {
                existing.setScore(req.score());
                existing.setUpdatedAt(LocalDateTime.now());
                // GÜNCELLENDİ: Mevcut kaydın tenantId'sini de güncelle (Eğer daha önceden null ise)
                if (existing.getTenantId() == null) {
                    existing.setTenantId(currentTenantId);
                }
                toSave.add(existing);
            } else {
                // GÜNCELLENDİ: Yeni kayıt oluştururken tenantId'yi ekle
                toSave.add(new UserProductKnowledge(currentTenantId, userId, req.productId(), req.score()));
            }
        }

        if (!toSave.isEmpty()) {
            repository.saveAll(toSave);
        }
    }
}