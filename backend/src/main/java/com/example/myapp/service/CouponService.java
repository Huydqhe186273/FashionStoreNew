package com.example.myapp.service;

import com.example.myapp.entity.DiscountCode;
import com.example.myapp.entity.User;
import com.example.myapp.model.CouponDTO;
import com.example.myapp.model.CreateCouponRequestDTO;
import com.example.myapp.repos.DiscountCodeRepository;
import com.example.myapp.repos.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CouponService {

    private final DiscountCodeRepository discountCodeRepository;
    private final UserRepository userRepository;

    public CouponService(DiscountCodeRepository discountCodeRepository, UserRepository userRepository) {
        this.discountCodeRepository = discountCodeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CouponDTO> getCoupons(String keyword, String discountType, String status) {
        List<DiscountCode> list = discountCodeRepository.findAllWithCreatedBy();

        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim().toLowerCase();
            list = list.stream()
                    .filter(c -> c.getCode() != null && c.getCode().toLowerCase().contains(kw))
                    .collect(Collectors.toList());
        }

        if (discountType != null && !discountType.trim().isEmpty()) {
            String type = discountType.trim().toLowerCase();
            list = list.stream()
                    .filter(c -> c.getDiscountType() != null && c.getDiscountType().equalsIgnoreCase(type))
                    .collect(Collectors.toList());
        }

        if (status != null && !status.trim().isEmpty()) {
            String st = status.trim().toLowerCase();
            if ("active".equals(st)) {
                list = list.stream().filter(this::isCouponActive).collect(Collectors.toList());
            } else if ("disabled".equals(st) || "inactive".equals(st)) {
                list = list.stream().filter(c -> !this.isCouponActive(c)).collect(Collectors.toList());
            }
        }

        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CouponDTO getCouponById(Integer id) {
        DiscountCode code = discountCodeRepository.findByIdWithCreatedBy(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã giảm giá với ID: " + id));
        return toDTO(code);
    }

    public CouponDTO createCoupon(CreateCouponRequestDTO dto) {
        validateRequest(dto, null);

        String cleanCode = dto.getCode().trim().toUpperCase();
        String cleanType = dto.getDiscountType().trim().toLowerCase();

        DiscountCode coupon = new DiscountCode();
        coupon.setCode(cleanCode);
        coupon.setDiscountType(cleanType);
        coupon.setValue(dto.getValue());
        coupon.setMinOrderValue(dto.getMinOrderValue());
        coupon.setStartDate(dto.getStartDate());
        coupon.setEndDate(dto.getEndDate());
        coupon.setUsageLimit(dto.getUsageLimit());

        // Respect explicit inactive state
        if (Boolean.FALSE.equals(dto.getActive())) {
            coupon.setEndDate(LocalDateTime.now().minusSeconds(1));
        }

        // Set creator
        User creator = resolveCurrentUser();
        coupon.setCreatedBy(creator);

        DiscountCode saved = discountCodeRepository.save(coupon);
        return toDTO(saved);
    }

    public CouponDTO updateCoupon(Integer id, CreateCouponRequestDTO dto) {
        DiscountCode coupon = discountCodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã giảm giá với ID: " + id));

        validateRequest(dto, id);

        String cleanCode = dto.getCode().trim().toUpperCase();
        String cleanType = dto.getDiscountType().trim().toLowerCase();

        coupon.setCode(cleanCode);
        coupon.setDiscountType(cleanType);
        coupon.setValue(dto.getValue());
        coupon.setMinOrderValue(dto.getMinOrderValue());
        coupon.setStartDate(dto.getStartDate());
        coupon.setEndDate(dto.getEndDate());
        coupon.setUsageLimit(dto.getUsageLimit());

        if (Boolean.FALSE.equals(dto.getActive())) {
            if (isCouponActive(coupon)) {
                coupon.setEndDate(LocalDateTime.now().minusSeconds(1));
            }
        } else if (Boolean.TRUE.equals(dto.getActive())) {
            if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(LocalDateTime.now())) {
                coupon.setEndDate(dto.getEndDate() != null && dto.getEndDate().isAfter(LocalDateTime.now()) ? dto.getEndDate() : null);
            }
        }

        DiscountCode updated = discountCodeRepository.save(coupon);
        return toDTO(updated);
    }

    public CouponDTO toggleCouponStatus(Integer id) {
        DiscountCode coupon = discountCodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã giảm giá với ID: " + id));

        if (isCouponActive(coupon)) {
            // Disable by setting EndDate to past
            coupon.setEndDate(LocalDateTime.now().minusSeconds(1));
        } else {
            // Enable by resetting EndDate
            coupon.setEndDate(null);
        }

        DiscountCode saved = discountCodeRepository.save(coupon);
        return toDTO(saved);
    }

    public CouponDTO disableCoupon(Integer id) {
        DiscountCode coupon = discountCodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã giảm giá với ID: " + id));

        coupon.setEndDate(LocalDateTime.now().minusSeconds(1));
        DiscountCode saved = discountCodeRepository.save(coupon);
        return toDTO(saved);
    }

    private void validateRequest(CreateCouponRequestDTO dto, Integer existingId) {
        if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã giảm giá (Code) không được để trống!");
        }

        String cleanCode = dto.getCode().trim().toUpperCase();

        if (existingId == null) {
            if (discountCodeRepository.existsByCodeIgnoreCase(cleanCode)) {
                throw new IllegalArgumentException("Mã giảm giá '" + cleanCode + "' đã tồn tại!");
            }
        } else {
            if (discountCodeRepository.existsByCodeIgnoreCaseAndDiscountCodeIdNot(cleanCode, existingId)) {
                throw new IllegalArgumentException("Mã giảm giá '" + cleanCode + "' đã tồn tại ở mã khác!");
            }
        }

        if (dto.getDiscountType() == null || dto.getDiscountType().trim().isEmpty()) {
            throw new IllegalArgumentException("Loại giảm giá (DiscountType) không được để trống!");
        }

        String cleanType = dto.getDiscountType().trim().toLowerCase();
        if (!"percent".equals(cleanType) && !"fixed".equals(cleanType)) {
            throw new IllegalArgumentException("Loại giảm giá chỉ được là 'percent' hoặc 'fixed'!");
        }

        if (dto.getValue() == null) {
            throw new IllegalArgumentException("Giá trị giảm giá không được để trống!");
        }

        if ("percent".equals(cleanType)) {
            if (dto.getValue().compareTo(BigDecimal.ONE) < 0 || dto.getValue().compareTo(new BigDecimal("100")) > 0) {
                throw new IllegalArgumentException("Giá trị phần trăm giảm giá phải từ 1 đến 100%!");
            }
        } else {
            if (dto.getValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Giá trị giảm giá cố định phải lớn hơn 0!");
            }
        }

        if (dto.getMinOrderValue() != null && dto.getMinOrderValue().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Giá trị đơn hàng tối thiểu không được âm!");
        }

        if (dto.getUsageLimit() != null && dto.getUsageLimit() < 0) {
            throw new IllegalArgumentException("Giới hạn số lần sử dụng không được âm!");
        }

        if (dto.getStartDate() != null && dto.getEndDate() != null && dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc không được trước ngày bắt đầu!");
        }
    }

    private boolean isCouponActive(DiscountCode coupon) {
        LocalDateTime now = LocalDateTime.now();
        boolean notExpired = (coupon.getEndDate() == null || coupon.getEndDate().isAfter(now));
        boolean notFuture = (coupon.getStartDate() == null || !coupon.getStartDate().isAfter(now));
        boolean hasLimit = (coupon.getUsageLimit() == null || coupon.getUsageLimit() > 0);
        return notExpired && notFuture && hasLimit;
    }

    private String determineStatus(DiscountCode coupon) {
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(now)) {
            return "disabled";
        }
        if (coupon.getStartDate() != null && coupon.getStartDate().isAfter(now)) {
            return "scheduled";
        }
        if (coupon.getUsageLimit() != null && coupon.getUsageLimit() <= 0) {
            return "exhausted";
        }
        return "active";
    }

    private User resolveCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().isEmpty() && !"anonymousUser".equals(auth.getName())) {
                User user = userRepository.findByEmail(auth.getName()).orElse(null);
                if (user != null) return user;
            }
        } catch (Exception ignored) {
        }

        // Fallback to first admin
        List<User> admins = userRepository.searchUsers(null, "admin", null);
        if (!admins.isEmpty()) {
            return admins.get(0);
        }

        // Fallback to any user
        return userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có người dùng nào để tạo mã giảm giá!"));
    }

    private CouponDTO toDTO(DiscountCode c) {
        long ordersCount = discountCodeRepository.countOrdersByDiscountCodeId(c.getDiscountCodeId());
        boolean active = isCouponActive(c);
        String status = determineStatus(c);

        return CouponDTO.builder()
                .discountCodeId(c.getDiscountCodeId())
                .code(c.getCode())
                .discountType(c.getDiscountType())
                .value(c.getValue())
                .minOrderValue(c.getMinOrderValue())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .usageLimit(c.getUsageLimit())
                .createdById(c.getCreatedBy() != null ? c.getCreatedBy().getUserId() : null)
                .createdByName(c.getCreatedBy() != null ? c.getCreatedBy().getFullName() : null)
                .active(active)
                .status(status)
                .ordersCount(ordersCount)
                .build();
    }
}
