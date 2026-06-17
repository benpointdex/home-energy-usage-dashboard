package com.henry.gateway_service.route;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.server.mvc.filter.CircuitBreakerFilterFunctions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import java.net.URI;

import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.uri;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;

@Configuration
public class DeviceServiceRoute {

    @Value("${services.device-service.url:http://localhost:8081}")
    private String deviceServiceUrl;

    @Bean
    public RouterFunction<ServerResponse> deviceServiceRoutes(){
        return route("device-service")
                .route(RequestPredicates.path("/api/v1/device/**"), http())
                .before(uri(deviceServiceUrl))
                .filter(CircuitBreakerFilterFunctions.circuitBreaker("deviceServiceCircuitBreaker",
                        URI.create("forward:/fallback/device"))
                )
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> deviceFallbackRoutes(){
        return route("deviceFallbackRoute")
                .route(RequestPredicates.path("/fallback/device"),
                        request->ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
                                .body("device service is down"))
                .build();
    }
}
