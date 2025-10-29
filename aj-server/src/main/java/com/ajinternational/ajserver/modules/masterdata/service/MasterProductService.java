package com.ajinternational.ajserver.modules.masterdata.service;

// --- YENİ IMPORT ---
import com.ajinternational.ajserver.config.tenant.TenantContext;
// --- YENİ IMPORT SONU ---
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import lombok.RequiredArgsConstructor;
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
    // --- MOCK_TENANT_ID KALDIRILDI ---
    // private static final String MOCK_TENANT_ID = "TR";
    // --- MOCK_TENANT_ID KALDIRILDI SONU ---

    /**
     * Tüm ürünleri çeker ve sonsuz derinlikte hiyerarşik yapıyı kurarak sadece kök (ana) ürünleri döner.
     * Alt ürünler, ilgili ana ürünün 'subProducts' listesi içinde yer alır.
     */
    public List<MasterProduct> findAllHierarchicalProducts() {
        // --- DEĞİŞİKLİK: MOCK_TENANT_ID yerine TenantContext kullanıldı ---
        String currentTenantId = TenantContext.getCurrentTenant();
        if (currentTenantId == null) {
            logger.error("findAllHierarchicalProducts çağrılırken tenantId bulunamadı!");
            // Proje gereksinimine göre burada hata fırlatabilir veya boş liste dönebilirsiniz.
            throw new IllegalStateException("Tenant ID context'te bulunamadı.");
        }
        List<MasterProduct> allProducts = productRepository.findByTenantId(currentTenantId);
        logger.info("Tenant '{}' için tüm ürünler çekildi: {} adet.", currentTenantId, allProducts.size());
        // --- DEĞİŞİKLİK SONU ---

        // Hızlı erişim için tüm ürünleri ID'lerine göre map'leyelim.
        Map<String, MasterProduct> productMap = new HashMap<>();
        for (MasterProduct product : allProducts) {
            product.setSubProducts(new ArrayList<>()); // Alt ürün listesini initialize et
            productMap.put(product.getId(), product);
        }

        List<MasterProduct> rootProducts = new ArrayList<>();

        // Hiyerarşiyi kuralım
        for (MasterProduct product : allProducts) {
            Optional<String> parentIdOpt = product.getParentProductId().filter(s -> !s.trim().isEmpty());

            if (parentIdOpt.isPresent()) {
                String parentId = parentIdOpt.get();
                MasterProduct parent = productMap.get(parentId);
                if (parent != null) {
                    parent.getSubProducts().add(product);
                    logger.debug("Alt ürün '{}' ({}), ana ürün '{}' ({}) altına eklendi.", product.getName(), product.getId(), parent.getName(), parent.getId());
                } else {
                    logger.warn("Alt ürün '{}' ({}) için ana ürün ID'si '{}' bulundu ancak ilgili ana ürün map'te bulunamadı!", product.getName(), product.getId(), parentId);
                }
            } else {
                rootProducts.add(product);
                logger.debug("Kök ürün bulundu: '{}' ({})", product.getName(), product.getId());
            }
        }

        logger.info("Hiyerarşik yapı kuruldu. Kök ürün sayısı: {}", rootProducts.size());
        return rootProducts;
    }

    public MasterProduct saveProduct(MasterProduct product) {
        // --- DEĞİŞİKLİK: MOCK_TENANT_ID yerine TenantContext kullanıldı ---
        String currentTenantId = TenantContext.getCurrentTenant();
        if (currentTenantId == null) {
            logger.error("saveProduct çağrılırken tenantId bulunamadı!");
            throw new IllegalStateException("Tenant ID context'te bulunamadı.");
        }
        product.setTenantId(currentTenantId);
        // --- DEĞİŞİKLİK SONU ---

        String rawParentId = product.getParentProductId().orElse(null);
        String finalParentId = (rawParentId != null && !rawParentId.trim().isEmpty()) ? rawParentId.trim() : null;

        product.setParentProductId(finalParentId);

        if (finalParentId == null) {
            logger.info("SAVE LOG: Tenant '{}' - '{}' ürünü ANA ÜRÜN olarak kaydediliyor (parentProductId: null)", currentTenantId, product.getName());
        } else {
            if (!productRepository.existsById(finalParentId)) {
                logger.error("HATA: Tenant '{}' - Belirtilen ana ürün ID'si ({}) veritabanında bulunamadı. '{}' kaydedilemedi.", currentTenantId, finalParentId, product.getName());
                throw new IllegalArgumentException("Belirtilen ana ürün bulunamadı.");
            }
            logger.info("SAVE LOG: Tenant '{}' - '{}' ürünü ALT ÜRÜN olarak kaydediliyor (parentProductId: {})", currentTenantId, product.getName(), finalParentId);
        }

        // --- DEĞİŞİKLİK: MOCK_TENANT_ID yerine TenantContext kullanıldı ---
        productRepository.findByTenantIdAndCode(currentTenantId, product.getCode()).ifPresent(existing -> {
            // --- DEĞİŞİKLİK SONU ---
            if (product.getId() == null || !Objects.equals(existing.getId(), product.getId())) {
                logger.error("HATA: Tenant '{}' - Ürün kodu '{}' zaten '{}' adlı ürün tarafından kullanılıyor. '{}' kaydedilemedi.", currentTenantId, product.getCode(), existing.getName(), product.getName());
                throw new IllegalArgumentException("Bu ürün kodu zaten mevcut.");
            }
        });

        MasterProduct savedProduct = productRepository.save(product);
        logger.info("Ürün başarıyla kaydedildi/güncellendi: Tenant={}, ID={}, Kod={}, Ad={}", currentTenantId, savedProduct.getId(), savedProduct.getCode(), savedProduct.getName());
        return savedProduct;
    }

    /**
     * Bir ürünü ve (varsa) tüm alt ürünlerini rekürsif olarak siler.
     * Eğer silinmesi istenen ürünün alt ürünleri varsa, önce alt ürünler silinir.
     */
    public void deleteProduct(String id) {
        // --- DEĞİŞİKLİK: MOCK_TENANT_ID yerine TenantContext kullanıldı (veya findById direkt kullanılabilir) ---
        // Tenant kontrolü eklemek isterseniz:
        String currentTenantId = TenantContext.getCurrentTenant();
        if (currentTenantId == null) {
            logger.error("deleteProduct çağrılırken tenantId bulunamadı!");
            throw new IllegalStateException("Tenant ID context'te bulunamadı.");
        }
        // Silinecek ürünün var olup olmadığını ve doğru tenanta ait olup olmadığını kontrol et
        MasterProduct productToDelete = productRepository.findById(id)
                .filter(p -> p.getTenantId().equals(currentTenantId)) // Tenant kontrolü
                .orElseThrow(() -> {
                    logger.error("Silme Hatası: Tenant '{}' için ID'si '{}' olan ürün bulunamadı.", currentTenantId, id);
                    return new RuntimeException("Silinecek ürün bulunamadı: " + id);
                });
        // --- DEĞİŞİKLİK SONU ---

        logger.info("Silme işlemi başlatıldı: Tenant={}, ID={}, Kod={}, Ad={}", currentTenantId, productToDelete.getId(), productToDelete.getCode(), productToDelete.getName());

        // Rekürsif olarak alt ürünleri bul ve sil (Bu fonksiyon zaten ID ile çalıştığı için tenant kontrolüne gerek yok)
        deleteChildrenRecursive(id);

        // Ana ürünü sil
        productRepository.deleteById(id);
        logger.info("Ürün başarıyla silindi: Tenant={}, ID={}", currentTenantId, id);
    }

    /**
     * Belirtilen parentId'ye sahip tüm alt ürünleri ve onların alt ürünlerini rekürsif olarak siler.
     * Bu metodun içindeki productRepository çağrıları tenant'tan bağımsız çalışır (ID üzerinden).
     */
    private void deleteChildrenRecursive(String parentId) {
        List<MasterProduct> children = productRepository.findByParentProductId(parentId);
        if (!children.isEmpty()) {
            logger.info("ID'si '{}' olan ürünün {} adet alt ürünü bulundu. Siliniyor...", parentId, children.size());
            for (MasterProduct child : children) {
                deleteChildrenRecursive(child.getId());
                productRepository.deleteById(child.getId());
                logger.info("Alt ürün silindi: ID={}, Kod={}, Ad={}", child.getId(), child.getCode(), child.getName());
            }
        } else {
            logger.debug("ID'si '{}' olan ürünün silinecek alt ürünü bulunamadı.", parentId);
        }
    }


    public MasterProduct findById(String id) {
        // --- DEĞİŞİKLİK: MOCK_TENANT_ID yerine TenantContext kullanıldı ---
        String currentTenantId = TenantContext.getCurrentTenant();
        if (currentTenantId == null) {
            logger.error("findById çağrılırken tenantId bulunamadı!");
            throw new IllegalStateException("Tenant ID context'te bulunamadı.");
        }
        return productRepository.findById(id)
                .filter(p -> p.getTenantId().equals(currentTenantId)) // Tenant kontrolü
                .orElseThrow(() -> {
                    logger.error("Arama Hatası: Tenant '{}' için ID'si '{}' olan ürün bulunamadı.", currentTenantId, id);
                    return new RuntimeException("Ürün bulunamadı: " + id);
                });
        // --- DEĞİŞİKLİK SONU ---
    }
}