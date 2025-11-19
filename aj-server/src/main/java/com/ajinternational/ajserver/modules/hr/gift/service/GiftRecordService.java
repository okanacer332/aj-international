package com.ajinternational.ajserver.modules.hr.gift.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.audit.service.AuditLogService;
import com.ajinternational.ajserver.modules.hr.gift.dto.CreateGiftRequest;
import com.ajinternational.ajserver.modules.hr.gift.dto.GiftRecordResponse;
import com.ajinternational.ajserver.modules.hr.gift.model.GiftLine;
import com.ajinternational.ajserver.modules.hr.gift.model.GiftRecord;
import com.ajinternational.ajserver.modules.hr.gift.model.RecipientType;
import com.ajinternational.ajserver.modules.hr.gift.repository.GiftRecordRepository;
import com.ajinternational.ajserver.modules.hr.personnel.model.Personnel;
import com.ajinternational.ajserver.modules.hr.personnel.repository.PersonnelRepository;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import com.ajinternational.ajserver.modules.masterdata.model.MasterProduct;
import com.ajinternational.ajserver.modules.masterdata.repository.MasterProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GiftRecordService {

    private final GiftRecordRepository repository;
    private final UserRepository userRepository;
    private final PersonnelRepository personnelRepository;
    private final MasterProductRepository productRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public GiftRecord create(CreateGiftRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        String username = TenantContextHolder.getCurrentUsername();

        GiftRecord record = new GiftRecord();
        record.setTenantId(tenantId);
        record.setDate(request.date());
        record.setRecipientId(request.recipientId());
        record.setRecipientType(request.recipientType());
        record.setDescription(request.description());
        record.setCreatedBy(username);

        List<GiftLine> lines = request.lines().stream()
                .map(l -> new GiftLine(l.productId(), l.quantity(), l.description()))
                .collect(Collectors.toList());
        record.setLines(lines);

        GiftRecord saved = repository.save(record);

        auditLogService.logAction(tenantId, username, "GIFT_CREATED",
                "Hediye kaydı oluşturuldu. Alıcı: " + request.recipientId());

        return saved;
    }

    public List<GiftRecordResponse> findAll() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        List<GiftRecord> records = repository.findByTenantId(tenantId);

        // Performans için tüm ilişkili verileri toplu çekiyoruz (N+1 problemini önlemek için)
        Map<String, User> userMap = userRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        Map<String, Personnel> personnelMap = personnelRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(Personnel::getId, Function.identity()));

        Map<String, String> productMap = productRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(MasterProduct::getId, MasterProduct::getName));

        return records.stream().map(record -> {
            GiftRecordResponse response = new GiftRecordResponse();
            response.setId(record.getId());
            response.setDate(record.getDate());
            response.setRecipientId(record.getRecipientId());
            response.setRecipientType(record.getRecipientType());
            response.setDescription(record.getDescription());

            // Alıcı ismini bulma
            String recipientName = "Bilinmiyor";
            if (record.getRecipientType() == RecipientType.USER) {
                User u = userMap.get(record.getRecipientId());
                if (u != null) recipientName = u.getFullName();
            } else if (record.getRecipientType() == RecipientType.PERSONNEL) {
                Personnel p = personnelMap.get(record.getRecipientId());
                if (p != null) {
                    // Personelin bağlı olduğu user ismini bulalım
                    User u = userMap.get(p.getUserId());
                    recipientName = u != null ? u.getFullName() : p.getOnxCode();
                }
            }
            response.setRecipientName(recipientName);

            // Satırları dönüştürme
            List<GiftRecordResponse.GiftLineResponse> lineResponses = record.getLines().stream().map(line -> {
                GiftRecordResponse.GiftLineResponse lr = new GiftRecordResponse.GiftLineResponse();
                lr.setProductId(line.getProductId());
                lr.setProductName(productMap.getOrDefault(line.getProductId(), "Silinmiş Ürün"));
                lr.setQuantity(line.getQuantity());
                lr.setDescription(line.getDescription());
                return lr;
            }).collect(Collectors.toList());

            response.setLines(lineResponses);
            return response;
        }).collect(Collectors.toList());
    }

    public void delete(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        // Basit yetki/varlık kontrolü
        repository.findById(id).ifPresent(record -> {
            if (record.getTenantId().equals(tenantId)) {
                repository.delete(record);
                auditLogService.logAction(tenantId, TenantContextHolder.getCurrentUsername(),
                        "GIFT_DELETED", "Hediye kaydı silindi: " + id);
            }
        });
    }
}