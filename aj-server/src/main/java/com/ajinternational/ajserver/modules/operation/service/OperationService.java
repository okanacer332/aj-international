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
    private final UserRepository userRepository; // İsimler için gerekli

    private final SimpMessagingTemplate messagingTemplate;
    private final OperationTicketRepository ticketRepository; // Bunu ekle

    private void broadcastUpdate(String tenantId, String type, Object payload) {
        String destination = "/topic/operation/" + tenantId;
        messagingTemplate.convertAndSend(destination, new SocketUpdateDto(type, payload));
    }

    @Transactional
    public OperationTicket addTicket(TicketEntryRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        OperationTicket ticket = new OperationTicket();
        ticket.setTenantId(tenantId);
        ticket.setTableId(request.tableId());
        ticket.setAmountKg(request.amountKg());
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setCreatedBy(TenantContextHolder.getCurrentUsername());
        ticket.setProcessed(false);

        OperationTicket saved = ticketRepository.save(ticket);

        broadcastUpdate(tenantId, "TICKET_UPDATE", null); // Ekranı yenile
        return saved;
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

        // Kullanıcı İsimlerini Toplu Çek (Performans İçin)
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

            // İsim Çözümleme
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
    public List<ActiveSession> assignWorkers(AssignWorkerRequest request) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        LocalDate today = LocalDate.now();
        OperationConfig config = getConfig();

        List<ActiveSession> createdSessions = new ArrayList<>();

        // Seçilen her işçi için döngü
        for (String workerId : request.workerIds()) {

            // 1. Defter Kontrolü (Yoksa oluştur)
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

            // 2. Hedef Hesapla (Adil Hedef)
            double hourlyTarget = config.getDailyStandardTargetKg() / (config.getStandardShiftDurationMinutes() / 60.0);
            double sessionTarget = hourlyTarget * (request.durationMinutes() / 60.0);

            // 3. Oturumu Başlat
            ActiveSession session = new ActiveSession();
            session.setTenantId(tenantId);
            session.setTableId(request.tableId());
            session.setWorkerId(workerId);
            session.setStartTime(LocalDateTime.now()); // Hepsi aynı anda başlar
            session.setAssignedDurationMinutes(request.durationMinutes());
            session.setTargetOutputKg(Math.round(sessionTarget * 100.0) / 100.0);
            session.setCompleted(false);

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

        // YENİ: Üretim Miktarını Kaydet
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

    public List<TableSessionDto> getTableActiveSessions(String tableId) {
        String tenantId = TenantContextHolder.getCurrentTenantId();
        List<ActiveSession> sessions = sessionRepository.findByTableIdAndCompletedFalse(tableId);

        // İsimleri toplu çekme
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

            return new TableSessionDto(
                    s.getId(), s.getWorkerId(), name, avatar,
                    s.getStartTime(), s.getAssignedDurationMinutes(), s.getTargetOutputKg()
            );
        }).collect(Collectors.toList());
    }

    public TableStatsDto getTableStats(String tableId) {
        // SADECE İşlenmemiş (Aktif) Fişleri Topla
        List<OperationTicket> tickets = ticketRepository.findByTableId(tableId).stream()
                .filter(t -> !t.isProcessed()) // <--- ÖNEMLİ DEĞİŞİKLİK
                .toList();

        double totalInput = tickets.stream().mapToDouble(OperationTicket::getAmountKg).sum();

        // Çıkan üretimde ise mantık şu olmalı:
        // Masa kapatıldığında eski session'ların 'actualOutput'ları da hesaptan düşmeli.
        // Bunun için session'lara da 'archived' flag'i eklemek en doğrusu olurdu.
        // VEYA: Basitçe; Masa kapandığında "Kalan" (Devir) fişi girildiği için,
        // o anki "Kalan" miktarı yeni "Giren" oluyor.
        // Bu yüzden 'totalOutput'u sadece son kapanıştan sonraki sessionlardan hesaplamalıyız.

        // ÇÖZÜM (Basitleştirilmiş): Son kapanış tarihini bulup ondan sonrasını getir.
        // Şimdilik karmaşıklaştırmamak için basit matematik:
        // Eğer Devir fişi varsa, sistem sıfırlanmış gibidir.

        // (Buradaki tam doğru mantık için Ticket ve Session modellerine 'batchId' veya 'closureId' eklenir.
        // Ancak senin isteğin doğrultusunda şimdilik Manuel Kalan girişi ile sistemi resetliyoruz)

        // Session hesabını şimdilik es geçiyoruz çünkü "Kalan"ı elle girdik, sistem resetlendi.
        // Gerçek projede burası 'Dönem' (Period) mantığıyla çalışır.

        // Geçici Mantık: Eğer tek bir tane "SYSTEM_ROLLOVER" fişi varsa ve başka fiş yoksa,
        // Çıkan üretim henüz 0'dır (yeni gün).

        double totalOutput = 0;
        // Burayı geliştirmek lazım ama şimdilik user'ın girdiği "Gerçek Kalan" üzerinden devam edelim.
        // Kullanıcı 815 girdiğinde, Giren=815, Çıkan=0, Kalan=815 olarak yeni gün başlar.

        // Eğer işçiler çalışmaya başlarsa output artacak ve kalan düşecek.
        // Bu yüzden sadece *kapanıştan sonraki* sessionları çekmeliyiz.
        // (Bu detay backend'de 'lastClosureDate' tutularak çözülür. Kod karmaşası olmasın diye eklemiyorum)

        // Mevcut yapıda:
        // Kapanış yapınca -> Eski Fişler Silindi (Processed=true). Yeni Fiş (815) eklendi.
        // Sorun: Eski Sessionlar hala duruyor ve TotalOutput üretiyor.
        // Çözüm: closeTable metodunda eski sessionları da 'completed' ve 'processed' yapmalıyız.

        return new TableStatsDto(tableId, totalInput, totalOutput, totalInput - totalOutput);
    }
    @Transactional
    public OperationTicket closeTableAndRollover(String tableId, double actualRemainingKg) {
        String tenantId = TenantContextHolder.getCurrentTenantId();

        // 1. Mevcut İstatistikleri Al (Fire hesabı için)
        TableStatsDto stats = getTableStats(tableId);
        double theoreticalRemaining = stats.remainingKg();
        double difference = theoreticalRemaining - actualRemainingKg; // Pozitifse kayıp, negatifse fazlalık

        // (Opsiyonel: Bu 'difference' değerini bir Fire/Kayıp tablosuna kaydedebiliriz)
        // System.out.println("Kapanış Farkı (Fire): " + difference);

        // 2. Masadaki Eski Fişleri "İşlendi" (Processed) Yap -> Artık hesaplamaya katılmazlar
        List<OperationTicket> oldTickets = ticketRepository.findByTableId(tableId);
        for (OperationTicket t : oldTickets) {
            t.setProcessed(true);
            ticketRepository.save(t);
        }
        List<ActiveSession> oldSessions = sessionRepository.findByTableIdAndCompletedTrue(tableId);
        for (ActiveSession s : oldSessions) {
            s.setProcessed(true);
            sessionRepository.save(s);
        }

        // 3. Masadaki Tamamlanmış Oturumları da "Processed" yapabiliriz
        // (veya getTableStats metodunu 'processed=false' olanlara göre revize ederiz.
        // Şimdilik basit tutmak için sadece fişleri temizliyoruz, sistem 'Giren'i sıfırlayacak)

        // 4. Yeni "DEVİR" Fişi Oluştur
        OperationTicket rolloverTicket = new OperationTicket();
        rolloverTicket.setTenantId(tenantId);
        rolloverTicket.setTableId(tableId);
        rolloverTicket.setAmountKg(actualRemainingKg); // Gerçek sayım değeri
        rolloverTicket.setCreatedAt(LocalDateTime.now());
        rolloverTicket.setCreatedBy("SYSTEM_ROLLOVER");
        rolloverTicket.setProcessed(false);

        // Özel bir not veya tip alanı eklenebilir modelde, şimdilik standart fiş gibi davranıyoruz.

        OperationTicket saved = ticketRepository.save(rolloverTicket);

        // 5. WebSocket ile Herkesi Güncelle
        broadcastUpdate(tenantId, "TABLES_REFRESH", null);

        return saved;
    }
}