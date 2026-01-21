package com.ajinternational.ajserver.modules.masterdata.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import com.ajinternational.ajserver.modules.masterdata.repository.ProductionUnitDefinitionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit Tests for MasterProductService
 * 
 * Tests caching behavior and tenant isolation.
 */
@ExtendWith(MockitoExtension.class)
class MasterProductServiceTest {

    @Mock
    private MasterProductRepository productRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private ProductionUnitDefinitionRepository productionUnitRepository;

    @InjectMocks
    private MasterProductService masterProductService;

    private static final String TEST_TENANT_ID = "TR";

    @Test
    @DisplayName("findAllProducts returns products for tenant")
    void findAllProducts_ReturnsTenantProducts() {
        UserDetails mockUser = new User("testuser", "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

        MasterProduct product1 = new MasterProduct();
        product1.setId("1");
        product1.setName("Product 1");
        product1.setTenantId(TEST_TENANT_ID);

        try (MockedStatic<TenantContextHolder> mockedStatic = mockStatic(TenantContextHolder.class)) {
            mockedStatic.when(TenantContextHolder::getCurrentUserDetails).thenReturn(mockUser);
            mockedStatic.when(TenantContextHolder::getCurrentTenantId).thenReturn(TEST_TENANT_ID);

            when(productRepository.findByTenantId(TEST_TENANT_ID)).thenReturn(Arrays.asList(product1));
            when(productionUnitRepository.findByTenantId(TEST_TENANT_ID)).thenReturn(Collections.emptyList());

            // Act
            List<MasterProduct> result = masterProductService.findAllProducts();

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Product 1");
            verify(productRepository).findByTenantId(TEST_TENANT_ID);
            verify(productRepository, never()).findAll();
        }
    }

    @Test
    @DisplayName("saveProduct creates new product with tenant ID")
    void saveProduct_NewProduct_SetsTenantId() {
        UserDetails mockUser = new User("testuser", "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

        MasterProduct newProduct = new MasterProduct();
        newProduct.setName("New Product");
        newProduct.setCode("NP001");

        MasterProduct savedProduct = new MasterProduct();
        savedProduct.setId("new-id");
        savedProduct.setName("New Product");
        savedProduct.setCode("NP001");
        savedProduct.setTenantId(TEST_TENANT_ID);

        try (MockedStatic<TenantContextHolder> mockedStatic = mockStatic(TenantContextHolder.class)) {
            mockedStatic.when(TenantContextHolder::getCurrentTenantId).thenReturn(TEST_TENANT_ID);
            mockedStatic.when(TenantContextHolder::getCurrentUsername).thenReturn("testuser");

            when(productRepository.findByTenantIdAndCode(TEST_TENANT_ID, "NP001")).thenReturn(Optional.empty());
            when(productRepository.save(any(MasterProduct.class))).thenReturn(savedProduct);

            // Act
            MasterProduct result = masterProductService.saveProduct(newProduct);

            // Assert
            assertThat(result.getTenantId()).isEqualTo(TEST_TENANT_ID);
            verify(auditLogService).logAction(eq(TEST_TENANT_ID), eq("testuser"), eq("PRODUCT_CREATED"), any());
        }
    }

    @Test
    @DisplayName("saveProduct throws exception for duplicate code")
    void saveProduct_DuplicateCode_ThrowsException() {
        UserDetails mockUser = new User("testuser", "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

        MasterProduct existingProduct = new MasterProduct();
        existingProduct.setId("existing-id");
        existingProduct.setCode("EXISTING");

        MasterProduct newProduct = new MasterProduct();
        newProduct.setCode("EXISTING");
        newProduct.setName("New Product");

        try (MockedStatic<TenantContextHolder> mockedStatic = mockStatic(TenantContextHolder.class)) {
            mockedStatic.when(TenantContextHolder::getCurrentTenantId).thenReturn(TEST_TENANT_ID);
            mockedStatic.when(TenantContextHolder::getCurrentUsername).thenReturn("testuser");

            when(productRepository.findByTenantIdAndCode(TEST_TENANT_ID, "EXISTING"))
                    .thenReturn(Optional.of(existingProduct));

            // Act & Assert
            assertThatThrownBy(() -> masterProductService.saveProduct(newProduct))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Bu ürün kodu zaten mevcut");
        }
    }

    @Test
    @DisplayName("getCurrentTenantIdForCache returns current tenant ID")
    void getCurrentTenantIdForCache_ReturnsTenantId() {
        try (MockedStatic<TenantContextHolder> mockedStatic = mockStatic(TenantContextHolder.class)) {
            mockedStatic.when(TenantContextHolder::getCurrentTenantId).thenReturn(TEST_TENANT_ID);

            String result = masterProductService.getCurrentTenantIdForCache();

            assertThat(result).isEqualTo(TEST_TENANT_ID);
        }
    }
}
