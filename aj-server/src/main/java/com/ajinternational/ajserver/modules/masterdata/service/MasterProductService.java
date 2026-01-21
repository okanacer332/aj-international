package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.common.dto.PageResponse;
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.model.ProductionUnitDefinition;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import com.ajinternational.ajserver.modules.masterdata.repository.ProductionUnitDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class MasterProductService {

    private static final Logger logger = LoggerFactory.getLogger(MasterProductService.class);

    private final MasterProductRepository productRepository;
    private final AuditLogService auditLogService;
    // YENİ: Üretim birimlerine (Grup/Bölüm) erişim için
    private final ProductionUnitDefinitionRepository productionUnitRepository;

    private boolean isSuperAdmin() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    /**
     * Güncellendi: Artık hiyerarşik değil, düz bir liste döndürür.
     * Ancak ürünlere Grup ve Bölüm adlarını (@Transient) ekler.
     * 
     * @Cacheable - Products are cached per tenant for 24 hours
     */
    @Cacheable(value = "products", key = "#root.target.getCurrentTenantIdForCache()")
    public List<MasterProduct> findAllProducts() {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        // 1. Tüm ürünleri (düz liste) ve üretim birimlerini (düz liste) çek
        List<MasterProduct> allProducts = isSuperAdmin()
                ? productRepository.findAll()
                : productRepository.findByTenantId(tenantId);

        List<ProductionUnitDefinition> allProductionUnits = isSuperAdmin()
                ? productionUnitRepository.findAll()
                : productionUnitRepository.findByTenantId(tenantId);

        // 2. Üretim birimlerini bir haritaya çevir (ID -> İsim)
        Map<String, ProductionUnitDefinition> unitMap = allProductionUnits.stream()
                .collect(Collectors.toMap(ProductionUnitDefinition::getId, Function.identity()));

        // 3. Ürünleri döngüye al ve @Transient alanları doldur
        enrichProductsWithUnitNames(allProducts, unitMap);

        logger.info("Tenant '{}' için tüm ürünler (Grup/Bölüm bilgileriyle) çekildi: {} adet.", tenantId,
                allProducts.size());
        return allProducts;
    }

    /**
     * NEW: Paginated version of findAllProducts for large datasets
     * 
     * @param pageable Pagination and sorting parameters
     * @return PageResponse with paginated products
     */
    public PageResponse<MasterProduct> findAllProductsPaginated(Pageable pageable) {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        Page<MasterProduct> productPage = isSuperAdmin()
                ? productRepository.findAll(pageable)
                : productRepository.findByTenantId(tenantId, pageable);

        // Enrich with unit names (same as non-paginated version)
        List<ProductionUnitDefinition> allProductionUnits = isSuperAdmin()
                ? productionUnitRepository.findAll()
                : productionUnitRepository.findByTenantId(tenantId);

        Map<String, ProductionUnitDefinition> unitMap = allProductionUnits.stream()
                .collect(Collectors.toMap(ProductionUnitDefinition::getId, Function.identity()));

        enrichProductsWithUnitNames(productPage.getContent(), unitMap);

        logger.info("Tenant '{}' için sayfalı ürünler çekildi: {} / {} (sayfa {})",
                tenantId, productPage.getNumberOfElements(), productPage.getTotalElements(), pageable.getPageNumber());

        return PageResponse.fromPage(productPage);
    }

    /**
     * Helper method to enrich products with group/section names
     */
    private void enrichProductsWithUnitNames(List<MasterProduct> products,
            Map<String, ProductionUnitDefinition> unitMap) {
        for (MasterProduct product : products) {
            if (product.getProductionUnitId() != null) {
                ProductionUnitDefinition section = unitMap.get(product.getProductionUnitId());
                if (section != null) {
                    product.setSectionName(section.getName());
                    // Bölümün parent'ını (Grubu) bul
                    if (section.parentProductionUnitIdOptional().isPresent()) {
                        ProductionUnitDefinition group = unitMap.get(section.parentProductionUnitIdOptional().get());
                        if (group != null) {
                            product.setGroupName(group.getName());
                        }
                    }
                }
            }
        }
    }

    /**
     * Güncellendi: Artık hiyerarşiyi değil, yeni alanları (productionUnitId,
     * unitPrice) kaydeder.
     * 
     * @CacheEvict - Clears products cache on save to ensure data consistency
     */
    @CacheEvict(value = "products", key = "#root.target.getCurrentTenantIdForCache()")
    public MasterProduct saveProduct(MasterProduct product) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        // 'parentProductId' alanı artık yok.
        // 'productionUnitId' değerini temizle
        String rawUnitId = product.getProductionUnitId();
        String finalUnitId = (rawUnitId != null && !rawUnitId.trim().isEmpty() && !rawUnitId.equals("null"))
                ? rawUnitId.trim()
                : null;
        product.setProductionUnitId(finalUnitId);

        String logAction;
        String logDetails;

        if (product.getId() == null) {
            // YENİ ÜRÜN OLUŞTURMA
            product.setTenantId(currentTenantId);
            logAction = "PRODUCT_CREATED";
            logDetails = "Yeni ürün oluşturuldu: " + product.getCode();
        } else {
            // MEVCUT ÜRÜN GÜNCELLEME
            MasterProduct existingProduct = this.findById(product.getId())
                    .orElseThrow(() -> new RuntimeException(
                            "Ürün bulunamadı veya bu ürüne erişim yetkiniz yok: " + product.getId()));

            product.setTenantId(existingProduct.getTenantId());
            logAction = "PRODUCT_UPDATED";
            logDetails = "Ürün güncellendi: " + product.getCode();
        }

        // Kod benzersizlik kontrolü (Aynı)
        productRepository.findByTenantIdAndCode(product.getTenantId(), product.getCode()).ifPresent(existing -> {
            if (product.getId() == null || !Objects.equals(existing.getId(), product.getId())) {
                logger.error("HATA: Ürün kodu '{}' zaten '{}' adlı ürün tarafından kullanılıyor. '{}' kaydedilemedi.",
                        product.getCode(), existing.getName(), product.getName());
                throw new IllegalArgumentException("Bu ürün kodu zaten mevcut.");
            }
        });

        // EĞER GRUP/BÖLÜM SEÇİLMEDİYSE (finalUnitId == null),
        // ALT ÜRÜN ALANLARINI TEMİZLE
        if (finalUnitId == null) {
            product.setTargetValue(null);
            product.setMeasureDefinitionId(null);
            product.setActive(true);
            product.setWasteRate(null);
            product.setUnitPrice(null); // 'unitPrice' oldu
        }

        MasterProduct savedProduct = productRepository.save(product);
        logger.info("Ürün başarıyla kaydedildi/güncellendi: ID={}, Kod={}, Ad={}", savedProduct.getId(),
                savedProduct.getCode(), savedProduct.getName());

        auditLogService.logAction(currentTenantId, currentUsername, logAction, logDetails);
        return savedProduct;
    }

    /**
     * Güncellendi: Artık alt ürünleri silmekle uğraşmıyor.
     * 
     * @CacheEvict - Clears products cache on delete
     */
    @CacheEvict(value = "products", key = "#root.target.getCurrentTenantIdForCache()")
    public void deleteProduct(String id) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        MasterProduct productToDelete = this.findById(id)
                .orElseThrow(() -> {
                    logger.error("Silme Hatası: ID'si '{}' olan ürün bulunamadı veya erişim yetkiniz yok.", id);
                    return new RuntimeException("Silinecek ürün bulunamadı veya bu ürüne erişim yetkiniz yok: " + id);
                });

        logger.info("Silme işlemi başlatıldı: ID={}, Kod={}, Ad={}", productToDelete.getId(), productToDelete.getCode(),
                productToDelete.getName());

        // Hiyerarşik silme (deleteChildrenRecursive) kaldırıldı.

        productRepository.deleteById(id);
        logger.info("Ürün başarıyla silindi: ID={}", id);

        auditLogService.logAction(currentTenantId, currentUsername, "PRODUCT_DELETED",
                "Ürün silindi: " + productToDelete.getCode());
    }

    // Helper method for cache key generation
    public String getCurrentTenantIdForCache() {
        return TenantContextHolder.getCurrentTenantId();
    }

    // Tenant-güvenli findById (Aynı)
    @Cacheable(value = "products", key = "'detail_' + #id")
    public Optional<MasterProduct> findById(String id) {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            return productRepository.findById(id);
        } else {
            return productRepository.findByTenantIdAndId(tenantId, id);
        }
    }
}