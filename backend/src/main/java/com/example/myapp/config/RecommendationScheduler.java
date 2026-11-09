package com.example.myapp.config;

import com.example.myapp.service.ProductSimilarityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Tính lại bảng ProductSimilarity:
 * - Lúc khởi động nếu bảng đang trống.
 * - Mỗi ngày lúc 03:00.
 */
@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class RecommendationScheduler {

    private final ProductSimilarityService productSimilarityService;

    @EventListener(ApplicationReadyEvent.class)
    public void computeOnStartupIfEmpty() {
        try {
            if (!productSimilarityService.hasPrecomputedData()) {
                productSimilarityService.computeAndStoreSimilarities();
            }
        } catch (Exception e) {
            log.warn("Không tính được ProductSimilarity lúc khởi động: {}", e.getMessage());
        }
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void recomputeNightly() {
        try {
            productSimilarityService.computeAndStoreSimilarities();
        } catch (Exception e) {
            log.warn("Lỗi tính lại ProductSimilarity: {}", e.getMessage());
        }
    }
}
