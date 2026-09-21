package com.example.myapp.service;

import com.example.myapp.entity.OrderItem;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.Review;
import com.example.myapp.entity.User;
import com.example.myapp.model.ReviewDTO;
import com.example.myapp.repos.OrderItemRepository;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.ReviewRepository;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> listByProduct(Integer productId) {
        List<ReviewDTO> reviews = reviewRepository.findByProduct_ProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        long count = reviewRepository.countByProduct_ProductId(productId);
        Double avg = reviewRepository.averageRatingByProductId(productId);

        Map<String, Object> summary = new java.util.LinkedHashMap<>();
        summary.put("reviews", reviews);
        summary.put("count", count);
        summary.put("average", avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0);
        return summary;
    }

    @Transactional
    public ReviewDTO create(Integer userId, Integer productId, Integer orderItemId, Integer rating, String comment) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating phải từ 1 đến 5");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng ID: " + userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + productId));
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderItemId));

        Review r = new Review();
        r.setUser(user);
        r.setProduct(product);
        r.setOrderItem(orderItem);
        r.setRating(rating);
        r.setComment(comment);
        r.setCreatedAt(LocalDateTime.now());

        return toDTO(reviewRepository.save(r));
    }

    @Transactional
    public ReviewDTO update(Integer reviewId, Integer userId, Integer rating, String comment) {
        Review r = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá ID: " + reviewId));
        if (!r.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền sửa đánh giá này");
        }
        if (rating != null) {
            if (rating < 1 || rating > 5) throw new IllegalArgumentException("Rating phải từ 1 đến 5");
            r.setRating(rating);
        }
        if (comment != null) r.setComment(comment);
        return toDTO(reviewRepository.save(r));
    }

    @Transactional
    public void delete(Integer reviewId, Integer userId) {
        Review r = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá ID: " + reviewId));
        if (!r.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa đánh giá này");
        }
        reviewRepository.delete(r);
    }

    private ReviewDTO toDTO(Review r) {
        return ReviewDTO.builder()
                .reviewId(r.getReviewId())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .userId(r.getUser() != null ? r.getUser().getUserId() : null)
                .userName(r.getUser() != null ? r.getUser().getFullName() : null)
                .productId(r.getProduct() != null ? r.getProduct().getProductId() : null)
                .orderItemId(r.getOrderItem() != null ? r.getOrderItem().getOrderItemId() : null)
                .build();
    }
}
