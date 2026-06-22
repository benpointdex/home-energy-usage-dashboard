package com.henry.alert_service.service;

import com.henry.alert_service.dto.AlertDto;
import com.henry.alert_service.kafka.AlertingEvent;
import com.henry.alert_service.repository.AlertRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class AlertService {

    private final EmailService emailService;
    private final AlertRepository alertRepository;

    public AlertService(EmailService emailService,
                        AlertRepository alertRepository) {
        this.emailService = emailService;
        this.alertRepository = alertRepository;
    }

    @KafkaListener(topics = "energy-alerts", groupId = "alert-service")
    public void energyUsageAlertEvent(AlertingEvent alertingEvent) {
        log.info("Received alert event: {}", alertingEvent);

        // send email alert
        final String subject = "Energy Usage Alert for User "
                + alertingEvent.getUserId();
        final String message = "Alert: " + alertingEvent.getMessage() +
                "\nThreshold: " + alertingEvent.getThreshold() +
                "\nEnergy Consumed: " + alertingEvent.getEnergyConsumed();
        emailService.sendEmail(alertingEvent.getEmail(),
                subject,
                message,
                alertingEvent.getUserId());
    }

    // ─────────────────────────────────────────────────────────────────────
    // GAP-03: Alert history query — returns alerts for a user, newest first
    // ─────────────────────────────────────────────────────────────────────
    public List<AlertDto> getAlertsForUser(Long userId) {
        return alertRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(a -> new AlertDto(a.getId(), a.getUserId(), a.getCreatedAt(), a.isSent()))
                .toList();
    }
}