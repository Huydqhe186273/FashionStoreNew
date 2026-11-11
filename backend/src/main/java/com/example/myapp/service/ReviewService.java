package com.example.myapp.service;

import com.example.myapp.entity.OrderItem;
import com.example.myapp.entity.ProductImage;
import com.example.myapp.entity.Product;
import com.example.myapp.entity.Review;
import com.example.myapp.entity.User;
import com.example.myapp.model.ReviewDTO;
import com.example.myapp.model.ReviewableProductDTO;
import com.example.myapp.repos.OrderItemRepository;
import com.example.myapp.repos.ReviewRepository;
import com.example.myapp.repos.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> listByProduct(Integer productId) {
        List<ReviewDTO> reviews = reviewRepository.findReviewsByProductOrderByCreatedAtDesc(productId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        long count = reviewRepository.countReviewsByProduct(productId);
        Double avg = reviewRepository.averageRatingByProductId(productId);
        Map<Integer, Long> ratingBreakdown = new java.util.LinkedHashMap<>();
        for (int rating = 5; rating >= 1; rating--) {
            final int score = rating;
            ratingBreakdown.put(score, reviews.stream()
                .filter(review -> review.getRating() != null && review.getRating() == score)
                .count());
        }

        Map<String, Object> summary = new java.util.LinkedHashMap<>();
        summary.put("reviews", reviews);
        summary.put("count", count);
        summary.put("average", avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0);
        summary.put("ratingBreakdown", ratingBreakdown);
        return summary;
    }

    @Transactional(readOnly = true)
    public List<ReviewableProductDTO> listReviewableItems(Integer userId, Integer orderId) {
        List<OrderItem> orderItems = orderItemRepository.findReviewableItemsByUserId(userId, orderId);
        if (orderItems.isEmpty()) {
            return List.of();
        }

        // Lọc bỏ các đơn hàng đã bị hoàn hàng hoặc đang trong quy trình hoàn hàng
        orderItems = orderItems.stream()
                .filter(oi -> {
                    com.example.myapp.entity.Order order = oi.getOrder();
                    if (order == null) return false;
                    String oStatus = order.getOrderStatus() == null ? "" : order.getOrderStatus().toLowerCase();
                    if ("returned".equals(oStatus) || "cancelled".equals(oStatus)) {
                        return false;
                    }
                    if (order.getReturnRequests() != null) {
                        boolean hasReturn = order.getReturnRequests().stream().anyMatch(rr -> {
                            String s = rr.getStatus() == null ? "" : rr.getStatus().toLowerCase();
                            return "pending".equals(s) || "return_approved".equals(s) || "goods_received".equals(s) || "completed".equals(s) || "refunded".equals(s);
                        });
                        if (hasReturn) return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        if (orderItems.isEmpty()) {
            return List.of();
        }

        List<Integer> orderItemIds = orderItems.stream()
                .map(OrderItem::getOrderItemId)
                .collect(Collectors.toList());
        Map<Integer, Review> reviewsByOrderItemId = reviewRepository.findByOrderItemIdsAndUserId(orderItemIds, userId).stream()
                .filter(review -> review != null && review.getOrderItem() != null && review.getOrderItem().getOrderItemId() != null)
                .collect(Collectors.toMap(
                        review -> review.getOrderItem().getOrderItemId(),
                        Function.identity(),
                        (first, second) -> first.getCreatedAt() != null && second.getCreatedAt() != null
                                && first.getCreatedAt().isAfter(second.getCreatedAt()) ? first : second));

        return orderItems.stream().map(orderItem -> {
            if (orderItem.getVariant() == null || orderItem.getVariant().getProduct() == null) {
                return null;
            }
            Product product = orderItem.getVariant().getProduct();
            ProductImage image = null;
            if (product.getProductImages() != null && !product.getProductImages().isEmpty()) {
                image = product.getProductImages().stream()
                        .filter(candidate -> Boolean.TRUE.equals(candidate.getIsPrimary()))
                        .findFirst()
                        .orElseGet(() -> product.getProductImages().get(0));
            }
            Review review = reviewsByOrderItemId.get(orderItem.getOrderItemId());

            return ReviewableProductDTO.builder()
                    .orderId(orderItem.getOrder() != null ? orderItem.getOrder().getOrderId() : null)
                    .orderItemId(orderItem.getOrderItemId())
                    .productId(product.getProductId())
                    .productName(product.getName())
                    .imageUrl(image != null ? image.getImageUrl() : null)
                    .color(orderItem.getVariant().getColor())
                    .size(orderItem.getVariant().getSize())
                    .quantity(orderItem.getQuantity())
                    .rating(review != null ? review.getRating() : null)
                    .comment(review != null ? review.getComment() : null)
                    .reviewedAt(review != null ? review.getCreatedAt() : null)
                    .build();
        })
        .filter(java.util.Objects::nonNull)
        .collect(Collectors.toList());
    }

    @Transactional
    public ReviewDTO create(Integer userId, Integer orderItemId, Integer rating, String comment) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating phải từ 1 đến 5");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng ID: " + userId));
        OrderItem orderItem = orderItemRepository.findReviewableItemByIdAndUserId(orderItemId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Chỉ có thể đánh giá sản phẩm thuộc đơn đã xác nhận và thanh toán của bạn"));

        if (orderItem.getVariant() == null || orderItem.getVariant().getProduct() == null) {
            throw new IllegalArgumentException("Không tìm thấy thông tin sản phẩm của đơn hàng này.");
        }

        com.example.myapp.entity.Order order = orderItem.getOrder();
        if (order != null) {
            String oStatus = order.getOrderStatus() == null ? "" : order.getOrderStatus().toLowerCase();
            if ("returned".equals(oStatus) || "cancelled".equals(oStatus)) {
                throw new IllegalArgumentException("Đơn hàng này đã hoàn trả hoặc bị hủy, không thể đánh giá.");
            }
            if (order.getReturnRequests() != null) {
                boolean hasReturn = order.getReturnRequests().stream().anyMatch(rr -> {
                    String s = rr.getStatus() == null ? "" : rr.getStatus().toLowerCase();
                    return "pending".equals(s) || "return_approved".equals(s) || "goods_received".equals(s) || "completed".equals(s) || "refunded".equals(s);
                });
                if (hasReturn) {
                    throw new IllegalArgumentException("Đơn hàng đã yêu cầu trả hàng / hoàn tiền, không thể gửi đánh giá.");
                }
            }
        }

        if (reviewRepository.existsByOrderItemIdAndUserId(orderItemId, userId)) {
            throw new IllegalArgumentException("Bạn đã đánh giá sản phẩm này rồi");
        }

        String cleanComment = (comment != null && !comment.trim().isEmpty()) ? comment.trim() : null;

        Review r = new Review();
        r.setUser(user);
        r.setProduct(orderItem.getVariant().getProduct());
        r.setOrderItem(orderItem);
        r.setRating(rating);
        r.setComment(cleanComment);
        r.setCreatedAt(LocalDateTime.now());

        return toDTO(reviewRepository.save(r));
    }

    @Transactional
    public ReviewDTO update(Integer reviewId, Integer userId, Integer rating, String comment) {
        Review r = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá ID: " + reviewId));
        if (r.getUser() == null || !r.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền sửa đánh giá này");
        }
        if (r.getOrderItem() != null && r.getOrderItem().getOrder() != null) {
            String oStatus = r.getOrderItem().getOrder().getOrderStatus() == null ? "" : r.getOrderItem().getOrder().getOrderStatus().toLowerCase();
            if ("returned".equals(oStatus) || "cancelled".equals(oStatus)) {
                throw new IllegalArgumentException("Đơn hàng đã hoàn trả hoặc bị hủy, không thể chỉnh sửa đánh giá.");
            }
        }
        if (rating != null) {
            if (rating < 1 || rating > 5) throw new IllegalArgumentException("Rating phải từ 1 đến 5");
            r.setRating(rating);
        }
        if (comment != null) {
            String cleanComment = !comment.trim().isEmpty() ? comment.trim() : null;
            r.setComment(cleanComment);
        }
        return toDTO(reviewRepository.save(r));
    }

    @Transactional
    public void delete(Integer reviewId, Integer userId) {
        Review r = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá ID: " + reviewId));
        if (r.getUser() == null || !r.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa đánh giá này");
        }
        reviewRepository.delete(r);
    }

    private ReviewDTO toDTO(Review r) {
        String authorName = null;
        if (r.getUser() != null) {
            if (r.getUser().getFullName() != null && !r.getUser().getFullName().isBlank()) {
                authorName = r.getUser().getFullName();
            } else if (r.getUser().getEmail() != null && !r.getUser().getEmail().isBlank()) {
                authorName = r.getUser().getEmail();
            } else {
                authorName = "Khách hàng #" + r.getUser().getUserId();
            }
        }

        return ReviewDTO.builder()
                .reviewId(r.getReviewId())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .userId(r.getUser() != null ? r.getUser().getUserId() : null)
                .userName(authorName)
                .productId(r.getProduct() != null ? r.getProduct().getProductId() : null)
                .orderItemId(r.getOrderItem() != null ? r.getOrderItem().getOrderItemId() : null)
                .build();
    }
}
