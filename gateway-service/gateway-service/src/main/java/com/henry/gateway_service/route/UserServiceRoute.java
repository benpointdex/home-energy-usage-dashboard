package com.henry.gateway_service.route;

import org.springframework.cloud.gateway.server.mvc.filter.CircuitBreakerFilterFunctions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import java.net.URI;

import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.uri;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;


@Configuration
public class UserServiceRoute {

    @Bean
    public RouterFunction<ServerResponse> userServiceRoutes(){
        return route("user-service")
                .route(RequestPredicates.path("/api/v1/user/**"),http())
                .before(uri("http://localhost:8080"))
                .filter(CircuitBreakerFilterFunctions.circuitBreaker("userServiceCircuitBreaker",
                        URI.create("forward:/fallback/user"))
                )
                .build();

    }
    @Bean
    public RouterFunction<ServerResponse> userFallbackRoutes(){
        return route("userFallbackRoute")
                .route(RequestPredicates.path("/fallback/user"),
        request->ServerResponse.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("User service is down"))
        .build();
    }

}
