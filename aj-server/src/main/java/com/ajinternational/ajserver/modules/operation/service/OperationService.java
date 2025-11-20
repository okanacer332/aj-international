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

    // --- SOCKET BİLDİRİMLERİ ---

    private void broadcastUpdate(String tenantId, String type, Object payload) {
        String destination = "/topic/operation/" + tenantId;
        messagingTemplate.convertAndSend(destination, new SocketUpdateDto(type, payload));
    }

    // Ticker ve Gamification için özel event bildirimi
    private void broadcastEvent(String tenantId, String type, Map<String, String> params) {
        // Ticker için genel event
        messagingTemplate.convertAndSend("/topic/operation/" + tenantId,
                new SocketUpdateDto("DASHBOARD_EVENT", new DashboardEventDto(type, params)));

        // İş bitişi ise Gamification (Patlama efekti) için ek event
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

        OperationTicket ticket = new OperationTicket();
        ticket.setTenantId(tenantId);
        ticket.setTableId(request.tableId());
        ticket.setAmountKg(request.amountKg());
        ticket.setCreatedAt(LocalDateTime.now());
        try {
            ticket.setCreatedBy(TenantContextHolder.getCurrentUsername());
        } catch (Exception e) {
            ticket.setCreatedBy("System");
        }
        ticket.setProcessed(false);

        OperationTicket savedTicket = ticketRepository.save(ticket);

        // Ticker Event
        String tableName = tableRepository.findById(request.tableId()).map(OperationTable::getTableNo).orElse("??");
        broadcastEvent(tenantId, "TICKET_ADDED", Map.of(
                "table", tableName,
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
            session.setProcessed(false);

            createdSessions.add(sessionRepository.save(session));
        }

        // Ticker Event
        String tableName = tableRepository.findById(request.tableId()).map(OperationTable::getTableNo).orElse("??");
        broadcastEvent(tenantId, "WORKER_ASSIGNED", Map.of(
                "table", tableName,
                "count", String.valueOf(request.workerIds().size())
        ));

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

        // Ticker & Gamification Event
        Personnel p = personnelRepository.findById(session.getWorkerId()).orElse(null);
        String workerName = "Personel";
        if (p != null) {
            User u = userRepository.findById(p.getUserId()).orElse(null);
            workerName = (u != null) ? u.getFullName() : p.getOnxCode();
        }
        String tableName = tableRepository.findById(session.getTableId()).map(OperationTable::getTableNo).orElse("??");

        broadcastEvent(session.getTenantId(), "WORK_FINISHED", Map.of(
                "table", tableName,
                "worker", workerName,
                "amount", String.valueOf(request.actualOutputKg() != null ? request.actualOutputKg() : 0)
        ));

        broadcastUpdate(session.getTenantId(), "SESSION_UPDATE", null);
        broadcastUpdate(session.getTenantId(), "WORKER_UPDATE", null);

        return savedSession;
    }

    // --- TRANSFER ---
    @Transactional
    public void transferStock(StockTransferRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        TableStatsDto sourceStats = getTableStats(request.fromTableId());
        if (sourceStats.remainingKg() < request.amountKg()) {
            throw new RuntimeException("Yetersiz bakiye!");
        }

        String fromTableName = tableRepository.findById(request.fromTableId()).map(OperationTable::getTableNo).orElse("??");
        String toTableName = tableRepository.findById(request.toTableId()).map(OperationTable::getTableNo).orElse("??");
        String user = "";
        try { user = TenantContextHolder.getCurrentUsername(); } catch (Exception e) {}

        // Kaynak (Çıkış)
        OperationTicket outTicket = new OperationTicket();
        outTicket.setTenantId(tenantId);
        outTicket.setTableId(request.fromTableId());
        outTicket.setAmountKg(-request.amountKg());
        outTicket.setCreatedAt(LocalDateTime.now());
        outTicket.setCreatedBy(user + " (Transfer -> " + toTableName + ")");
        outTicket.setProcessed(false);
        ticketRepository.save(outTicket);

        // Hedef (Giriş)
        OperationTicket inTicket = new OperationTicket();
        inTicket.setTenantId(tenantId);
        inTicket.setTableId(request.toTableId());
        inTicket.setAmountKg(request.amountKg());
        inTicket.setCreatedAt(LocalDateTime.now());
        inTicket.setCreatedBy(user + " (Transfer <- " + fromTableName + ")");
        inTicket.setProcessed(false);
        ticketRepository.save(inTicket);

        broadcastEvent(tenantId, "TRANSFER", Map.of(
                "from", fromTableName,
                "to", toTableName,
                "amount", String.valueOf(request.amountKg())
        ));
        broadcastUpdate(tenantId, "TABLES_REFRESH", null);
    }

    // --- KAPANIŞ İŞLEMLERİ ---

    @Transactional
    public OperationTicket closeTableAndRollover(String tableId, double actualRemainingKg) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        LocalDateTime now = LocalDateTime.now();

        // 1. Aktif Oturumları Otomatik Kapat (Paydos)
        List<ActiveSession> activeSessions = sessionRepository.findByTableIdAndCompletedFalse(tableId);
        for (ActiveSession session : activeSessions) {
            session.setEndTime(now);
            session.setCompleted(true);
            session.setActualOutputKg(0.0); // Otomatik kapanışta üretim girilmez
            session.setProcessed(true); // Arşivle

            // Süreyi işle
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

        // 2. Eski Fişleri Arşivle
        List<OperationTicket> oldTickets = ticketRepository.findByTableId(tableId);
        for (OperationTicket t : oldTickets) {
            t.setProcessed(true);
            ticketRepository.save(t);
        }

        // 3. Eski (Bitmiş) Sessionları Arşivle
        List<ActiveSession> oldSessions = sessionRepository.findByTableIdAndCompletedTrue(tableId);
        for (ActiveSession s : oldSessions) {
            s.setProcessed(true);
            sessionRepository.save(s);
        }

        // 4. Devir Fişi
        OperationTicket rolloverTicket = new OperationTicket();
        rolloverTicket.setTenantId(tenantId);
        rolloverTicket.setTableId(tableId);
        rolloverTicket.setAmountKg(actualRemainingKg);
        rolloverTicket.setCreatedAt(now);
        rolloverTicket.setCreatedBy("SYSTEM_ROLLOVER");
        rolloverTicket.setProcessed(false);

        OperationTicket saved = ticketRepository.save(rolloverTicket);

        String tableName = tableRepository.findById(tableId).map(OperationTable::getTableNo).orElse("??");

        broadcastEvent(tenantId, "TABLE_CLOSED", Map.of(
                "table", tableName,
                "amount", String.valueOf(actualRemainingKg)
        ));

        broadcastUpdate(tenantId, "TABLES_REFRESH", null);
        broadcastUpdate(tenantId, "SESSION_UPDATE", null);

        return saved;
    }

    @Transactional
    public void closeAllRemainingTablesWithZero() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        List<OperationTable> allTables = tableRepository.findByTenantId(tenantId);

        int closedCount = 0;
        for (OperationTable table : allTables) {
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
        List<OperationTicket> tickets = ticketRepository.findByTableId(tableId).stream()
                .filter(t -> !t.isProcessed())
                .toList();

        double totalInput = tickets.stream().mapToDouble(OperationTicket::getAmountKg).sum();

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

    // --- V5.0 DASHBOARD ANALİTİĞİ ---
    public FieldDashboardDto getFieldDashboardStats() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourAgo = now.minusHours(1);

        List<OperationTable> tables = tableRepository.findByTenantId(tenantId);
        int activeTables = 0;
        int activeWorkers = 0;
        double totalRemaining = 0;

        for (OperationTable t : tables) {
            TableStatsDto stats = getTableStats(t.getId());
            totalRemaining += stats.remainingKg();

            List<ActiveSession> sessions = sessionRepository.findByTableIdAndCompletedFalse(t.getId());
            if (!sessions.isEmpty()) {
                activeTables++;
                activeWorkers += sessions.size();
            }
        }

        // 1. Günlük Toplam Üretim
        List<ActiveSession> todayFinished = sessionRepository.findAll().stream()
                .filter(s -> s.getTenantId().equals(tenantId) && s.isCompleted() && s.getEndTime().isAfter(startOfDay))
                .toList();

        double dailyTotalOutput = todayFinished.stream()
                .mapToDouble(s -> s.getActualOutputKg() != null ? s.getActualOutputKg() : 0)
                .sum();

        // 2. Anlık Hız (Son 1 saatte biten işler)
        List<ActiveSession> recentFinished = sessionRepository.findAll().stream()
                .filter(s -> s.getTenantId().equals(tenantId) && s.isCompleted() && s.getEndTime().isAfter(oneHourAgo))
                .toList();

        double hourlySpeed = recentFinished.stream()
                .mapToDouble(s -> s.getActualOutputKg() != null ? s.getActualOutputKg() : 0)
                .sum();

        // 3. Tahmin
        LocalDateTime estimatedFinish = null;
        if (hourlySpeed > 0 && totalRemaining > 0) {
            double hoursLeft = totalRemaining / hourlySpeed;
            if (hoursLeft < 24) {
                estimatedFinish = now.plusMinutes((long) (hoursLeft * 60));
            }
        }

        return new FieldDashboardDto(
                activeTables,
                activeWorkers,
                Math.round(dailyTotalOutput * 100.0) / 100.0, // Günlük Toplamı Buraya Basıyoruz
                todayFinished.size(),
                new ArrayList<>()
        );
    }

    // --- DEMO VERİSİ (TEST İÇİN) ---
    @Transactional
    public void generateDemoData() {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        LocalDateTime now = LocalDateTime.now();

        // 1. Masalar
        if (tableRepository.findByTenantId(tenantId).isEmpty()) {
            for (int i = 1; i <= 12; i++) {
                OperationTable t = new OperationTable();
                t.setTenantId(tenantId);
                t.setTableNo("Masa-" + i);
                t.setUnitType(OperationTableUnit.PRE_SELECTION);
                t.setActive(true);
                tableRepository.save(t);
            }
        }
        List<OperationTable> tables = tableRepository.findByTenantId(tenantId);
        List<Personnel> personnelList = personnelRepository.findByTenantId(tenantId);

        if (personnelList.isEmpty()) return;

        java.util.Random random = new java.util.Random();

        for (OperationTable table : tables) {
            // A. Geçmiş (Bitmiş) İşler Oluştur (Hız ve Günlük Toplam için)
            int finishedCount = random.nextInt(3);
            for (int f = 0; f < finishedCount; f++) {
                Personnel p = personnelList.get(random.nextInt(personnelList.size()));
                ActiveSession finishedSession = new ActiveSession();
                finishedSession.setTenantId(tenantId);
                finishedSession.setTableId(table.getId());
                finishedSession.setWorkerId(p.getId());

                finishedSession.setStartTime(now.minusMinutes(120 + random.nextInt(60)));
                finishedSession.setEndTime(now.minusMinutes(5 + random.nextInt(50)));
                finishedSession.setAssignedDurationMinutes(540);

                double output = 100 + (random.nextDouble() * 300);
                finishedSession.setActualOutputKg(Math.round(output * 100.0) / 100.0);
                finishedSession.setTargetOutputKg(300.0);

                finishedSession.setCompleted(true);
                finishedSession.setProcessed(false);
                sessionRepository.save(finishedSession);
            }

            // B. Aktif İşler (Şimdiki Durum)
            if (random.nextDouble() > 0.3) {
                double stock = 500 + (random.nextDouble() * 2500);
                stock = Math.round(stock * 100.0) / 100.0;

                OperationTicket ticket = new OperationTicket();
                ticket.setTenantId(tenantId);
                ticket.setTableId(table.getId());
                ticket.setAmountKg(stock);
                ticket.setCreatedAt(now.minusMinutes(random.nextInt(300)));
                ticket.setCreatedBy("DemoGenerator");
                ticket.setProcessed(false);
                ticketRepository.save(ticket);

                broadcastEvent(tenantId, "TICKET_ADDED", Map.of("table", table.getTableNo(), "amount", String.valueOf(stock)));

                int workerCount = 1 + random.nextInt(6);
                for (int w = 0; w < workerCount; w++) {
                    Personnel p = personnelList.get(random.nextInt(personnelList.size()));

                    ActiveSession session = new ActiveSession();
                    session.setTenantId(tenantId);
                    session.setTableId(table.getId());
                    session.setWorkerId(p.getId());
                    int minutesAgo = 10 + random.nextInt(480);
                    session.setStartTime(now.minusMinutes(minutesAgo));
                    session.setAssignedDurationMinutes(540);
                    session.setTargetOutputKg(stock / workerCount);
                    session.setCompleted(false);
                    session.setProcessed(false);

                    try {
                        sessionRepository.save(session);
                    } catch (Exception e) {}
                }
            }
        }

        broadcastUpdate(tenantId, "TABLES_REFRESH", null);
        broadcastUpdate(tenantId, "SESSION_UPDATE", null);
    }
}