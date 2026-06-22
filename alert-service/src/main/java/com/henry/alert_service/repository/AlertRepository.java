package com.henry.alert_service.repository;

import com.henry.alert_service.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * GAP-03: Extended with findByUserIdOrderByCreatedAtDesc for alert history endpoint.
 */
public interface AlertRepository extends JpaRepository<Alert, Long> {
    // Return alerts for a specific user, newest first
    List<Alert> findByUserIdOrderByCreatedAtDesc(Long userId);
}