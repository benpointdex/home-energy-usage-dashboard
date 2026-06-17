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
public class IngestionServiceRoute {

    @Value("${services.ingestion-service.url:http://localhost:8082}")
    private String ingestionServiceUrl;

    @Bean
    public RouterFunction<ServerResponse> ingestionServiceRoutes(){
        return route("ingestion-service")
                .route(RequestPredicates.path("/api/v1/ingestion/**"), http())
                .before(uri(ingestionServiceUrl))
                .filter(CircuitBreakerFilterFunctions.circuitBreaker("ingestionServiceCircuitBreaker",
                        URI.create("forward:/fallback/ingestion"))
                )
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> ingestionFallbackRoutes(){
        return route("ingestionFallbackRoute")
                .route(RequestPredicates.path("/fallback/ingestion"),
                        request->ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
                                .body("ingestion service is down"))
                .build();
    }
}
