package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class MasterProductService {

    private static final Logger logger = LoggerFactory.getLogger(MasterProductService.class);

    private final MasterProductRepository productRepository;
    private final String MOCK_TENANT_ID = "TR";

    /**
     * Tüm ürünleri çeker, hiyerarşik yapıyı kurar ve sadece Ana Ürün listesini (alt ürünleri dahil) döner.
     */
    public List<MasterProduct> findAllHierarchicalProducts() {
        List<MasterProduct> allProducts = productRepository.findByTenantId(MOCK_TENANT_ID);
        logger.info("Tüm ürünler çekildi: {} adet.", allProducts.size());

        // 1. Alt ürünleri Parent ID'sine göre grupla (Parent ID'si var VE boş dize değil)
        Map<String, List<MasterProduct>> subProductsMap = allProducts.stream()
                // Optional'ı filtrele: İçindeki String boşluklardan arındırıldığında boş değilse al
                .filter(p -> p.getParentProductId().filter(s -> !s.trim().isEmpty()).isPresent())
                // Gruplama için Optional'ın içindeki String değeri unwrap et
                .collect(Collectors.groupingBy(p -> p.getParentProductId().get()));

        logger.info("Alt ürün grupları oluşturuldu. {} farklı Parent ID bulundu.", subProductsMap.size());


        // 2. Ana ürünleri bul (Parent ID'si yok VEYA boş dize)
        List<MasterProduct> parentProducts = allProducts.stream()
                // Filter.isEmpty() ile ID'nin gerçekten null veya boş dize olduğunu kontrol et (Alt ürün değilse)
                .filter(p -> p.getParentProductId().filter(s -> !s.trim().isEmpty()).isEmpty())
                .collect(Collectors.toList());

        logger.info("Ana ürünler filtrelendi: {} adet.", parentProducts.size());

        for (MasterProduct parent : parentProducts) {
            List<MasterProduct> children = subProductsMap.getOrDefault(parent.getId(), List.of());

            if (!children.isEmpty()) {
                String childIds = children.stream().map(MasterProduct::getId).collect(Collectors.joining(", "));
                logger.info("Başarılı Atama -> Parent ID: {} ({}), Alt Ürün Sayısı: {} (Alt ID'ler: {})", parent.getId(), parent.getName(), children.size(), childIds);
            }

            parent.setSubProducts(children);
        }

        return parentProducts;
    }

    public MasterProduct saveProduct(MasterProduct product) {
        product.setTenantId(MOCK_TENANT_ID);

        // 1. String değeri güvenle al (null ise null, doluysa ID string)
        String rawParentId = product.getParentProductId().orElse(null);
        String trimmedParentId = (rawParentId != null) ? rawParentId.trim() : null;

        // 2. Eğer trimmedParentId boş string ise (formdan gelen "") null yap
        if (trimmedParentId != null && trimmedParentId.isEmpty()) {
            trimmedParentId = null;
        }

        // 3. Loglama ve kaydetme
        if (trimmedParentId == null) {
            logger.info("SAVE LOG: {} ürünü ANA ÜRÜN olarak kaydediliyor (parentProductId: null)", product.getName());
            product.setParentProductId(null); // DB'ye null gitmesini garantile
        } else {
            logger.info("SAVE LOG: {} ürünü ALT ÜRÜN olarak kaydediliyor (parentProductId: {})", product.getName(), trimmedParentId);
            product.setParentProductId(trimmedParentId); // Alt ürün ID'sini kaydet
        }

        // Kod benzersizlik kontrolü
        productRepository.findByTenantIdAndCode(MOCK_TENANT_ID, product.getCode()).ifPresent(existing -> {
            if (product.getId() == null || !Objects.equals(existing.getId(), product.getId())) {
                throw new IllegalArgumentException("Bu ürün kodu zaten mevcut.");
            }
        });

        return productRepository.save(product);
    }

    public void deleteProduct(String id) {
        if (!productRepository.findByParentProductId(id).isEmpty()) {
            throw new IllegalArgumentException("Bu ana ürünün alt ürünleri mevcut. Önce alt ürünleri silmelisiniz.");
        }
        productRepository.deleteById(id);
    }

    public MasterProduct findById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + id));
    }
}