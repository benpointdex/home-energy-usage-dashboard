package com.henry.alert_service;

import com.henry.alert_service.model.Alert;
import com.henry.alert_service.repository.AlertRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@SpringBootTest
public class AlertPopulatorTest {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @Transactional
    @Commit
    public void populateAlerts() {
        // Clear alerts
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        jdbcTemplate.execute("TRUNCATE TABLE alert");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");

        // Fetch user IDs
        List<Long> userIds = jdbcTemplate.queryForList("SELECT id FROM user", Long.class);

        if (userIds.isEmpty()) {
            System.out.println("No users found. Please run the user populator first.");
            return;
        }

        List<Alert> alerts = new ArrayList<>();
        for (int i = 1; i <= 50; i++) {
            Long userId = userIds.get((i - 1) % userIds.size());
            Alert alert = Alert.builder()
                    .userId(userId)
                    .createdAt(LocalDateTime.now().minusHours(i))
                    .sent(i % 2 == 0)
                    .build();
            alerts.add(alert);
        }
        alertRepository.saveAll(alerts);
        System.out.println("Inserted 50 alerts.");
    }
}
