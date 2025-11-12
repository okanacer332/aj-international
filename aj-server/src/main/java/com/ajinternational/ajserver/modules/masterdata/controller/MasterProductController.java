package com.ajinternational.ajserver.modules.masterdata.controller;

import com.ajinternational.ajserver.config.security.HasPermission;
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.service.MasterProductService;
import lombok.RequiredArgsConstructor;
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