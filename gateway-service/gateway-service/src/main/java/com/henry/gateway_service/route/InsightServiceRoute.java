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
public class InsightServiceRoute {

    @Value("${services.insight-service.url:http://localhost:8085}")
    private String insightServiceUrl;

    @Bean
    public RouterFunction<ServerResponse> insightServiceRoutes(){
        return route("insight-service")
                .route(RequestPredicates.path("/api/v1/insight/**"), http())
                .before(uri(insightServiceUrl))
                .filter(CircuitBreakerFilterFunctions.circuitBreaker("insightServiceCircuitBreaker",
                        URI.create("forward:/fallback/insight"))
                )
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> insightFallbackRoutes(){
        return route("insightFallbackRoute")
                .route(RequestPredicates.path("/fallback/insight"),
                        request->ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
                                .body("insight service is down"))
                .build();
    }
}
