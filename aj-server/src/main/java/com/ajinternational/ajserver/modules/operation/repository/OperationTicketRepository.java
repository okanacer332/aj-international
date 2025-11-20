package com.ajinternational.ajserver.modules.operation.repository;

import com.ajinternational.ajserver.modules.operation.model.OperationTicket;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface OperationTicketRepository extends MongoRepository<OperationTicket, String> {
    // Masaya ait tüm fişleri getir
    List<OperationTicket> findByTableId(String tableId);
}