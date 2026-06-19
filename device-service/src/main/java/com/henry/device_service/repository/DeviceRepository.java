package com.henry.device_service.repository;

import com.henry.device_service.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * GAP-02: Device JPA repository.
 * findByUserId is called by usage-service via DeviceClient.getAllDevicesForUser().
 */
public interface DeviceRepository extends JpaRepository<Device, Long> {
    List<Device> findByUserId(Long userId);
}
