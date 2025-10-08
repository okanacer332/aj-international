package com.ajinternational.ajserver.modules.masterdata.repository;

import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterProductRepository extends MongoRepository<MasterProduct, String> {

    List<MasterProduct> findByTenantId(String tenantId);

    List<MasterProduct> findByTenantIdAndParentProductIdIsNull(String tenantId);

    List<MasterProduct> findByParentProductId(String parentProductId);

    Optional<MasterProduct> findByTenantIdAndCode(String tenantId, String code);

    long countByTenantIdAndParentProductIdIsNull(String tenantId); // BU SATIRI EKLE

}