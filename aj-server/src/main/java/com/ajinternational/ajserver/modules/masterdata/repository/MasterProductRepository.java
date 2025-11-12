package com.ajinternational.ajserver.modules.masterdata.repository;

import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterProductRepository extends MongoRepository<MasterProduct, String> {

    List<MasterProduct> findByTenantId(String tenantId);

    Optional<MasterProduct> findByTenantIdAndCode(String tenantId, String code);

    // Ana/Alt ürün sayısı metodu kaldırıldı, çünkü o hiyerarşi artık yok.
    // long countByTenantIdAndParentProductIdIsNull(String tenantId);

    Optional<MasterProduct> findByTenantIdAndId(String tenantId, String id);

    // YENİ: Bir üretim birimini (Grup/Bölüm) kullanan ürün var mı? (Silme kontrolü için)
    boolean existsByTenantIdAndProductionUnitId(String tenantId, String productionUnitId);

    // 'findByParentProductId' metodu kaldırıldı.
}