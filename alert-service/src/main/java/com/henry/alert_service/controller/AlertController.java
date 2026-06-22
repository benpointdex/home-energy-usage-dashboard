package com.henry.alert_service.controller;

import com.henry.alert_service.dto.AlertDto;
import com.henry.alert_service.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * GAP-03: Alert history REST controller.
 * Returns a user's alert log, newest-first, as stored in the MySQL alert table.
 * Alerts are written here by the Kafka consumer (AlertService) after each threshold breach.
 */
@RestController
@RequestMapping("/api/v1/alert")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    /**
     * GET /api/v1/alert/user/{userId}
     * Returns all alerts for the given user, ordered newest first.
     * Returns an empty array [] if no alerts exist — never null, never 404.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AlertDto>> getAlertsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(alertService.getAlertsForUser(userId));
    }
}
