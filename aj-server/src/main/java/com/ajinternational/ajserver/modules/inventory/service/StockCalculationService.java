// aj-server/src/main/java/com/ajinternational/ajserver/modules/inventory/service/StockCalculationService.java
package com.ajinternational.ajserver.modules.inventory.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.inventory.dto.StockReportDto;
import com.ajinternational.ajserver.modules.inventory.dto.StockReportLineDto;
import com.ajinternational.ajserver.modules.inventory.model.DepotDefinition;
import com.ajinternational.ajserver.modules.inventory.model.InventoryEntry;
import com.ajinternational.ajserver.modules.inventory.model.InventoryDispatch;
import com.ajinternational.ajserver.modules.inventory.model.MaterialDefinition;
import com.ajinternational.ajserver.modules.inventory.repository.DepotDefinitionRepository;
import com.ajinternational.ajserver.modules.inventory.repository.InventoryEntryRepository;
import com.ajinternational.ajserver.modules.inventory.repository.InventoryDispatchRepository;
import com.ajinternational.ajserver.modules.inventory.repository.MaterialDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function; // <-- 1. DÜZELTME: Eksik import eklendi
import java.util.stream.Collectors;
// import java.util.stream.Stream; // Bu import (kullanılmıyor) kaldırıldı

@Service
@RequiredArgsConstructor
public class StockCalculationService {

    private final InventoryEntryRepository entryRepository;
    private final InventoryDispatchRepository dispatchRepository;
    private final DepotDefinitionRepository depotRepository;
    private final MaterialDefinitionRepository materialRepository;

    public List<StockReportDto> getRealTimeStockReport() {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        // 1. Gerekli tüm tanımlamaları (Depo, Malzeme) haritaya çek
        Map<String, DepotDefinition> depotMap = depotRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(DepotDefinition::getId, Function.identity()));

        Map<String, MaterialDefinition> materialMap = materialRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(MaterialDefinition::getId, Function.identity()));

        // 2. Tüm GİRİŞ (Entry) satırlarını al ve (DepoID+MalzemeID) bazında topla
        // Map<DepoID, Map<MalzemeID, ToplamGirişTonajı>>
        Map<String, Map<String, Double>> entriesByDepotAndMaterial = new HashMap<>();
        List<InventoryEntry> allEntries = entryRepository.findByTenantId(tenantId);

        for (InventoryEntry entry : allEntries) {
            String depotId = entry.getTargetDepotId();
            if (depotId == null) continue;

            entriesByDepotAndMaterial.putIfAbsent(depotId, new HashMap<>());
            Map<String, Double> materialTotals = entriesByDepotAndMaterial.get(depotId);

            entry.getLines().forEach(line -> {
                materialTotals.merge(line.getMaterialId(), line.getScaleWeight(), Double::sum);
            });
        }

        // 3. Tüm ÇIKIŞ (Dispatch) satırlarını al ve (DepoID+MalzemeID) bazında topla
        // Map<DepoID, Map<MalzemeID, ToplamÇıkışTonajı>>
        Map<String, Map<String, Double>> dispatchesByDepotAndMaterial = new HashMap<>();
        List<InventoryDispatch> allDispatches = dispatchRepository.findByTenantId(tenantId);

        for (InventoryDispatch dispatch : allDispatches) {
            String depotId = dispatch.getDispatchDepotId();
            if (depotId == null) continue;

            dispatchesByDepotAndMaterial.putIfAbsent(depotId, new HashMap<>());
            Map<String, Double> materialTotals = dispatchesByDepotAndMaterial.get(depotId);

            dispatch.getLines().forEach(line -> {
                materialTotals.merge(line.getMaterialId(), line.getWeightKg(), Double::sum); // GÜNCELLENDİ (getWeightTon -> getWeightKg)
            });
        }

        // 4. İki haritayı birleştirerek DTO oluştur
        return depotMap.values().stream()
                .map(depot -> {
                    Map<String, Double> depotEntries = entriesByDepotAndMaterial.getOrDefault(depot.getId(), new HashMap<>());
                    Map<String, Double> depotDispatches = dispatchesByDepotAndMaterial.getOrDefault(depot.getId(), new HashMap<>());

                    // Bu depodaki tüm malzemeleri (hem giren hem çıkan) topla
                    Map<String, Double> stockMap = new HashMap<>(depotEntries);
                    depotDispatches.forEach((materialId, dispatchAmount) ->
                            stockMap.merge(materialId, -dispatchAmount, Double::sum)
                    );

                    List<StockReportLineDto> stockLines = stockMap.entrySet().stream()
                            .filter(entry -> entry.getValue() != 0) // Stoğu 0 olmayanları göster
                            // --- 2. DÜZELTME: .sorted() işlemi .map() işleminden ÖNCEYE taşındı ---
                            .sorted(Map.Entry.comparingByKey())
                            .map(entry -> {
                                MaterialDefinition material = materialMap.get(entry.getKey());
                                return new StockReportLineDto(
                                        entry.getKey(),
                                        material != null ? material.getName() : "Bilinmeyen Malzeme",
                                        material != null ? material.getCode() : "N/A",
                                        entry.getValue() // Hesaplanan stok
                                );
                            })
                            // .sorted(Map.Entry.comparingByKey()) // <-- Hatalı yer burasıydı
                            .collect(Collectors.toList());

                    double depotTotalStock = stockLines.stream().mapToDouble(StockReportLineDto::getTotalStock).sum();

                    return new StockReportDto(depot.getId(), depot.getName(), stockLines, depotTotalStock);
                })
                .collect(Collectors.toList());
    }
}