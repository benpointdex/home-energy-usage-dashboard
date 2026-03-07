package com.henry.alert_service.repository;

import com.henry.alert_service.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository  extends JpaRepository<Alert, Long> {
}