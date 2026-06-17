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
public class AlertServiceRoute {

    @Value("${services.alert-service.url:http://localhost:8084}")
    private String alertServiceUrl;

    @Bean
    public RouterFunction<ServerResponse> alertServiceRoutes(){
        return route("alert-service")
                .route(RequestPredicates.path("/api/v1/alert/**"), http())
                .before(uri(alertServiceUrl))
                .filter(CircuitBreakerFilterFunctions.circuitBreaker("alertServiceCircuitBreaker",
                        URI.create("forward:/fallback/alert"))
                )
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> alertFallbackRoutes(){
        return route("alertFallbackRoute")
                .route(RequestPredicates.path("/fallback/alert"),
                        request->ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
                                .body("alert service is down"))
                .build();
    }
}
