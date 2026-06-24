package com.henry.insight_service.service;

import com.henry.insight_service.client.UsageClient;
import com.henry.insight_service.dto.DeviceDto;
import com.henry.insight_service.dto.InsightDto;
import com.henry.insight_service.dto.UsageDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

@Slf4j
@Service
public class InsightService {

    private final UsageClient usageClient;
    private OllamaChatModel ollamaChatModel;

    public InsightService(UsageClient usageClient,
                          OllamaChatModel ollamaChatModel) {
        this.usageClient = usageClient;
        this.ollamaChatModel = ollamaChatModel;
    }

    // ─────────────────────────────────────────────────────────────
    // Existing blocking endpoints (kept for batch / background use)
    // ─────────────────────────────────────────────────────────────

    public InsightDto getSavingsTips(Long userId) {
        // Fetch data from Usage Service
        final UsageDto usageData = usageClient.getXDaysUsageForUser(userId, 3);

        double totalUsage = usageData.devices().stream()
                .mapToDouble(DeviceDto::energyConsumed)
                .sum();

        log.info("Calling Ollama for userId {} with total usage {}",
                userId, totalUsage);

        String prompt = "You are a professional Energy Efficiency Advisor. " +
                "I will provide my recent home energy consumption data. " +
                "Analyze it and provide specific, actionable energy-saving tips. " +
                "Also, briefly compare this to an average household (approx. 30 kWh/day). " +
                "Total energy used in the past 3 days (in kWh): " + totalUsage;

        ChatResponse response = ollamaChatModel.call(
                Prompt.builder()
                        .content(prompt)
                        .build());

        return InsightDto.builder()
                .userId(userId)
                .tips(response.getResult().getOutput().getText())
                .energyUsage(totalUsage)
                .build();
    }

    public InsightDto getOverview(Long userId) {
        // Fetch data from Usage Service
        final UsageDto usageData = usageClient.getXDaysUsageForUser(userId, 3);

        double totalUsage = usageData.devices().stream()
                .mapToDouble(DeviceDto::energyConsumed)
                .sum();

        log.info("Calling Ollama for userId {} with total usage {}",
                userId, totalUsage);

        String prompt = "You are a professional Energy Efficiency Advisor. " +
                "Analyse the following aggregate energy usage data for the past 3 days and provide a " +
                "concise overview with actionable insights for the user. " +
                "Usage Data: \n" + usageData.devices();

        ChatResponse response = ollamaChatModel.call(
                Prompt.builder()
                        .content(prompt)
                        .build());

        return InsightDto.builder()
                .userId(userId)
                .tips(response.getResult().getOutput().getText())
                .energyUsage(totalUsage)
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // GAP-05: Streaming variants — returns Flux<String> for SSE
    // Tokens are emitted as the LLM generates them, avoiding the
    // 5-60s silent wait of the blocking endpoints.
    // ─────────────────────────────────────────────────────────────

    public Flux<java.util.Map<String, String>> getSavingTipsStream(Long userId) {
        // Fetch usage synchronously first (fast — <1s)
        UsageDto usage = usageClient.getXDaysUsageForUser(userId, 3);
        double total = usage == null || usage.devices() == null
                ? 0.0
                : usage.devices().stream()
                  .mapToDouble(DeviceDto::energyConsumed)
                  .sum();

        String promptText = "You are a professional Energy Efficiency Advisor. " +
                "I will provide my recent home energy consumption data. " +
                "Analyze it and provide specific, actionable energy-saving tips. " +
                "Also, briefly compare this to an average household (approx. 30 kWh/day). " +
                "Total energy used in the past 3 days (in kWh): " + total;

        log.info("Streaming Ollama saving-tips for userId {} (total={})", userId, total);

        // stream() returns Flux<ChatResponse> — map each token chunk to its text
        return ollamaChatModel.stream(new Prompt(promptText))
                .map(response -> response.getResult().getOutput().getText())
                .filter(text -> text != null && !text.isEmpty())
                .map(text -> java.util.Map.of("text", text));
    }

    public Flux<java.util.Map<String, String>> getOverviewStream(Long userId) {
        UsageDto usage = usageClient.getXDaysUsageForUser(userId, 3);

        String promptText = "You are a professional Energy Efficiency Advisor. " +
                "Analyse the following aggregate energy usage data for the past 3 days and provide a " +
                "concise overview with actionable insights for the user. " +
                "Usage Data: " + (usage.devices() == null ? "[]" : usage.devices().toString());

        log.info("Streaming Ollama overview for userId {}", userId);

        return ollamaChatModel.stream(new Prompt(promptText))
                .map(response -> response.getResult().getOutput().getText())
                .filter(text -> text != null && !text.isEmpty())
                .map(text -> java.util.Map.of("text", text));
    }
}