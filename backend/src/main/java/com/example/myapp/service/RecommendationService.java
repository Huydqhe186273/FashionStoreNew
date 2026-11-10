package com.example.myapp.service;

import com.example.myapp.entity.Product;
import com.example.myapp.entity.ProductVariant;
import com.example.myapp.model.CustomerProductDTO;
import com.example.myapp.model.RecommendationResponseDTO;
import com.example.myapp.model.UserPreferenceDTO;
import com.example.myapp.repos.OrderItemRepository;
import com.example.myapp.repos.ProductRepository;
import com.example.myapp.repos.ProductVariantRepository;
import com.example.myapp.repos.RecommendationRepository;
import com.example.myapp.repos.UserBehaviorLogRepository;
import com.example.myapp.repos.UserPreferenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    /** Số sản phẩm gợi ý tối đa cho 1 request (chống client truyền limit quá lớn). */
    static final int MAX_LIMIT = 30;

    private final ProductRepository productRepository;               // lấy sản phẩm ứng viên
    private final ProductVariantRepository productVariantRepository; // lấy variant (màu, size, tồn kho)
    private final OrderItemRepository orderItemRepository;           // lấy sản phẩm user đã mua
    private final UserPreferenceService userPreferenceService;       // tính hồ sơ sở thích
    private final CustomerProductService customerProductService;     // Product → DTO, bán chạy, hàng mới
    // 3 repository dưới chỉ dùng cho chức năng Reset AI
    private final UserBehaviorLogRepository userBehaviorLogRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final RecommendationRepository recommendationRepository;

    /**
     * Gợi ý "Dành cho bạn" cho trang chủ.
     *
     * @param userId    id user lấy từ JWT, {@code null} nếu là khách vãng lai
     * @param sessionId mã phiên trình duyệt (localStorage 'fs_session_id'), có thể null
     * @param limit     số sản phẩm muốn lấy (sẽ bị kẹp vào khoảng 1..30)
     * @return source = "personalized" (có kèm danh mục làm lý do) hoặc "cold_start"
     */
    @Transactional(readOnly = true) // chỉ đọc DB; giữ Hibernate session mở để đọc quan hệ lazy (Category, Parent)
    public RecommendationResponseDTO getPersonalizedRecommendations(Integer userId, String sessionId, int limit) {
        // ---- BƯỚC 0: Chuẩn hoá limit về khoảng [1, 30] ----
        int safeLimit = clampLimit(limit);

        // ---- BƯỚC 1: Lấy hồ sơ sở thích ----
        // Tính trực tiếp từ tối đa 100 log hành vi trong 30 ngày gần nhất
        // (user: log theo UserId + log theo sessionId hiện tại; khách: chỉ theo sessionId).
        // Trả về null nếu chưa có hành vi nào đủ ý nghĩa (ví dụ chỉ xem < 5 giây).
        UserPreferenceDTO pref = userPreferenceService.getPreferences(userId, sessionId);

        // ---- BƯỚC 2: Danh sách sản phẩm cần loại trừ ----
        // Ban đầu = các sản phẩm user đã mua (bỏ qua đơn đã huỷ). Khách vãng lai thì rỗng.
        // Tập này sẽ được bổ sung dần các sản phẩm đã chọn để phần bù cold-start không bị trùng.
        Set<Integer> excluded = userId != null
                ? new HashSet<>(orderItemRepository.findPurchasedProductIdsByUserId(userId))
                : new HashSet<>();

        // ---- BƯỚC 3: Chưa có hồ sơ → COLD-START ----
        if (pref == null || pref.getPreferredCategoryIds() == null || pref.getPreferredCategoryIds().isEmpty()) {
            return RecommendationResponseDTO.builder()
                    .source("cold_start")             // frontend hiện câu "Xem thêm vài sản phẩm..."
                    .basedOnCategories(List.of())
                    .products(coldStart(safeLimit, excluded))
                    .build();
        }

        // ---- BƯỚC 4a: Lấy dữ liệu ứng viên (chỉ 2 query, tránh N+1) ----
        List<Integer> categoryIds = pref.getPreferredCategoryIds(); // tối đa 5 danh mục, đã xếp hạng

        // Toàn bộ variant của các danh mục ưa thích, gom theo productId:
        //   { 101 → [Đen-M, Đen-L, Trắng-M], 102 → [Xanh-32], ... }
        Map<Integer, List<ProductVariant>> variantsByProduct = productVariantRepository
                .findByCategoryIdIn(categoryIds).stream()
                .collect(Collectors.groupingBy(v -> v.getProduct().getProductId()));

        // ---- BƯỚC 4b + 4c: Lọc và chấm điểm từng sản phẩm ----
        List<ScoredProduct> scored = new ArrayList<>();
        // findActiveByCategoryIds: Status = active, IsTest = false, thuộc danh mục ưa thích
        for (Product p : productRepository.findActiveByCategoryIds(categoryIds)) {
            // Lọc 1: đã mua rồi thì không gợi ý lại
            if (excluded.contains(p.getProductId())) continue;

            // Lọc 2: tổng tồn kho các variant = 0 (hết hàng hoặc chưa có variant) → bỏ
            List<ProductVariant> variants = variantsByProduct.getOrDefault(p.getProductId(), List.of());
            if (totalStock(variants) <= 0) continue;

            // Chấm điểm: so sản phẩm với hồ sơ (danh mục, giá, màu, size, độ phổ biến)
            scored.add(new ScoredProduct(p, scoreProduct(p, colorsOf(variants), sizesOf(variants), pref)));
        }
        // Điểm cao nhất lên đầu
        scored.sort(Comparator.comparingDouble(ScoredProduct::score).reversed());

        // ---- BƯỚC 4d: Lấy top safeLimit, chuyển sang DTO để trả về frontend ----
        List<CustomerProductDTO> result = new ArrayList<>();
        for (ScoredProduct sp : scored) {
            if (result.size() >= safeLimit) break;
            // mapToDTO chỉ gọi cho sản phẩm ĐƯỢC CHỌN (nạp ảnh, rating, size/màu có sẵn...)
            result.add(customerProductService.mapToDTO(sp.product(), false));
            // Đánh dấu đã chọn để phần bù cold-start bên dưới không lặp lại sản phẩm này
            excluded.add(sp.product().getProductId());
        }

        // Bù thêm bằng cold-start nếu danh mục ưa thích có ít sản phẩm
        // Ví dụ: limit = 8, danh mục "Áo thun nam" chỉ có 3 sản phẩm còn hàng
        //        → 3 sản phẩm cá nhân hoá + 5 sản phẩm bán chạy / hàng mới
        if (result.size() < safeLimit) {
            result.addAll(coldStart(safeLimit - result.size(), excluded));
        }

        // ---- BƯỚC 5: Trả kết quả ----
        return RecommendationResponseDTO.builder()
                .source("personalized")
                // Tên danh mục ưa thích → frontend hiện "Vì bạn quan tâm Áo thun nam, ..."
                .basedOnCategories(pref.getPreferredCategoryNames())
                .products(result)
                .build();
    }

    /**
     * API công khai GET /api/recommendations/cold-start.
     * Frontend gọi khi API /personalized bị lỗi (phương án dự phòng).
     */
    @Transactional(readOnly = true)
    public List<CustomerProductDTO> getColdStartRecommendations(int limit) {
        return coldStart(clampLimit(limit), Set.of());
    }

    /**
     * COLD-START: gợi ý cho người chưa có dữ liệu hành vi.
     * Xen kẽ 1 sản phẩm bán chạy, 1 hàng mới, 1 bán chạy, 1 hàng mới...
     * để danh sách vừa có hàng "chắc ăn" (bán chạy) vừa có hàng mới lạ.
     *
     * Ví dụ: bestsellers = [A, B, C], newest = [D, A, E], limit = 4
     *   i=0: thêm A (bán chạy), thêm D (mới)
     *   i=1: thêm B (bán chạy), A đã có → bỏ
     *   i=2: thêm C → đủ 4 → dừng. Kết quả: [A, D, B, C]
     *
     * @param limit    số sản phẩm cần lấy
     * @param excluded các productId không được xuất hiện (đã mua / đã có trong kết quả)
     */
    private List<CustomerProductDTO> coldStart(int limit, Set<Integer> excluded) {
        if (limit <= 0) return new ArrayList<>();
        // Lấy dư để còn đủ sau khi loại các sản phẩm đã có / đã mua
        // (trường hợp xấu nhất: mọi sản phẩm bị loại đều nằm trong danh sách lấy về)
        int fetch = Math.min(50, limit + excluded.size());
        List<CustomerProductDTO> bestsellers = customerProductService.getBestsellers(fetch); // theo SoldCount giảm dần
        List<CustomerProductDTO> newest = customerProductService.getNewProducts(fetch);     // theo CreatedAt giảm dần

        // LinkedHashMap: giữ thứ tự thêm vào và tự loại trùng theo productId
        Map<Integer, CustomerProductDTO> merged = new LinkedHashMap<>();
        int maxLen = Math.max(bestsellers.size(), newest.size());
        for (int i = 0; i < maxLen && merged.size() < limit; i++) {
            addIfAllowed(merged, i < bestsellers.size() ? bestsellers.get(i) : null, excluded, limit);
            addIfAllowed(merged, i < newest.size() ? newest.get(i) : null, excluded, limit);
        }
        return new ArrayList<>(merged.values());
    }

    /** Thêm dto vào kết quả cold-start nếu: chưa đủ limit, không bị loại trừ, chưa có trong danh sách. */
    private static void addIfAllowed(Map<Integer, CustomerProductDTO> merged, CustomerProductDTO dto,
                                     Set<Integer> excluded, int limit) {
        if (dto == null || merged.size() >= limit || excluded.contains(dto.getProductId())) return;
        merged.putIfAbsent(dto.getProductId(), dto);
    }

    /**
     * Điểm phù hợp của một sản phẩm với hồ sơ sở thích (càng cao càng phù hợp):
     * <ul>
     *   <li>Danh mục: hạng 1 = 50, hạng 2 = 40, ... tối thiểu 10</li>
     *   <li>Giá trong khoảng ưa thích = 25, lệch tối đa 25% = 15</li>
     *   <li>Có màu ưa thích = 15, có size ưa thích = 10</li>
     *   <li>Độ phổ biến: đã bán (tối đa 10) + lượt xem (tối đa 5)</li>
     * </ul>
     * Tổng tối đa = 50 + 25 + 15 + 10 + 10 + 5 = 115 điểm.
     *
     * Ví dụ: hồ sơ { danh mục [Áo thun nam, Quần jean], giá 249k–450k, màu [Đen], size [M] }
     *   - Áo thun nam, 300k, có Đen, có M, đã bán 40, 100 lượt xem:
     *       50 + 25 + 15 + 10 + 4 + 2 = 106
     *   - Quần jean, 500k (vượt max 11%), màu Xanh, size 32:
     *       40 + 15 + 0 + 0 + ... = 55+
     *
     * Hàm static, không đụng DB → dễ unit test (xem RecommendationModuleTest).
     *
     * @param colors tập màu sản phẩm có (từ các variant)
     * @param sizes  tập size sản phẩm có (từ các variant)
     */
    static double scoreProduct(Product p, Set<String> colors, Set<String> sizes, UserPreferenceDTO pref) {
        double score = 0.0;

        // (1) DANH MỤC — tiêu chí nặng nhất.
        // indexOf trả về vị trí trong danh sách đã xếp hạng: 0 = thích nhất.
        // rank 0 → 50, rank 1 → 40, rank 2 → 30, rank 3 → 20, rank 4 → 10 (không thấp hơn 10).
        if (p.getCategory() != null && pref.getPreferredCategoryIds() != null) {
            int rank = pref.getPreferredCategoryIds().indexOf(p.getCategory().getCategoryId());
            if (rank >= 0) {
                score += Math.max(10.0, 50.0 - rank * 10.0);
            }
        }

        // (2) GIÁ — dùng giá hiệu lực (giá giảm nếu có, không thì giá gốc).
        BigDecimal price = UserPreferenceService.effectivePrice(p);
        BigDecimal min = pref.getPreferredPriceMin();
        BigDecimal max = pref.getPreferredPriceMax();
        if (price.compareTo(BigDecimal.ZERO) > 0 && min != null && max != null) {
            if (price.compareTo(min) >= 0 && price.compareTo(max) <= 0) {
                // Nằm gọn trong khoảng giá hay xem: min ≤ giá ≤ max
                score += 25.0;
            } else if (price.compareTo(min.multiply(BigDecimal.valueOf(0.75))) >= 0
                    && price.compareTo(max.multiply(BigDecimal.valueOf(1.25))) <= 0) {
                // Lệch nhẹ: trong khoảng nới rộng [min × 0.75, max × 1.25]
                // Ví dụ khoảng 200k–400k → nới thành 150k–500k
                score += 15.0;
            }
            // Lệch nhiều hơn → 0 điểm giá
        }

        // (3) MÀU — sản phẩm có ÍT NHẤT 1 màu nằm trong top màu ưa thích
        if (pref.getPreferredColors() != null && pref.getPreferredColors().stream().anyMatch(colors::contains)) {
            score += 15.0;
        }
        // (4) SIZE — sản phẩm có ÍT NHẤT 1 size nằm trong top size ưa thích
        if (pref.getPreferredSizes() != null && pref.getPreferredSizes().stream().anyMatch(sizes::contains)) {
            score += 10.0;
        }

        // (5) ĐỘ PHỔ BIẾN — điểm phụ, chủ yếu để phân thứ hạng giữa các sản phẩm đồng điểm.
        // Đã bán: 0.1 điểm / sản phẩm, tối đa 10 (từ 100 sản phẩm trở lên)
        // Lượt xem: 0.02 điểm / lượt, tối đa 5 (từ 250 lượt trở lên)
        if (p.getSoldCount() != null) score += Math.min(10.0, p.getSoldCount() * 0.1);
        if (p.getViewCount() != null) score += Math.min(5.0, p.getViewCount() * 0.02);

        return score;
    }

    /**
     * Xoá toàn bộ dữ liệu hành vi dùng cho gợi ý (nút "Reset AI" để demo).
     *
     * Được gọi từ: Home.jsx (nút "🔄 Reset AI") → DELETE /api/recommendations/reset?sessionId=...
     * userId lấy từ JWT nên người dùng chỉ xoá được dữ liệu của chính mình.
     * Sau khi xoá, lần gọi gợi ý tiếp theo sẽ trả về cold-start.
     */
    @Transactional
    public void resetUserAIHistory(Integer userId, String sessionId) {
        if (userId != null) {
            userBehaviorLogRepository.deleteByUserUserId(userId); // log hành vi của tài khoản
            userPreferenceRepository.deleteByUserId(userId);      // bảng cũ, không còn ghi nhưng dọn cho sạch
            recommendationRepository.deleteByUserUserId(userId);  // bảng cũ, không còn ghi nhưng dọn cho sạch
            log.info("Reset recommendation history for userId={}", userId);
        }
        if (sessionId != null && !sessionId.isBlank()) {
            userBehaviorLogRepository.deleteBySessionId(sessionId); // log hành vi của trình duyệt hiện tại
            recommendationRepository.deleteBySessionId(sessionId);
            log.info("Reset recommendation history for sessionId={}", sessionId);
        }
    }

    // ======================= HÀM TIỆN ÍCH (static, dùng chung với ProductSimilarityService) =======================

    /** Kẹp limit vào khoảng [1, MAX_LIMIT]: limit = 0 → 1, limit = 100 → 30. */
    private static int clampLimit(int limit) {
        return Math.max(1, Math.min(limit, MAX_LIMIT));
    }

    /** Tổng tồn kho của các variant (null tính là 0). */
    static int totalStock(List<ProductVariant> variants) {
        return variants.stream().mapToInt(v -> v.getStockQuantity() == null ? 0 : v.getStockQuantity()).sum();
    }

    /** Tập màu (không trùng) của các variant. Ví dụ [Đen-M, Đen-L, Trắng-M] → {Đen, Trắng}. */
    static Set<String> colorsOf(List<ProductVariant> variants) {
        return variants.stream().map(ProductVariant::getColor).filter(Objects::nonNull)
                .map(String::trim).collect(Collectors.toSet());
    }

    /** Tập size (không trùng) của các variant. Ví dụ [Đen-M, Đen-L, Trắng-M] → {M, L}. */
    static Set<String> sizesOf(List<ProductVariant> variants) {
        return variants.stream().map(ProductVariant::getSize).filter(Objects::nonNull)
                .map(String::trim).collect(Collectors.toSet());
    }

    /** Cặp (sản phẩm, điểm) dùng tạm khi sắp xếp. */
    private record ScoredProduct(Product product, double score) {}
}
