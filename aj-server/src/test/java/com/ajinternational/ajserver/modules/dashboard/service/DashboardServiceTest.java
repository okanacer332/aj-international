package com.ajinternational.ajserver.modules.dashboard.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.dashboard.dto.DashboardSummaryDto;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import com.ajinternational.ajserver.modules.hr.knowledge.repository.UserProductKnowledgeRepository;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
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

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit Tests for DashboardService
 * 
 * Tests the dashboard summary functionality with mocked dependencies.
 */
@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private MasterProductRepository masterProductRepository;

    @Mock
    private UserProductKnowledgeRepository knowledgeRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private DashboardService dashboardService;

    private static final String TEST_TENANT_ID = "TR";

    @BeforeEach
    void setUp() {
        // Common setup for all tests
    }

    @Test
    @DisplayName("getDashboardSummary returns valid DTO for regular user")
    void getDashboardSummary_RegularUser_ReturnsValidDto() {
        // Arrange
        UserDetails mockUser = new User("testuser", "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

        try (MockedStatic<TenantContextHolder> mockedStatic = mockStatic(TenantContextHolder.class)) {
            mockedStatic.when(TenantContextHolder::getCurrentUserDetails).thenReturn(mockUser);
            mockedStatic.when(TenantContextHolder::getCurrentTenantId).thenReturn(TEST_TENANT_ID);

            when(userRepository.findByTenantId(TEST_TENANT_ID)).thenReturn(Collections.emptyList());
            when(masterProductRepository.findByTenantId(TEST_TENANT_ID)).thenReturn(Collections.emptyList());
            when(knowledgeRepository.findByTenantId(TEST_TENANT_ID)).thenReturn(Collections.emptyList());
            when(auditLogService.getRecentActivities()).thenReturn(Collections.emptyList());

            // Act
            DashboardSummaryDto result = dashboardService.getDashboardSummary();

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getTotalEmployees()).isEqualTo(0);
            assertThat(result.getTotalMasterProducts()).isEqualTo(0);
            assertThat(result.getAverageCompetencyScore()).isEqualTo(0);
        }
    }

    @Test
    @DisplayName("getDashboardSummary for SuperAdmin queries all data")
    void getDashboardSummary_SuperAdmin_QueriesAllData() {
        // Arrange
        UserDetails mockSuperAdmin = new User("superadmin", "password",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));

        try (MockedStatic<TenantContextHolder> mockedStatic = mockStatic(TenantContextHolder.class)) {
            mockedStatic.when(TenantContextHolder::getCurrentUserDetails).thenReturn(mockSuperAdmin);
            mockedStatic.when(TenantContextHolder::getCurrentTenantId).thenReturn(TEST_TENANT_ID);

            when(userRepository.findAll()).thenReturn(Collections.emptyList());
            when(masterProductRepository.findAll()).thenReturn(Collections.emptyList());
            when(knowledgeRepository.findAll()).thenReturn(Collections.emptyList());
            when(auditLogService.getRecentActivities()).thenReturn(Collections.emptyList());

            // Act
            DashboardSummaryDto result = dashboardService.getDashboardSummary();

            // Assert
            assertThat(result).isNotNull();
            verify(userRepository).findAll();
            verify(userRepository, never()).findByTenantId(anyString());
        }
    }

    @Test
    @DisplayName("getCurrentTenantIdForCache returns current tenant ID")
    void getCurrentTenantIdForCache_ReturnsTenantId() {
        try (MockedStatic<TenantContextHolder> mockedStatic = mockStatic(TenantContextHolder.class)) {
            mockedStatic.when(TenantContextHolder::getCurrentTenantId).thenReturn(TEST_TENANT_ID);

            // Act
            String result = dashboardService.getCurrentTenantIdForCache();

            // Assert
            assertThat(result).isEqualTo(TEST_TENANT_ID);
        }
    }
}
