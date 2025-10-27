package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList; // ArrayList eklendi
import java.util.HashMap; // HashMap eklendi
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional; // Optional importu korundu
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class MasterProductService {

    private static final Logger logger = LoggerFactory.getLogger(MasterProductService.class);

    private final MasterProductRepository productRepository;
    // Mock Tenant ID'sini bir sabit olarak tanımlayalım
    private static final String MOCK_TENANT_ID = "TR";

    /**
     * Tüm ürünleri çeker ve sonsuz derinlikte hiyerarşik yapıyı kurarak sadece kök (ana) ürünleri döner.
     * Alt ürünler, ilgili ana ürünün 'subProducts' listesi içinde yer alır.
     */
    public List<MasterProduct> findAllHierarchicalProducts() {
        List<MasterProduct> allProducts = productRepository.findByTenantId(MOCK_TENANT_ID);
        logger.info("Tenant '{}' için tüm ürünler çekildi: {} adet.", MOCK_TENANT_ID, allProducts.size());

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
                    // Mevcut getSubProducts null olamayacağı için direkt ekleme yapabiliriz.
                    parent.getSubProducts().add(product);
                    logger.debug("Alt ürün '{}' ({}), ana ürün '{}' ({}) altına eklendi.", product.getName(), product.getId(), parent.getName(), parent.getId());
                } else {
                    // Bu durum normalde olmamalı (veritabanı tutarlılığı varsa)
                    logger.warn("Alt ürün '{}' ({}) için ana ürün ID'si '{}' bulundu ancak ilgili ana ürün map'te bulunamadı!", product.getName(), product.getId(), parentId);
                    // Ana ürünü bulunamayanları da kök olarak ekleyebiliriz (opsiyonel)
                    // rootProducts.add(product);
                }
            } else {
                // parentProductId'si olmayanlar kök ürünlerdir.
                rootProducts.add(product);
                logger.debug("Kök ürün bulundu: '{}' ({})", product.getName(), product.getId());
            }
        }

        logger.info("Hiyerarşik yapı kuruldu. Kök ürün sayısı: {}", rootProducts.size());
        return rootProducts;
    }

    public MasterProduct saveProduct(MasterProduct product) {
        product.setTenantId(MOCK_TENANT_ID);

        String rawParentId = product.getParentProductId().orElse(null);
        String finalParentId = (rawParentId != null && !rawParentId.trim().isEmpty()) ? rawParentId.trim() : null;

        product.setParentProductId(finalParentId); // Set the potentially modified parent ID

        if (finalParentId == null) {
            logger.info("SAVE LOG: '{}' ürünü ANA ÜRÜN olarak kaydediliyor (parentProductId: null)", product.getName());
        } else {
            // Kaydetmeden önce parent'ın var olup olmadığını kontrol etmek iyi bir pratik olabilir.
            if (!productRepository.existsById(finalParentId)) {
                logger.error("HATA: Belirtilen ana ürün ID'si ({}) veritabanında bulunamadı. '{}' kaydedilemedi.", finalParentId, product.getName());
                throw new IllegalArgumentException("Belirtilen ana ürün bulunamadı.");
            }
            logger.info("SAVE LOG: '{}' ürünü ALT ÜRÜN olarak kaydediliyor (parentProductId: {})", product.getName(), finalParentId);
        }

        // Kod benzersizlik kontrolü (Mevcut mantık doğru)
        productRepository.findByTenantIdAndCode(MOCK_TENANT_ID, product.getCode()).ifPresent(existing -> {
            // Eğer yeni bir ürün ekleniyorsa (ID'si yoksa) VEYA
            // mevcut bir ürün güncelleniyorsa AMA bulunan ID, güncellenen ID ile aynı değilse hata ver.
            if (product.getId() == null || !Objects.equals(existing.getId(), product.getId())) {
                logger.error("HATA: Ürün kodu '{}' zaten '{}' adlı ürün tarafından kullanılıyor. '{}' kaydedilemedi.", product.getCode(), existing.getName(), product.getName());
                throw new IllegalArgumentException("Bu ürün kodu zaten mevcut.");
            }
        });

        MasterProduct savedProduct = productRepository.save(product);
        logger.info("Ürün başarıyla kaydedildi/güncellendi: ID={}, Kod={}, Ad={}", savedProduct.getId(), savedProduct.getCode(), savedProduct.getName());
        return savedProduct;
    }

    /**
     * Bir ürünü ve (varsa) tüm alt ürünlerini rekürsif olarak siler.
     * Eğer silinmesi istenen ürünün alt ürünleri varsa, önce alt ürünler silinir.
     */
    public void deleteProduct(String id) {
        // Silinecek ürünün var olup olmadığını kontrol et
        MasterProduct productToDelete = productRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Silme Hatası: ID'si '{}' olan ürün bulunamadı.", id);
                    return new RuntimeException("Silinecek ürün bulunamadı: " + id);
                });

        logger.info("Silme işlemi başlatıldı: ID={}, Kod={}, Ad={}", productToDelete.getId(), productToDelete.getCode(), productToDelete.getName());

        // Rekürsif olarak alt ürünleri bul ve sil
        deleteChildrenRecursive(id);

        // Ana ürünü sil
        productRepository.deleteById(id);
        logger.info("Ürün başarıyla silindi: ID={}", id);
    }

    /**
     * Belirtilen parentId'ye sahip tüm alt ürünleri ve onların alt ürünlerini rekürsif olarak siler.
     */
    private void deleteChildrenRecursive(String parentId) {
        List<MasterProduct> children = productRepository.findByParentProductId(parentId);
        if (!children.isEmpty()) {
            logger.info("ID'si '{}' olan ürünün {} adet alt ürünü bulundu. Siliniyor...", parentId, children.size());
            for (MasterProduct child : children) {
                // Önce bu çocuğun altındakileri sil
                deleteChildrenRecursive(child.getId());
                // Sonra çocuğu sil
                productRepository.deleteById(child.getId());
                logger.info("Alt ürün silindi: ID={}, Kod={}, Ad={}", child.getId(), child.getCode(), child.getName());
            }
        } else {
            logger.debug("ID'si '{}' olan ürünün silinecek alt ürünü bulunamadı.", parentId);
        }
    }


    public MasterProduct findById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Arama Hatası: ID'si '{}' olan ürün bulunamadı.", id);
                    return new RuntimeException("Ürün bulunamadı: " + id);
                });
    }
}