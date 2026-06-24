package com.henry.insight_service.controller;

import com.henry.insight_service.dto.InsightDto;
import com.henry.insight_service.service.InsightService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/v1/insight")
public class InsightController {

    private final InsightService insightService;

    public InsightController(InsightService insightService) {
        this.insightService = insightService;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Blocking endpoints — full response returned after LLM finishes (5-60s)
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping("/saving-tips/{userId}")
    public ResponseEntity<InsightDto> getSavingTips(@PathVariable Long userId) {
        final InsightDto insight = insightService.getSavingsTips(userId);
        return ResponseEntity.ok(insight);
    }

    @GetMapping("/overview/{userId}")
    public ResponseEntity<InsightDto> getOverview(@PathVariable Long userId) {
        final InsightDto insight = insightService.getOverview(userId);
        return ResponseEntity.ok(insight);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GAP-05: Streaming SSE endpoints — tokens arrive progressively
    // Client receives Server-Sent Events as the LLM generates them.
    // Use: EventSource or fetch() with ReadableStream in browser
    // curl: curl -N http://localhost:9000/api/v1/insight/saving-tips/1/stream -H "Authorization: Bearer <token>"
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping(value = "/saving-tips/{userId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<java.util.Map<String, String>> getSavingTipsStream(@PathVariable Long userId) {
        return insightService.getSavingTipsStream(userId);
    }

    @GetMapping(value = "/overview/{userId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<java.util.Map<String, String>> getOverviewStream(@PathVariable Long userId) {
        return insightService.getOverviewStream(userId);
    }
}