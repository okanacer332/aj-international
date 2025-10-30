package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.TenantContextHolder; // Eklendi
import com.ajinternational.ajserver.modules.audit.service.AuditLogService; // Eklendi
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails; // Eklendi
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class MasterProductService {

    private static final Logger logger = LoggerFactory.getLogger(MasterProductService.class);

    private final MasterProductRepository productRepository;
    private final AuditLogService auditLogService; // Eklendi

    // Mock Tenant ID kaldırıldı.

    /**
     * Güncellendi: Artık o anki kullanıcının tenant'ına göre ürünleri çeker.
     * Süper Admin ise tüm tenant'lardaki ürünleri hiyerarşik olarak görür.
     */
    public List<MasterProduct> findAllHierarchicalProducts() {
        UserDetails userDetails = TenantContextHolder.getCurrentUserDetails();
        String tenantId = TenantContextHolder.getCurrentTenantId();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        List<MasterProduct> allProducts;
        if (isSuperAdmin) {
            allProducts = productRepository.findAll();
            logger.info("Süper Admin için tüm tenant'lardaki ürünler çekildi: {} adet.", allProducts.size());
        } else {
            allProducts = productRepository.findByTenantId(tenantId);
            logger.info("Tenant '{}' için tüm ürünler çekildi: {} adet.", tenantId, allProducts.size());
        }

        // Hiyerarşi kurma mantığı (değişmedi)
        Map<String, MasterProduct> productMap = new HashMap<>();
        for (MasterProduct product : allProducts) {
            product.setSubProducts(new ArrayList<>());
            productMap.put(product.getId(), product);
        }

        List<MasterProduct> rootProducts = new ArrayList<>();
        for (MasterProduct product : allProducts) {
            Optional<String> parentIdOpt = product.getParentProductId().filter(s -> !s.trim().isEmpty());
            if (parentIdOpt.isPresent()) {
                MasterProduct parent = productMap.get(parentIdOpt.get());
                if (parent != null) {
                    parent.getSubProducts().add(product);
                } else {
                    logger.warn("Alt ürün '{}' ({}) için ana ürün ID'si '{}' bulundu ancak ilgili ana ürün map'te bulunamadı!", product.getName(), product.getId(), parentIdOpt.get());
                }
            } else {
                rootProducts.add(product);
            }
        }
        logger.info("Hiyerarşik yapı kuruldu. Kök ürün sayısı: {}", rootProducts.size());
        return rootProducts;
    }

    /**
     * Güncellendi: Artık ürünleri o anki kullanıcının tenant'ına kaydeder/günceller.
     */
    public MasterProduct saveProduct(MasterProduct product) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        String rawParentId = product.getParentProductId().orElse(null);
        String finalParentId = (rawParentId != null && !rawParentId.trim().isEmpty()) ? rawParentId.trim() : null;
        product.setParentProductId(finalParentId);

        String logAction;
        String logDetails;

        if (product.getId() == null) {
            // YENİ ÜRÜN OLUŞTURMA
            product.setTenantId(currentTenantId); // Tenant'ı otomatik ata
            logAction = "PRODUCT_CREATED";
            logDetails = "Yeni ürün oluşturuldu: " + product.getCode();
        } else {
            // MEVCUT ÜRÜN GÜNCELLEME
            // Güvenlik kontrolü: Bu ürünü güncelleme yetkisi var mı?
            MasterProduct existingProduct = this.findById(product.getId()) // findById artık tenant-aware
                    .orElseThrow(() -> new RuntimeException("Ürün bulunamadı veya bu ürüne erişim yetkiniz yok: " + product.getId()));

            // Güncellemede tenant'ın değişmediğinden emin ol
            product.setTenantId(existingProduct.getTenantId());
            logAction = "PRODUCT_UPDATED";
            logDetails = "Ürün güncellendi: " + product.getCode();
        }

        // Kod benzersizlik kontrolü (Artık currentTenantId kullanılıyor)
        productRepository.findByTenantIdAndCode(product.getTenantId(), product.getCode()).ifPresent(existing -> {
            if (product.getId() == null || !Objects.equals(existing.getId(), product.getId())) {
                logger.error("HATA: Ürün kodu '{}' zaten '{}' adlı ürün tarafından kullanılıyor. '{}' kaydedilemedi.", product.getCode(), existing.getName(), product.getName());
                throw new IllegalArgumentException("Bu ürün kodu zaten mevcut.");
            }
        });

        MasterProduct savedProduct = productRepository.save(product);
        logger.info("Ürün başarıyla kaydedildi/güncellendi: ID={}, Kod={}, Ad={}", savedProduct.getId(), savedProduct.getCode(), savedProduct.getName());

        // Loglama eklendi
        auditLogService.logAction(currentTenantId, currentUsername, logAction, logDetails);

        return savedProduct;
    }

    /**
     * Güncellendi: Artık ürünü silmeden önce tenant sahipliğini kontrol eder.
     */
    public void deleteProduct(String id) {
        String currentTenantId = TenantContextHolder.getCurrentTenantId();
        String currentUsername = TenantContextHolder.getCurrentUsername();

        // Güvenlik kontrolü: Önce ürünü tenant'a göre bul
        MasterProduct productToDelete = this.findById(id) // findById artık tenant-aware
                .orElseThrow(() -> {
                    logger.error("Silme Hatası: ID'si '{}' olan ürün bulunamadı veya erişim yetkiniz yok.", id);
                    return new RuntimeException("Silinecek ürün bulunamadı veya bu ürüne erişim yetkiniz yok: " + id);
                });

        logger.info("Silme işlemi başlatıldı: ID={}, Kod={}, Ad={}", productToDelete.getId(), productToDelete.getCode(), productToDelete.getName());

        deleteChildrenRecursive(id); // Bu metot zaten ID'ye göre çalıştığı için tenant-safe

        productRepository.deleteById(id);
        logger.info("Ürün başarıyla silindi: ID={}", id);

        // Loglama eklendi
        auditLogService.logAction(currentTenantId, currentUsername, "PRODUCT_DELETED", "Ürün silindi: " + productToDelete.getCode());
    }

    private void deleteChildrenRecursive(String parentId) {
        // Bu metot, üst metot (deleteProduct) tarafından zaten tenant kontrolünden geçmiş
        // bir parentId'den başladığı için, alt ürünler de aynı tenant'ta olacaktır.
        List<MasterProduct> children = productRepository.findByParentProductId(parentId);
        if (!children.isEmpty()) {
            logger.info("ID'si '{}' olan ürünün {} adet alt ürünü bulundu. Siliniyor...", parentId, children.size());
            for (MasterProduct child : children) {
                deleteChildrenRecursive(child.getId());
                productRepository.deleteById(child.getId());
                logger.info("Alt ürün silindi: ID={}, Kod={}, Ad={}", child.getId(), child.getCode(), child.getName());
            }
        }
    }

    /**
     * Güncellendi: Artık multi-tenant güvenli.
     */
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