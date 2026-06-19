package com.henry.device_service.service;

import com.henry.device_service.dto.DeviceDto;
import com.henry.device_service.entity.Device;
import com.henry.device_service.repository.DeviceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * GAP-02: Device business logic.
 * Provides full CRUD for devices.
 * NOTE: userId is intentionally immutable after creation — a device cannot change owner.
 */
@Slf4j
@Service
public class DeviceService {

    private final DeviceRepository repository;

    public DeviceService(DeviceRepository repository) {
        this.repository = repository;
    }

    /** Called by usage-service DeviceClient.getDeviceById() */
    public DeviceDto getById(Long id) {
        Device d = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("DEVICE_NOT_FOUND"));
        return toDto(d);
    }

    /** Called by usage-service DeviceClient.getAllDevicesForUser() and by the client */
    public List<DeviceDto> getByUserId(Long userId) {
        return repository.findByUserId(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<DeviceDto> getAll() {
        return repository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    /** Client-facing: register a new device */
    public DeviceDto create(DeviceDto dto) {
        Device d = new Device();
        d.setName(dto.name());
        d.setType(dto.type());
        d.setLocation(dto.location());
        d.setUserId(dto.userId());
        d.setStatus("ON");         // new devices always start as ON
        DeviceDto created = toDto(repository.save(d));

        return created;
    }

    /** Client-facing: update name, type, location — userId is NOT updatable */
    public DeviceDto update(Long id, DeviceDto dto) {
        Device d = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("DEVICE_NOT_FOUND"));
        d.setName(dto.name());
        d.setType(dto.type());
        d.setLocation(dto.location());
        // userId is intentionally not updatable — a device cannot change owner
        return toDto(repository.save(d));
    }

    /** Client-facing: toggle device status */
    public DeviceDto toggleStatus(Long id, String status) {
        Device d = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("DEVICE_NOT_FOUND"));
        d.setStatus(status);
        return toDto(repository.save(d));
    }

    /** Client-facing: delete a device */
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("DEVICE_NOT_FOUND");
        }
        repository.deleteById(id);
    }

    private DeviceDto toDto(Device d) {
        return new DeviceDto(
                d.getId(),
                d.getName(),
                d.getType(),
                d.getLocation(),
                d.getUserId(),
                null,                  // energyConsumed is always null from this service
                d.getStatus()          // "ON" or "OFF"
        );
    }
}
