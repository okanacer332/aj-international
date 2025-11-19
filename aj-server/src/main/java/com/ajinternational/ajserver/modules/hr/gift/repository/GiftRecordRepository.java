package com.ajinternational.ajserver.modules.hr.gift.repository;

import com.ajinternational.ajserver.modules.hr.gift.model.GiftRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GiftRecordRepository extends MongoRepository<GiftRecord, String> {
    List<GiftRecord> findByTenantId(String tenantId);
    List<GiftRecord> findByTenantIdAndRecipientId(String tenantId, String recipientId);
}