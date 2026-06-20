package com.henry.ingestion_service.simulation;

import com.henry.ingestion_service.dto.EnergyUsageDto;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Slf4j
@Component
public class ParallelDataSimulation implements CommandLineRunner {

    private final RestTemplate restTemplate = new RestTemplate();
    private final Random random = new Random();

    @Value("${simulation.parallel-threads}")
    private int parallelThreads;

    @Value("${simulation.interval-ms}")
    private long intervalMs;

    @Value("${simulation.endpoint}")
    private String ingestionEndpoint;

    @Value("${device.service.url:http://localhost:8081/api/v1/device}")
    private String deviceServiceUrl;

    private final ExecutorService executorService;

    // Per-user base multiplier: seeded from userId so each user has a
    // naturally different consumption level that stays consistent across ticks.
    // Range: 0.5 (low-consumption household) to 1.5 (high-consumption household)
    private final Map<Long, Double> userBaseMultipliers = new ConcurrentHashMap<>();

    private record DeviceDto(Long id, String name, String type, String location,
                             Long userId, Double energyConsumed, String status) {}
    private record UserDto(Long id, String name, String surname, String email,
                           String address, boolean alerting, double energyAlertingThreshold) {}

    public ParallelDataSimulation() {
        this.executorService = Executors.newCachedThreadPool();
    }

    @Override
    public void run(String... args) {
        log.info("ParallelDataSimulator (Level 3) started.");
        ((ThreadPoolExecutor) executorService).setCorePoolSize(parallelThreads);
    }

    @Scheduled(fixedRateString = "${simulation.interval-ms}")
    public void sendMockData() {
        executorService.submit(() -> {
            try {
                // Fetch all devices (includes status field now)
                DeviceDto[] devicesArray = restTemplate.getForObject(
                    deviceServiceUrl, DeviceDto[].class);
                List<DeviceDto> devices = devicesArray != null
                    ? Arrays.asList(devicesArray)
                    : Collections.emptyList();

                if (devices.isEmpty()) {
                    log.info("No registered devices found. Skipping tick.");
                    return;
                }

                // Group by userId
                Map<Long, List<DeviceDto>> devicesByUser = devices.stream()
                    .filter(d -> d.userId() != null)
                    .collect(Collectors.groupingBy(DeviceDto::userId));

                for (Map.Entry<Long, List<DeviceDto>> entry : devicesByUser.entrySet()) {
                    Long userId = entry.getKey();
                    List<DeviceDto> userDevices = entry.getValue();

                    // Derive a stable per-user multiplier from userId (0.5 to 1.5)
                    double userMultiplier = userBaseMultipliers.computeIfAbsent(userId,
                        id -> 0.5 + (new Random(id).nextDouble()));

                    log.info("Simulating userId {} (multiplier: {})", userId,
                        String.format("%.2f", userMultiplier));

                    for (DeviceDto device : userDevices) {

                        // ✅ KEY CHANGE: skip devices that are OFF
                        if ("OFF".equalsIgnoreCase(device.status())) {
                            log.debug("Device {} ({}) is OFF — skipping.", device.id(), device.name());
                            continue;
                        }

                        DeviceProfile profile = DeviceProfile.fromType(device.type());
                        double energy = profile.calculateEnergy(intervalMs, userMultiplier, random);

                        if (energy > 0) {
                            sendPayload(device.id(), energy);
                        }
                    }
                }

            } catch (Exception e) {
                log.error("Error in simulation tick: {}", e.getMessage(), e);
            }
        });
    }

    private void sendPayload(long deviceId, double energyConsumed) {
        EnergyUsageDto dto = EnergyUsageDto.builder()
            .deviceId(deviceId)
            .energyConsumed(energyConsumed)
            .timestamp(Instant.now())
            .build();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<EnergyUsageDto> request = new HttpEntity<>(dto, headers);
            restTemplate.postForEntity(ingestionEndpoint, request, Void.class);
            log.info("Sent → Device {}: {} kWh", deviceId, energyConsumed);
        } catch (Exception e) {
            log.error("Failed to send data for device {}: {}", deviceId, e.getMessage());
        }
    }

    @PreDestroy
    public void shutdown() {
        executorService.shutdown();
        log.info("ParallelDataSimulator shut down.");
    }
}