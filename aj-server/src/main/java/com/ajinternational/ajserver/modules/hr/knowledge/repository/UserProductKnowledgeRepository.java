package com.ajinternational.ajserver.modules.hr.knowledge.repository;

import com.ajinternational.ajserver.modules.hr.knowledge.model.UserProductKnowledge;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProductKnowledgeRepository extends MongoRepository<UserProductKnowledge, String> {

    List<UserProductKnowledge> findByUserId(String userId);

    Optional<UserProductKnowledge> findByUserIdAndProductId(String userId, String productId);

}