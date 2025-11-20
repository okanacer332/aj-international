package com.ajinternational.ajserver.modules.operation.service;

import com.ajinternational.ajserver.config.TenantContextHolder;
import com.ajinternational.ajserver.modules.hr.personnel.model.Personnel;
import com.ajinternational.ajserver.modules.hr.personnel.repository.PersonnelRepository;
import com.ajinternational.ajserver.modules.iam.model.User;
import com.ajinternational.ajserver.modules.iam.repository.UserRepository;
import com.ajinternational.ajserver.modules.operation.dto.*;
import com.ajinternational.ajserver.modules.operation.model.*;
import com.ajinternational.ajserver.modules.operation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OperationService {

    private final OperationTableRepository tableRepository;
    private final OperationConfigRepository configRepository;
    private final WorkerDailyLedgerRepository ledgerRepository;
    private final ActiveSessionRepository sessionRepository;
    private final PersonnelRepository personnelRepository;
    private final UserRepository userRepository;
    private final OperationTicketRepository ticketRepository;

    private final SimpMessagingTemplate messagingTemplate;

    private void broadcastUpdate(String tenantId, String type, Object payload) {
        String destination = "/topic/operation/" + tenantId;
        messagingTemplate.convertAndSend(destination, new SocketUpdateDto(type, payload));
    }

    // --- CONFIG ---
    public OperationConfig getConfig() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        return configRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    OperationConfig config = new OperationConfig();
                    config.setTenantId(tenantId);
                    return configRepository.save(config);
                });
    }

    public OperationConfig updateConfig(OperationConfig config) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        OperationConfig existing = getConfig();
        existing.setStandardShiftDurationMinutes(config.getStandardShiftDurationMinutes());
        existing.setDailyStandardTargetKg(config.getDailyStandardTargetKg());
        OperationConfig saved = configRepository.save(existing);

        broadcastUpdate(tenantId, "CONFIG_UPDATE", saved);
        return saved;
    }

    // --- TABLES ---
    public List<OperationTable> getTables() {
        return tableRepository.findByTenantId(TenantContextHolder.getCurrentTenantId());
    }

    public OperationTable saveTable(OperationTable table) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        table.setTenantId(tenantId);
        OperationTable saved = tableRepository.save(table);
        broadcastUpdate(tenantId, "TABLES_REFRESH", null);
        return saved;
    }

    public void deleteTable(String id) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        tableRepository.deleteById(id);
        broadcastUpdate(tenantId, "TABLES_REFRESH", null);
    }

    // --- WORKER LOGIC ---
    public List<WorkerAvailabilityDto> getAvailableWorkers() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        LocalDate today = LocalDate.now();
        OperationConfig config = getConfig();

        List<Personnel> allPersonnel = personnelRepository.findByTenantId(tenantId);

        Set<String> userIds = allPersonnel.stream().map(Personnel::getUserId).collect(Collectors.toSet());
        Map<String, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<WorkerAvailabilityDto> dtoList = new ArrayList<>();

        for (Personnel p : allPersonnel) {
            WorkerDailyLedger ledger = ledgerRepository
                    .findByTenantIdAndWorkerIdAndDate(tenantId, p.getId(), today)
                    .orElse(new WorkerDailyLedger());

            int limit = (ledger.getStandardShiftMinutes() > 0) ? ledger.getStandardShiftMinutes() : config.getStandardShiftDurationMinutes();
            int used = ledger.getUsedMinutes();

            List<ActiveSession> activeSessions = sessionRepository.findByTenantIdAndWorkerIdAndCompletedFalse(tenantId, p.getId());
            int activeMinutes = activeSessions.stream().mapToInt(ActiveSession::getAssignedDurationMinutes).sum();

            int totalConsumed = used + activeMinutes;
            int remaining = Math.max(0, limit - totalConsumed);

            String status = "AVAILABLE";
            if (remaining == 0) status = "FULL";
            else if (activeMinutes > 0) status = "BUSY";

            User user = userMap.get(p.getUserId());
            String fullName = (user != null && user.getFullName() != null) ? user.getFullName() : "Personel " + p.getOnxCode();
            String avatarUrl = (user != null) ? user.getAvatarUrl() : null;

            dtoList.add(new WorkerAvailabilityDto(
                    p.getId(), fullName, p.getOnxCode(), avatarUrl,
                    limit, used, activeMinutes, remaining, status
            ));
        }
        return dtoList;
    }

    // --- TICKET (FİŞ) & ATAMA ---

    @Transactional
    public OperationTicket addTicket(TicketEntryRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        // 1. Fişi Kaydet
        OperationTicket ticket = new OperationTicket();
        ticket.setTenantId(tenantId);
        ticket.setTableId(request.tableId());
        ticket.setAmountKg(request.amountKg());
        ticket.setCreatedAt(LocalDateTime.now());
        // Context'ten kullanıcı adı alınıyor (Auth implementasyonuna göre değişebilir, şimdilik hardcoded veya null safe)
        try {
            ticket.setCreatedBy(TenantContextHolder.getCurrentUsername());
        } catch (Exception e) {
            ticket.setCreatedBy("System");
        }
        ticket.setProcessed(false);

        OperationTicket savedTicket = ticketRepository.save(ticket);

        // 2. Eğer personel seçildiyse onları da ata
        if (request.workerIds() != null && !request.workerIds().isEmpty()) {
            AssignWorkerRequest assignRequest = new AssignWorkerRequest(
                    request.tableId(),
                    request.workerIds(),
                    request.durationMinutes() != null ? request.durationMinutes() : 540
            );
            assignWorkers(assignRequest);
        } else {
            // Sadece fiş varsa update geç
            broadcastUpdate(tenantId, "TICKET_UPDATE", null);
        }

        return savedTicket;
    }

    @Transactional
    public List<ActiveSession> assignWorkers(AssignWorkerRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        LocalDate today = LocalDate.now();
        OperationConfig config = getConfig();

        List<ActiveSession> createdSessions = new ArrayList<>();

        for (String workerId : request.workerIds()) {
            WorkerDailyLedger ledger = ledgerRepository.findByTenantIdAndWorkerIdAndDate(tenantId, workerId, today)
                    .orElseGet(() -> {
                        WorkerDailyLedger l = new WorkerDailyLedger();
                        l.setTenantId(tenantId);
                        l.setWorkerId(workerId);
                        l.setDate(today);
                        l.setStandardShiftMinutes(config.getStandardShiftDurationMinutes());
                        l.setUsedMinutes(0);
                        return ledgerRepository.save(l);
                    });

            double hourlyTarget = config.getDailyStandardTargetKg() / (config.getStandardShiftDurationMinutes() / 60.0);
            double sessionTarget = hourlyTarget * (request.durationMinutes() / 60.0);

            ActiveSession session = new ActiveSession();
            session.setTenantId(tenantId);
            session.setTableId(request.tableId());
            session.setWorkerId(workerId);
            session.setStartTime(LocalDateTime.now());
            session.setAssignedDurationMinutes(request.durationMinutes());
            session.setTargetOutputKg(Math.round(sessionTarget * 100.0) / 100.0);
            session.setCompleted(false);
            session.setProcessed(false); // Yeni session, henüz arşivlenmedi

            createdSessions.add(sessionRepository.save(session));
        }

        broadcastUpdate(tenantId, "SESSION_UPDATE", null);
        broadcastUpdate(tenantId, "WORKER_UPDATE", null);

        return createdSessions;
    }

    @Transactional
    public ActiveSession releaseWorker(ReleaseWorkerRequest request) {
        ActiveSession session = sessionRepository.findById(request.sessionId())
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));

        if (session.isCompleted()) {
            throw new RuntimeException("Bu oturum zaten kapatılmış.");
        }

        LocalDateTime now = LocalDateTime.now();
        session.setEndTime(now);
        session.setCompleted(true);

        if (request.actualOutputKg() != null) {
            session.setActualOutputKg(request.actualOutputKg());
        }

        long actualDurationMinutes = ChronoUnit.MINUTES.between(session.getStartTime(), now);
        if (actualDurationMinutes < 1) actualDurationMinutes = 1;

        LocalDate today = session.getStartTime().toLocalDate();
        WorkerDailyLedger ledger = ledgerRepository
                .findByTenantIdAndWorkerIdAndDate(session.getTenantId(), session.getWorkerId(), today)
                .orElseThrow(() -> new RuntimeException("Defter hatası"));

        ledger.setUsedMinutes(ledger.getUsedMinutes() + (int) actualDurationMinutes);
        ledgerRepository.save(ledger);

        ActiveSession savedSession = sessionRepository.save(session);

        broadcastUpdate(session.getTenantId(), "SESSION_UPDATE", null);
        broadcastUpdate(session.getTenantId(), "WORKER_UPDATE", null);

        return savedSession;
    }

    // --- KAPANIŞ İŞLEMLERİ ---

    @Transactional
    public OperationTicket closeTableAndRollover(String tableId, double actualRemainingKg) {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        // 1. Eski Fişleri İşlendi Yap
        List<OperationTicket> oldTickets = ticketRepository.findByTableId(tableId);
        for (OperationTicket t : oldTickets) {
            t.setProcessed(true);
            ticketRepository.save(t);
        }

        // 2. Eski Sessionları İşlendi Yap
        List<ActiveSession> oldSessions = sessionRepository.findByTableIdAndCompletedTrue(tableId);
        for (ActiveSession s : oldSessions) {
            s.setProcessed(true);
            sessionRepository.save(s);
        }

        // 3. Devir Fişi Oluştur
        OperationTicket rolloverTicket = new OperationTicket();
        rolloverTicket.setTenantId(tenantId);
        rolloverTicket.setTableId(tableId);
        rolloverTicket.setAmountKg(actualRemainingKg);
        rolloverTicket.setCreatedAt(LocalDateTime.now());
        rolloverTicket.setCreatedBy("SYSTEM_ROLLOVER");
        rolloverTicket.setProcessed(false);

        OperationTicket saved = ticketRepository.save(rolloverTicket);
        broadcastUpdate(tenantId, "TABLES_REFRESH", null);
        return saved;
    }

    @Transactional
    public void closeAllRemainingTablesWithZero() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        List<OperationTable> allTables = tableRepository.findByTenantId(tenantId);

        int closedCount = 0;
        for (OperationTable table : allTables) {
            // Masada işlenmemiş fiş varsa ve kapatılmadıysa 0 ile kapat
            boolean hasUnprocessedTickets = ticketRepository.findByTableId(table.getId()).stream()
                    .anyMatch(t -> !t.isProcessed());

            if (hasUnprocessedTickets) {
                closeTableAndRollover(table.getId(), 0.0);
                closedCount++;
            }
        }

        if (closedCount > 0) {
            broadcastUpdate(tenantId, "TABLES_REFRESH", null);
        }
    }

    public TableStatsDto getTableStats(String tableId) {
        // Sadece işlenmemiş (aktif) fişler
        List<OperationTicket> tickets = ticketRepository.findByTableId(tableId).stream()
                .filter(t -> !t.isProcessed())
                .toList();

        double totalInput = tickets.stream().mapToDouble(OperationTicket::getAmountKg).sum();

        // Sadece son kapanıştan sonraki (işlenmemiş) üretimler
        List<ActiveSession> completedSessions = sessionRepository.findByTableIdAndCompletedTrue(tableId).stream()
                .filter(s -> !s.isProcessed())
                .toList();

        double totalOutput = completedSessions.stream()
                .mapToDouble(s -> s.getActualOutputKg() != null ? s.getActualOutputKg() : 0)
                .sum();

        return new TableStatsDto(tableId, totalInput, totalOutput, totalInput - totalOutput);
    }

    public List<TableSessionDto> getTableActiveSessions(String tableId) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        List<ActiveSession> sessions = sessionRepository.findByTableIdAndCompletedFalse(tableId);

        Set<String> workerIds = sessions.stream().map(ActiveSession::getWorkerId).collect(Collectors.toSet());
        Map<String, Personnel> personnelMap = personnelRepository.findAllById(workerIds).stream()
                .collect(Collectors.toMap(Personnel::getId, Function.identity()));

        Set<String> userIds = personnelMap.values().stream().map(Personnel::getUserId).collect(Collectors.toSet());
        Map<String, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return sessions.stream().map(s -> {
            Personnel p = personnelMap.get(s.getWorkerId());
            String name = "Bilinmeyen";
            String avatar = null;
            if (p != null) {
                User u = userMap.get(p.getUserId());
                if (u != null) {
                    name = u.getFullName();
                    avatar = u.getAvatarUrl();
                } else {
                    name = p.getOnxCode();
                }
            }
            return new TableSessionDto(s.getId(), s.getWorkerId(), name, avatar, s.getStartTime(), s.getAssignedDurationMinutes(), s.getTargetOutputKg());
        }).collect(Collectors.toList());
    }

    @Transactional
    public void transferStock(StockTransferRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        // 1. Kaynak Masanın Bakiyesini Kontrol Et
        TableStatsDto sourceStats = getTableStats(request.fromTableId());
        if (sourceStats.remainingKg() < request.amountKg()) {
            throw new RuntimeException("Yetersiz bakiye! Masada bu kadar mal yok.");
        }

        // Masaların isimlerini bul (Loglama/Fiş notu için)
        String fromTableName = tableRepository.findById(request.fromTableId()).map(OperationTable::getTableNo).orElse("??");
        String toTableName = tableRepository.findById(request.toTableId()).map(OperationTable::getTableNo).orElse("??");
        String user = TenantContextHolder.getCurrentUsername();

        // 2. Kaynak Masadan Düş (ÇIKIŞ FİŞİ - EKSİ BAKİYE)
        OperationTicket outTicket = new OperationTicket();
        outTicket.setTenantId(tenantId);
        outTicket.setTableId(request.fromTableId());
        outTicket.setAmountKg(-request.amountKg()); // Eksi değer havuzu düşürür
        outTicket.setCreatedAt(LocalDateTime.now());
        outTicket.setCreatedBy(user + " (Transfer -> " + toTableName + ")");
        outTicket.setProcessed(false);
        ticketRepository.save(outTicket);

        // 3. Hedef Masaya Ekle (GİRİŞ FİŞİ - ARTI BAKİYE)
        OperationTicket inTicket = new OperationTicket();
        inTicket.setTenantId(tenantId);
        inTicket.setTableId(request.toTableId());
        inTicket.setAmountKg(request.amountKg());
        inTicket.setCreatedAt(LocalDateTime.now());
        inTicket.setCreatedBy(user + " (Transfer <- " + fromTableName + ")");
        inTicket.setProcessed(false);
        ticketRepository.save(inTicket);

        // 4. Her iki masayı da güncelle
        broadcastUpdate(tenantId, "TABLES_REFRESH", null);
    }
}