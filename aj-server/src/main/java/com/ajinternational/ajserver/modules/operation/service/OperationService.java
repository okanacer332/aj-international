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
import java.time.format.DateTimeFormatter;
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

    // --- SOCKET BİLDİRİMLERİ ---

    private void broadcastUpdate(String tenantId, String type, Object payload) {
        String destination = "/topic/operation/" + tenantId;
        messagingTemplate.convertAndSend(destination, new SocketUpdateDto(type, payload));
    }

    private void broadcastEvent(String tenantId, String type, Map<String, String> params) {
        messagingTemplate.convertAndSend("/topic/operation/" + tenantId,
                new SocketUpdateDto("DASHBOARD_EVENT", new DashboardEventDto(type, params)));

        if ("WORK_FINISHED".equals(type)) {
            messagingTemplate.convertAndSend("/topic/operation/" + tenantId,
                    new SocketUpdateDto("WORK_FINISHED", params));
        }
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
        // Null check
        if (table.getTotalPoolKg() == null) table.setTotalPoolKg(0.0);
        if (table.getProcessedKg() == null) table.setProcessedKg(0.0);

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

    @Transactional
    public OperationTicket addTicket(TicketEntryRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        // 1. Masayı Güncelle (Havuzu Artır)
        OperationTable table = tableRepository.findById(request.tableId())
                .orElseThrow(() -> new RuntimeException("Masa bulunamadı"));

        double currentPool = table.getTotalPoolKg() != null ? table.getTotalPoolKg() : 0.0;
        table.setTotalPoolKg(currentPool + request.amountKg());
        tableRepository.save(table);

        // 2. Fiş Kaydı
        OperationTicket ticket = new OperationTicket();
        ticket.setTenantId(tenantId);
        ticket.setTableId(request.tableId());
        ticket.setAmountKg(request.amountKg());

        // --- TARİH AYARLAMASI ---
        if (request.customDate() != null && !request.customDate().isBlank()) {
            try {
                // Frontend ISO string gönderir (örn: 2023-10-27T10:00:00.000Z)
                // ZonedDateTime olarak parse edip LocalDateTime'a çevirmek en güvenlisidir
                ticket.setCreatedAt(java.time.ZonedDateTime.parse(request.customDate()).toLocalDateTime());
            } catch (Exception e) {
                // Parse hatası olursa fallback olarak şimdiki zaman
                System.err.println("Tarih formatı hatası: " + e.getMessage());
                ticket.setCreatedAt(LocalDateTime.now());
            }
        } else {
            ticket.setCreatedAt(LocalDateTime.now());
        }
        // ------------------------

        try {
            ticket.setCreatedBy(TenantContextHolder.getCurrentUsername());
        } catch (Exception e) {
            ticket.setCreatedBy("System");
        }
        ticket.setProcessed(false);

        OperationTicket savedTicket = ticketRepository.save(ticket);

        // Ticker Event
        broadcastEvent(tenantId, "TICKET_ADDED", Map.of(
                "table", table.getTableNo(),
                "amount", String.valueOf(request.amountKg())
        ));

        // Eğer personel seçildiyse ata
        if (request.workerIds() != null && !request.workerIds().isEmpty()) {
            AssignWorkerRequest assignRequest = new AssignWorkerRequest(
                    request.tableId(),
                    request.workerIds(),
                    request.durationMinutes() != null ? request.durationMinutes() : 540
            );
            assignWorkers(assignRequest);
        } else {
            broadcastUpdate(tenantId, "TICKET_UPDATE", null);
            broadcastUpdate(tenantId, "TABLES_REFRESH", null);
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
            // Ledger kontrol/oluşturma
            ledgerRepository.findByTenantIdAndWorkerIdAndDate(tenantId, workerId, today)
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
            session.setActualOutputKg(0.0); // Başlangıçta 0
            session.setCompleted(false);
            session.setProcessed(false);

            createdSessions.add(sessionRepository.save(session));
        }

        String tableName = tableRepository.findById(request.tableId()).map(OperationTable::getTableNo).orElse("??");
        broadcastEvent(tenantId, "WORKER_ASSIGNED", Map.of(
                "table", tableName,
                "count", String.valueOf(request.workerIds().size())
        ));

        broadcastUpdate(tenantId, "SESSION_UPDATE", null);
        broadcastUpdate(tenantId, "WORKER_UPDATE", null);

        return createdSessions;
    }

    /**
     * İşçiyi çıkarır ve hakediş dağıtır (Interim Ledger - Ara Hakediş)
     */
    @Transactional
    public ActiveSession releaseWorker(String sessionId, Double remainingOnTableKg) {
        // 1. Oturumu ve Masayı Bul
        ActiveSession sessionToClose = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Oturum bulunamadı"));

        if (sessionToClose.isCompleted()) {
            throw new RuntimeException("Bu oturum zaten kapatılmış.");
        }

        OperationTable table = tableRepository.findById(sessionToClose.getTableId())
                .orElseThrow(() -> new RuntimeException("Masa bulunamadı"));

        String tenantId = sessionToClose.getTenantId();

        // 2. Havuz Hesaplaması (Dinamik Paylaşım)
        double currentPool = table.getTotalPoolKg() != null ? table.getTotalPoolKg() : 0.0;
        double previouslyProcessed = table.getProcessedKg() != null ? table.getProcessedKg() : 0.0;

        if (remainingOnTableKg == null) remainingOnTableKg = currentPool - previouslyProcessed;
        if (remainingOnTableKg < 0) remainingOnTableKg = 0.0;

        double totalConsumedIdeally = currentPool - remainingOnTableKg;
        double newDeltaProcessed = totalConsumedIdeally - previouslyProcessed;

        if (newDeltaProcessed < 0) {
            newDeltaProcessed = 0;
        }

        // 3. Masadaki AKTİF işçileri bul (Paydaşlar)
        List<ActiveSession> activeSessions = sessionRepository.findByTableIdAndCompletedFalse(table.getId());
        int activeWorkerCount = activeSessions.size();

        if (activeWorkerCount > 0 && newDeltaProcessed > 0) {
            double sharePerWorker = newDeltaProcessed / activeWorkerCount;

            // Herkese payını dağıt
            for (ActiveSession s : activeSessions) {
                double currentOutput = s.getActualOutputKg() != null ? s.getActualOutputKg() : 0.0;
                s.setActualOutputKg(currentOutput + sharePerWorker);
                sessionRepository.save(s);
            }

            // Masanın "Dağıtılmış/İşlenmiş" bilgisini güncelle
            table.setProcessedKg(previouslyProcessed + newDeltaProcessed);
            tableRepository.save(table);
        }

        // 4. Çıkan Kişinin İşlemlerini Tamamla
        LocalDateTime now = LocalDateTime.now();
        sessionToClose = sessionRepository.findById(sessionId).orElseThrow();

        sessionToClose.setEndTime(now);
        sessionToClose.setCompleted(true);

        long actualDurationMinutes = ChronoUnit.MINUTES.between(sessionToClose.getStartTime(), now);
        if (actualDurationMinutes < 1) actualDurationMinutes = 1;

        // Ledger (Günlük Süre) güncelle
        LocalDate today = sessionToClose.getStartTime().toLocalDate();
        WorkerDailyLedger ledger = ledgerRepository
                .findByTenantIdAndWorkerIdAndDate(tenantId, sessionToClose.getWorkerId(), today)
                .orElse(null);

        if (ledger != null) {
            ledger.setUsedMinutes(ledger.getUsedMinutes() + (int) actualDurationMinutes);
            ledgerRepository.save(ledger);
        }

        ActiveSession savedSession = sessionRepository.save(sessionToClose);

        // Bildirimler
        broadcastEvent(tenantId, "WORK_FINISHED", Map.of(
                "table", table.getTableNo(),
                "amount", String.valueOf(savedSession.getActualOutputKg())
        ));

        broadcastUpdate(tenantId, "SESSION_UPDATE", null);
        broadcastUpdate(tenantId, "WORKER_UPDATE", null);
        broadcastUpdate(tenantId, "TABLES_REFRESH", null);

        return savedSession;
    }

    // --- TRANSFER ---
    @Transactional
    public void transferStock(StockTransferRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        OperationTable fromTable = tableRepository.findById(request.fromTableId()).orElseThrow();
        OperationTable toTable = tableRepository.findById(request.toTableId()).orElseThrow();

        // Stok Kontrolü
        double currentFromPool = fromTable.getTotalPoolKg() != null ? fromTable.getTotalPoolKg() : 0.0;
        double currentFromProcessed = fromTable.getProcessedKg() != null ? fromTable.getProcessedKg() : 0.0;
        double remaining = currentFromPool - currentFromProcessed;

        if (remaining < request.amountKg()) {
            throw new RuntimeException("Yetersiz bakiye! Masada kalan: " + remaining);
        }

        // 1. Masaların Havuzlarını Güncelle
        fromTable.setTotalPoolKg(currentFromPool - request.amountKg());
        tableRepository.save(fromTable);

        double currentToPool = toTable.getTotalPoolKg() != null ? toTable.getTotalPoolKg() : 0.0;
        toTable.setTotalPoolKg(currentToPool + request.amountKg());
        tableRepository.save(toTable);

        // 2. Ticket Logs (İzlenebilirlik)
        String user = "System";
        try { user = TenantContextHolder.getCurrentUsername(); } catch (Exception e) {}

        OperationTicket outTicket = new OperationTicket();
        outTicket.setTenantId(tenantId);
        outTicket.setTableId(request.fromTableId());
        outTicket.setAmountKg(-request.amountKg());
        outTicket.setCreatedAt(LocalDateTime.now());
        outTicket.setCreatedBy(user + " (Transfer -> " + toTable.getTableNo() + ")");
        outTicket.setProcessed(true);
        ticketRepository.save(outTicket);

        OperationTicket inTicket = new OperationTicket();
        inTicket.setTenantId(tenantId);
        inTicket.setTableId(request.toTableId());
        inTicket.setAmountKg(request.amountKg());
        inTicket.setCreatedAt(LocalDateTime.now());
        inTicket.setCreatedBy(user + " (Transfer <- " + fromTable.getTableNo() + ")");
        inTicket.setProcessed(false);
        ticketRepository.save(inTicket);

        broadcastEvent(tenantId, "TRANSFER", Map.of(
                "from", fromTable.getTableNo(),
                "to", toTable.getTableNo(),
                "amount", String.valueOf(request.amountKg())
        ));
        broadcastUpdate(tenantId, "TABLES_REFRESH", null);
    }

    // --- KAPANIŞ İŞLEMLERİ (ROLLOVER) ---

    @Transactional
    public OperationTicket closeTableAndRollover(String tableId, double actualRemainingKg) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        LocalDateTime now = LocalDateTime.now();
        OperationTable table = tableRepository.findById(tableId).orElseThrow();

        // 1. Son bir "Ara Hakediş" (Final Distribution)
        double currentPool = table.getTotalPoolKg() != null ? table.getTotalPoolKg() : 0.0;
        double previouslyProcessed = table.getProcessedKg() != null ? table.getProcessedKg() : 0.0;

        double totalConsumed = currentPool - actualRemainingKg;
        double delta = totalConsumed - previouslyProcessed;

        List<ActiveSession> activeSessions = sessionRepository.findByTableIdAndCompletedFalse(tableId);
        if (!activeSessions.isEmpty() && delta > 0) {
            double share = delta / activeSessions.size();
            for (ActiveSession s : activeSessions) {
                s.setActualOutputKg((s.getActualOutputKg() != null ? s.getActualOutputKg() : 0) + share);
                sessionRepository.save(s);
            }
        }

        // 2. Tüm Oturumları Kapat
        for (ActiveSession session : activeSessions) {
            session.setEndTime(now);
            session.setCompleted(true);
            session.setProcessed(true); // Arşivle

            long duration = ChronoUnit.MINUTES.between(session.getStartTime(), now);
            if (duration < 1) duration = 1;

            WorkerDailyLedger ledger = ledgerRepository
                    .findByTenantIdAndWorkerIdAndDate(tenantId, session.getWorkerId(), session.getStartTime().toLocalDate())
                    .orElse(null);
            if (ledger != null) {
                ledger.setUsedMinutes(ledger.getUsedMinutes() + (int) duration);
                ledgerRepository.save(ledger);
            }
            sessionRepository.save(session);
        }

        // 3. Eski Fişleri Temizle
        List<OperationTicket> oldTickets = ticketRepository.findByTableId(tableId);
        for (OperationTicket t : oldTickets) {
            t.setProcessed(true);
            ticketRepository.save(t);
        }

        // 4. Masayı Sıfırla ve Devir Fişi Oluştur
        table.setTotalPoolKg(actualRemainingKg);
        table.setProcessedKg(0.0);
        tableRepository.save(table);

        OperationTicket rolloverTicket = new OperationTicket();
        rolloverTicket.setTenantId(tenantId);
        rolloverTicket.setTableId(tableId);
        rolloverTicket.setAmountKg(actualRemainingKg);
        rolloverTicket.setCreatedAt(now);
        rolloverTicket.setCreatedBy("SYSTEM_ROLLOVER");
        rolloverTicket.setProcessed(false);
        OperationTicket saved = ticketRepository.save(rolloverTicket);

        broadcastEvent(tenantId, "TABLE_CLOSED", Map.of(
                "table", table.getTableNo(),
                "amount", String.valueOf(actualRemainingKg)
        ));

        broadcastUpdate(tenantId, "TABLES_REFRESH", null);
        broadcastUpdate(tenantId, "SESSION_UPDATE", null);

        return saved;
    }

    /**
     * TOPLU KAPATMA - SEÇMELİ
     * Gelen listedeki masaları kapatır, diğerlerine dokunmaz.
     */
    @Transactional
    public void bulkCloseTables(List<String> tableIds) {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        if (tableIds == null || tableIds.isEmpty()) return;

        int closedCount = 0;

        List<OperationTable> targetTables = tableRepository.findAllById(tableIds);

        for (OperationTable table : targetTables) {
            if (!table.getTenantId().equals(tenantId)) continue;
            closeTableAndRollover(table.getId(), 0.0);
            closedCount++;
        }

        if (closedCount > 0) {
            broadcastUpdate(tenantId, "TABLES_REFRESH", null);
        }
    }

    // --- V5.0 DASHBOARD ANALİTİĞİ ---

    public TableStatsDto getTableStats(String tableId) {
        OperationTable table = tableRepository.findById(tableId).orElse(new OperationTable());
        double totalPool = table.getTotalPoolKg() != null ? table.getTotalPoolKg() : 0.0;
        double processed = table.getProcessedKg() != null ? table.getProcessedKg() : 0.0;
        double remaining = totalPool - processed;
        return new TableStatsDto(tableId, totalPool, processed, remaining);
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
            double currentOutput = s.getActualOutputKg() != null ? s.getActualOutputKg() : 0.0;
            return new TableSessionDto(s.getId(), s.getWorkerId(), name, avatar, s.getStartTime(), s.getAssignedDurationMinutes(), currentOutput);
        }).collect(Collectors.toList());
    }

    public FieldDashboardDto getFieldDashboardStats() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();

        List<OperationTable> tables = tableRepository.findByTenantId(tenantId);
        int activeTables = 0;
        int activeWorkers = 0;
        double totalRemaining = 0;

        for (OperationTable t : tables) {
            double pool = t.getTotalPoolKg() != null ? t.getTotalPoolKg() : 0.0;
            double proc = t.getProcessedKg() != null ? t.getProcessedKg() : 0.0;
            totalRemaining += (pool - proc);

            List<ActiveSession> sessions = sessionRepository.findByTableIdAndCompletedFalse(t.getId());
            if (!sessions.isEmpty()) {
                activeTables++;
                activeWorkers += sessions.size();
            }
        }

        List<ActiveSession> allTodaySessions = sessionRepository.findAll().stream()
                .filter(s -> s.getTenantId().equals(tenantId) && s.getStartTime().isAfter(startOfDay))
                .toList();

        double realDailyTotal = allTodaySessions.stream()
                .mapToDouble(s -> s.getActualOutputKg() != null ? s.getActualOutputKg() : 0)
                .sum();

        List<ActiveSession> todayFinished = allTodaySessions.stream()
                .filter(ActiveSession::isCompleted)
                .toList();

        return new FieldDashboardDto(
                activeTables,
                activeWorkers,
                Math.round(realDailyTotal * 100.0) / 100.0,
                todayFinished.size(),
                new ArrayList<>()
        );
    }

    @Transactional
    public void generateDemoData() {
        // ... (Eski demo kodları buraya gelebilir, yer kaplamaması için kısalttım)
    }
}