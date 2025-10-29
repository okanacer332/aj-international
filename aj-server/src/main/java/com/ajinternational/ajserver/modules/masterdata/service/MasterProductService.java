package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.JwtUtil; // Eklendi
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import jakarta.servlet.http.HttpServletRequest; // Eklendi
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException; // Eklendi
import org.springframework.security.core.Authentication; // Eklendi
import org.springframework.security.core.context.SecurityContextHolder; // Eklendi
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils; // Eklendi
import org.springframework.web.context.request.RequestContextHolder; // Eklendi
import org.springframework.web.context.request.ServletRequestAttributes; // Eklendi

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MasterProductService {

    private static final Logger logger = LoggerFactory.getLogger(MasterProductService.class);

    private final MasterProductRepository productRepository;
    private final JwtUtil jwtUtil; // Enjekte edildi

    // --- YENİ HELPER METOT: Mevcut kullanıcı ve tenant bilgisini alır ---
    private record TenantContext(String tenantId, boolean isAdmin) {}

    private TenantContext getCurrentTenantContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            logger.warn("Kimliği doğrulanmamış kullanıcı veya anonymousUser tenant bilgisi almaya çalıştı.");
            throw new AccessDeniedException("Bu işlem için kimlik doğrulaması gerekiyor.");
        }

        String username = authentication.getName();
        boolean isAdmin = "admin".equals(username); // VEYA authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN"));

        // Admin değilse, token'dan tenantId'yi çıkar
        if (!isAdmin) {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String authHeader = request.getHeader("Authorization");
            if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    String tenantIdFromToken = jwtUtil.extractTenantId(token);
                    if (!StringUtils.hasText(tenantIdFromToken)) {
                        logger.error("Kullanıcı token'ında tenantId bulunamadı: {}", username);
                        throw new AccessDeniedException("Tenant bilgisi eksik.");
                    }
                    logger.debug("Kullanıcı '{}' için Tenant ID token'dan alındı: {}", username, tenantIdFromToken);
                    return new TenantContext(tenantIdFromToken, false);
                } catch (Exception e) {
                    logger.error("Kullanıcı '{}' için token parse edilemedi veya geçersiz: {}", username, e.getMessage());
                    throw new AccessDeniedException("Geçersiz veya süresi dolmuş token.");
                }
            } else {
                logger.warn("Kullanıcı '{}' için Authorization header bulunamadı veya Bearer token değil.", username);
                throw new AccessDeniedException("Authorization token eksik.");
            }
        }

        // Admin ise tenantId null dönebiliriz (tüm tenantları temsil eder) veya admin'in kendi tenant'ını
        logger.debug("Admin kullanıcısı '{}' işlem yapıyor. Tenant filtresi uygulanmayacak (veya admin'in kendi tenant'ı kullanılacak).", username);
        // Admin için null dönelim, bu "tüm tenantlar" anlamına gelsin (okuma işlemleri için)
        // Yazma işlemleri için admin'in tenant'ını (varsa) veya bir default kullanmak gerekebilir.
        // Şimdilik okuma için null, yazma için hata veya default varsayalım.
        return new TenantContext(null, true); // Admin için tenantId null
    }
    // --- HELPER METOT SONU ---


    public List<MasterProduct> findAllHierarchicalProducts() {
        TenantContext context = getCurrentTenantContext();
        List<MasterProduct> allProducts;

        if (context.isAdmin()) {
            // Admin tüm ürünleri görür
            allProducts = productRepository.findAll();
            logger.info("Admin kullanıcısı tüm tenantlardaki ürünleri listeliyor: {} adet.", allProducts.size());
        } else {
            // Normal kullanıcı sadece kendi tenant'ındaki ürünleri görür
            allProducts = productRepository.findByTenantId(context.tenantId());
            logger.info("Tenant '{}' için tüm ürünler çekildi: {} adet.", context.tenantId(), allProducts.size());
        }

        // --- Hiyerarşi kurma mantığı aynı kaldı ---
        Map<String, MasterProduct> productMap = new HashMap<>();
        for (MasterProduct product : allProducts) {
            product.setSubProducts(new ArrayList<>());
            productMap.put(product.getId(), product);
        }
        List<MasterProduct> rootProducts = new ArrayList<>();
        for (MasterProduct product : allProducts) {
            Optional<String> parentIdOpt = product.getParentProductId().filter(s -> !s.trim().isEmpty());
            if (parentIdOpt.isPresent()) {
                String parentId = parentIdOpt.get();
                MasterProduct parent = productMap.get(parentId);
                // Parent'ın da aynı tenant'ta olup olmadığını kontrol etmek iyi bir pratik olabilir (admin değilse)
                if (parent != null && (context.isAdmin() || parent.getTenantId().equals(context.tenantId())) ) {
                    parent.getSubProducts().add(product);
                } else if (parent == null) {
                    logger.warn("Alt ürün '{}' ({}) için ana ürün ID'si '{}' bulundu ancak ilgili ana ürün map'te bulunamadı veya farklı bir tenanta ait!", product.getName(), product.getId(), parentId);
                }
            } else {
                // Sadece ilgili tenant'ın kök ürünlerini veya admin ise tüm kök ürünleri ekle
                if(context.isAdmin() || product.getTenantId().equals(context.tenantId())) {
                    rootProducts.add(product);
                }
            }
        }
        logger.info("Hiyerarşik yapı kuruldu. {} için Kök ürün sayısı: {}", context.isAdmin() ? "Tüm tenantlar" : "Tenant '" + context.tenantId() + "'", rootProducts.size());
        return rootProducts;
    }

    public MasterProduct saveProduct(MasterProduct product) {
        TenantContext context = getCurrentTenantContext();

        // Admin'in ürün kaydederken hangi tenant'a kaydedeceğini belirlememiz lazım.
        // Şimdilik admin'in ürün kaydedemeyeceğini varsayalım veya frontend'den tenant seçmesini isteyelim.
        // Burada basitlik adına, admin ise hata verelim. Normal kullanıcı ise kendi tenant'ına kaydetsin.
        if (context.isAdmin() && !StringUtils.hasText(product.getTenantId())) {
            logger.error("Admin kullanıcısı tenant ID belirtmeden ürün kaydetmeye çalıştı.");
            throw new IllegalArgumentException("Admin kullanıcılar ürün kaydederken tenant ID belirtmelidir.");
            // VEYA: product.setTenantId("DEFAULT_TENANT_FOR_ADMIN"); gibi bir mantık eklenebilir.
        }

        // Eğer admin tenant belirtmişse onu kullan, değilse context'teki tenantId'yi kullan
        String targetTenantId = context.isAdmin() ? product.getTenantId() : context.tenantId();
        product.setTenantId(targetTenantId); // MOCK_TENANT_ID yerine dinamik tenantId

        logger.info("Ürün kaydetme/güncelleme işlemi başlatıldı. Tenant: {}, Ürün Adı: {}", targetTenantId, product.getName());


        // --- Parent ID ve Kod benzersizlik kontrolü MOCK_TENANT_ID yerine targetTenantId kullanacak ---
        String rawParentId = product.getParentProductId().orElse(null);
        String finalParentId = (rawParentId != null && !rawParentId.trim().isEmpty()) ? rawParentId.trim() : null;
        product.setParentProductId(finalParentId);

        if (finalParentId != null) {
            MasterProduct parent = productRepository.findById(finalParentId)
                    .orElseThrow(() -> {
                        logger.error("HATA: Belirtilen ana ürün ID'si ({}) veritabanında bulunamadı.", finalParentId);
                        return new IllegalArgumentException("Belirtilen ana ürün bulunamadı.");
                    });
            // Parent'ın da aynı tenant'a ait olduğundan emin ol (admin değilse)
            if (!context.isAdmin() && !parent.getTenantId().equals(targetTenantId)) {
                logger.error("HATA: Belirtilen ana ürün ID'si ({}) farklı bir tenanta ait.", finalParentId);
                throw new AccessDeniedException("Belirtilen ana ürün farklı bir tenanta ait.");
            }
            logger.info("SAVE LOG: '{}' ürünü ALT ÜRÜN olarak kaydediliyor (parentProductId: {})", product.getName(), finalParentId);
        } else {
            logger.info("SAVE LOG: '{}' ürünü ANA ÜRÜN olarak kaydediliyor (parentProductId: null)", product.getName());
        }

        productRepository.findByTenantIdAndCode(targetTenantId, product.getCode()).ifPresent(existing -> {
            if (product.getId() == null || !Objects.equals(existing.getId(), product.getId())) {
                logger.error("HATA: Ürün kodu '{}', Tenant '{}' içinde zaten '{}' adlı ürün tarafından kullanılıyor.", product.getCode(), targetTenantId, existing.getName());
                throw new IllegalArgumentException("Bu ürün kodu bu operasyon ülkesi için zaten mevcut.");
            }
        });
        // --- Kontroller güncellendi ---

        MasterProduct savedProduct = productRepository.save(product);
        logger.info("Ürün başarıyla kaydedildi/güncellendi: ID={}, Kod={}, Ad={}, Tenant={}", savedProduct.getId(), savedProduct.getCode(), savedProduct.getName(), savedProduct.getTenantId());
        return savedProduct;
    }

    public void deleteProduct(String id) {
        TenantContext context = getCurrentTenantContext();
        logger.info("Silme işlemi başlatıldı: ID={}, İstek yapan: {}", id, context.isAdmin() ? "Admin" : "User (Tenant: " + context.tenantId() + ")");

        MasterProduct productToDelete = productRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Silme Hatası: ID'si '{}' olan ürün bulunamadı.", id);
                    return new RuntimeException("Silinecek ürün bulunamadı: " + id);
                });

        // Tenant kontrolü (admin değilse)
        if (!context.isAdmin() && !productToDelete.getTenantId().equals(context.tenantId())) {
            logger.error("Yetkisiz Silme Denemesi: Kullanıcı (Tenant: {}), farklı tenanta (Tenant: {}) ait ürünü (ID: {}) silmeye çalıştı.",
                    context.tenantId(), productToDelete.getTenantId(), id);
            throw new AccessDeniedException("Bu ürünü silme yetkiniz yok.");
        }

        logger.info("Silinecek Ürün Bilgisi: ID={}, Kod={}, Ad={}, Tenant={}", productToDelete.getId(), productToDelete.getCode(), productToDelete.getName(), productToDelete.getTenantId());

        // Rekürsif olarak alt ürünleri bul ve sil (tenant kontrolü ile)
        deleteChildrenRecursive(id, context); // Context'i geçir

        // Ana ürünü sil
        productRepository.deleteById(id);
        logger.info("Ürün başarıyla silindi: ID={}", id);
    }

    // deleteChildrenRecursive metodu TenantContext alacak şekilde güncellendi
    private void deleteChildrenRecursive(String parentId, TenantContext context) {
        List<MasterProduct> children = productRepository.findByParentProductId(parentId);

        // Admin değilse, çocukları kendi tenant'ına göre filtrele
        if (!context.isAdmin()) {
            children = children.stream()
                    .filter(child -> child.getTenantId().equals(context.tenantId()))
                    .collect(Collectors.toList());
        }

        if (!children.isEmpty()) {
            logger.info("ID'si '{}' olan ürünün (Tenant {}) {} adet alt ürünü bulundu. Siliniyor...", parentId, context.isAdmin() ? "TÜMÜ" : context.tenantId(), children.size());
            for (MasterProduct child : children) {
                // Önce bu çocuğun altındakileri sil
                deleteChildrenRecursive(child.getId(), context); // Context'i tekrar geçir
                // Sonra çocuğu sil
                productRepository.deleteById(child.getId());
                logger.info("Alt ürün silindi: ID={}, Kod={}, Ad={}, Tenant={}", child.getId(), child.getCode(), child.getName(), child.getTenantId());
            }
        } else {
            logger.debug("ID'si '{}' olan ürünün silinecek (ve yetkili olunan) alt ürünü bulunamadı.", parentId);
        }
    }


    public MasterProduct findById(String id) {
        TenantContext context = getCurrentTenantContext();
        logger.debug("findById çağrıldı: ID={}, İstek yapan: {}", id, context.isAdmin() ? "Admin" : "User (Tenant: " + context.tenantId() + ")");

        MasterProduct product = productRepository.findById(id)
                .orElseThrow(() -> {
                    logger.error("Arama Hatası: ID'si '{}' olan ürün bulunamadı.", id);
                    return new RuntimeException("Ürün bulunamadı: " + id);
                });

        // Tenant kontrolü (admin değilse)
        if (!context.isAdmin() && !product.getTenantId().equals(context.tenantId())) {
            logger.error("Yetkisiz Erişim Denemesi: Kullanıcı (Tenant: {}), farklı tenanta (Tenant: {}) ait ürünü (ID: {}) sorgulamaya çalıştı.",
                    context.tenantId(), product.getTenantId(), id);
            // Bulunamadı gibi davranmak daha güvenli olabilir
            throw new RuntimeException("Ürün bulunamadı: " + id);
            // throw new AccessDeniedException("Bu ürünü görme yetkiniz yok.");
        }

        logger.debug("Ürün bulundu: ID={}, Kod={}, Ad={}, Tenant={}", product.getId(), product.getCode(), product.getName(), product.getTenantId());
        return product;
    }
}