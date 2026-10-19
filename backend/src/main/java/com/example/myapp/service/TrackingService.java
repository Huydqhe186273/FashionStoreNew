package com.example.myapp.service;

import com.example.myapp.entity.Product;
import com.example.myapp.entity.User;
import com.example.myapp.entity.UserBehaviorLog;
import com.example.myapp.model.BehaviorLogRequestDTO;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.UserBehaviorLogRepository;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrackingService {

    private final UserBehaviorLogRepository userBehaviorLogRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final UserPreferenceService userPreferenceService;

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public UserBehaviorLog logBehavior(BehaviorLogRequestDTO req) {
        if (req == null || req.getProductId() == null) {
            throw new IllegalArgumentException("ProductId is required for tracking behavior.");
        }

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + req.getProductId()));

        User user = null;
        if (req.getUserId() != null) {
            user = userRepository.findById(req.getUserId()).orElse(null);
        }

        String actionType = req.getActionType() == null ? "view" : req.getActionType().toLowerCase();
        // Validate against schema CHECK constraint ('view','search','click','add_to_cart','favorite','purchase')
        if (!actionType.matches("^(view|search|click|add_to_cart|favorite|purchase)$")) {
            actionType = "view";
        }

        UserBehaviorLog logEntry = new UserBehaviorLog();
        logEntry.setUser(user);
        logEntry.setSessionId(req.getSessionId());
        logEntry.setProduct(product);
        logEntry.setActionType(actionType);
        logEntry.setDurationSeconds(req.getDurationSeconds());
        logEntry.setCreatedAt(LocalDateTime.now());

        UserBehaviorLog saved = userBehaviorLogRepository.save(logEntry);

        // If view, increment product view count
        if ("view".equalsIgnoreCase(actionType)) {
            product.setViewCount(product.getViewCount() == null ? 1 : product.getViewCount() + 1);
            productRepository.save(product);
        }

        // If authenticated user, update preference profile
        if (user != null) {
            try {
                userPreferenceService.updatePreferences(user.getUserId());
            } catch (Exception e) {
                log.warn("Failed to update user preference profile for userId {}: {}", user.getUserId(), e.getMessage());
            }
        }

        return saved;
    }
}
