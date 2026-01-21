package com.ajinternational.ajserver.modules.masterdata.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.service.MasterProductService;
import com.ajinternational.ajserver.modules.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/masterdata/products")
@RequiredArgsConstructor
public class MasterProductController {

    private final MasterProductService productService;

    @GetMapping
    @HasPermission("PAGE_MASTER_PRODUCT:READ")
    @PreAuthorize("hasAuthority('PAGE_MASTER_PRODUCT:READ')")
    public ResponseEntity<List<MasterProduct>> getAllProducts() {
        // GÜNCELLENDİ: Hiyerarşik metot yerine düz listeyi çağır
        List<MasterProduct> products = productService.findAllProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * NEW: Paginated endpoint for large datasets
     * 
     * @param page    Page number (0-indexed, default: 0)
     * @param size    Items per page (default: 20, max: 100)
     * @param sortBy  Sort field (default: createdAt)
     * @param sortDir Sort direction - asc/desc (default: desc)
     */
    @GetMapping("/paginated")
    @HasPermission("PAGE_MASTER_PRODUCT:READ")
    @PreAuthorize("hasAuthority('PAGE_MASTER_PRODUCT:READ')")
    public ResponseEntity<PageResponse<MasterProduct>> getAllProductsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        // Enforce max page size
        size = Math.min(size, 100);

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        PageResponse<MasterProduct> response = productService.findAllProductsPaginated(pageable);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @HasPermission("PAGE_MASTER_PRODUCT:WRITE")
    @PreAuthorize("hasAuthority('PAGE_MASTER_PRODUCT:WRITE')")
    public ResponseEntity<MasterProduct> saveProduct(@RequestBody MasterProduct product) {
        MasterProduct savedProduct = productService.saveProduct(product);
        return ResponseEntity.ok(savedProduct);
    }

    @DeleteMapping("/{id}")
    @HasPermission("PAGE_MASTER_PRODUCT:WRITE")
    @PreAuthorize("hasAuthority('PAGE_MASTER_PRODUCT:WRITE')")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}