package com.henry.usage_service;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.domain.WritePrecision;
import com.influxdb.client.write.Point;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@SpringBootTest(properties = "spring.kafka.consumer.properties.spring.json.type.mapping=energyUsageEvent:com.henry.usage_service.kafka.EnergyUsageEvent")
public class UsagePopulatorTest {

    @Autowired
    private InfluxDBClient influxDBClient;

    @Value("${influx.bucket}")
    private String bucket;

    @Value("${influx.org}")
    private String org;

    @Test
    public void populateUsage() {
        // Delete all data in the bucket for the last 100 years
        OffsetDateTime start = OffsetDateTime.now().minusYears(100);
        OffsetDateTime stop = OffsetDateTime.now();
        influxDBClient.getDeleteApi().delete(start, stop, "", bucket, org);
        System.out.println("Cleared InfluxDB bucket: " + bucket);

        List<Point> points = new ArrayList<>();
        Instant now = Instant.now();

        // We have 50 devices (IDs 1 to 50 assuming sequence)
        // Let's create 2 usage points for each device (100 total)
        for (int i = 1; i <= 50; i++) {
            // Point 1: 10 mins ago
            Point point1 = Point.measurement("energy_usage")
                    .addTag("deviceId", String.valueOf(i))
                    .addField("energyConsumed", 10.5 + i)
                    .time(now.minusSeconds(600), WritePrecision.MS);
            
            // Point 2: 5 mins ago
            Point point2 = Point.measurement("energy_usage")
                    .addTag("deviceId", String.valueOf(i))
                    .addField("energyConsumed", 15.2 + i)
                    .time(now.minusSeconds(300), WritePrecision.MS);
            
            points.add(point1);
            points.add(point2);
        }

        influxDBClient.getWriteApiBlocking().writePoints(bucket, org, points);
        System.out.println("Inserted 100 energy usage points for 50 devices.");
    }
}
