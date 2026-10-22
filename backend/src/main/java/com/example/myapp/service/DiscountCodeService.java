package com.example.myapp.service;

import com.example.myapp.entity.DiscountCode;
import com.example.myapp.model.ApplyCouponResponseDTO;
import com.example.myapp.model.DiscountCodeDTO;
import com.example.myapp.repos.DiscountCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscountCodeService {

    private final DiscountCodeRepository discountCodeRepository;

    @Transactional(readOnly = true)
    public List<DiscountCodeDTO> getActiveCoupons() {
        LocalDateTime now = LocalDateTime.now();
        List<DiscountCode> list = discountCodeRepository.findActiveCoupons(now);
        return list.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApplyCouponResponseDTO validateAndApplyCoupon(String code, BigDecimal orderTotal) {
        if (code == null || code.trim().isEmpty()) {
            return ApplyCouponResponseDTO.builder()
                    .valid(false)
                    .message("Vui lòng nhập mã giảm giá.")
                    .build();
        }

        if (orderTotal == null || orderTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return ApplyCouponResponseDTO.builder()
                    .valid(false)
                    .message("Giá trị giỏ hàng không hợp lệ để áp dụng mã.")
                    .build();
        }

        DiscountCode discount = discountCodeRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (discount == null) {
            return ApplyCouponResponseDTO.builder()
                    .valid(false)
                    .message("Mã giảm giá không tồn tại.")
                    .build();
        }

        LocalDateTime now = LocalDateTime.now();
        if (discount.getStartDate() != null && now.isBefore(discount.getStartDate())) {
            return ApplyCouponResponseDTO.builder()
                    .valid(false)
                    .message("Mã giảm giá chưa đến thời gian áp dụng.")
                    .build();
        }

        if (discount.getEndDate() != null && now.isAfter(discount.getEndDate())) {
            return ApplyCouponResponseDTO.builder()
                    .valid(false)
                    .message("Mã giảm giá đã hết hạn sử dụng.")
                    .build();
        }

        if (discount.getUsageLimit() != null && discount.getUsageLimit() <= 0) {
            return ApplyCouponResponseDTO.builder()
                    .valid(false)
                    .message("Mã giảm giá đã hết lượt sử dụng.")
                    .build();
        }

        if (discount.getMinOrderValue() != null && orderTotal.compareTo(discount.getMinOrderValue()) < 0) {
            DecimalFormat df = new DecimalFormat("#,###₫");
            return ApplyCouponResponseDTO.builder()
                    .valid(false)
                    .message("Đơn hàng tối thiểu phải từ " + df.format(discount.getMinOrderValue()) + " để áp dụng mã này.")
                    .build();
        }

        BigDecimal discountAmount;
        if ("percent".equalsIgnoreCase(discount.getDiscountType())) {
            discountAmount = orderTotal.multiply(discount.getValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        } else {
            discountAmount = discount.getValue().min(orderTotal);
        }

        BigDecimal finalTotal = orderTotal.subtract(discountAmount).max(BigDecimal.ZERO);

        return ApplyCouponResponseDTO.builder()
                .valid(true)
                .code(discount.getCode())
                .discountType(discount.getDiscountType())
                .value(discount.getValue())
                .discountAmount(discountAmount)
                .finalTotal(finalTotal)
                .message("Áp dụng mã giảm giá thành công!")
                .build();
    }

    @Transactional
    public DiscountCode getAndValidateCouponEntity(String code, BigDecimal orderTotal) {
        if (code == null || code.trim().isEmpty()) {
            return null;
        }

        ApplyCouponResponseDTO validation = validateAndApplyCoupon(code, orderTotal);
        if (!validation.isValid()) {
            throw new RuntimeException(validation.getMessage());
        }

        return discountCodeRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new RuntimeException("Mã giảm giá không tồn tại."));
    }

    @Transactional
    public void consumeCoupon(DiscountCode discountCode) {
        if (discountCode != null && discountCode.getUsageLimit() != null && discountCode.getUsageLimit() > 0) {
            discountCode.setUsageLimit(discountCode.getUsageLimit() - 1);
            discountCodeRepository.save(discountCode);
        }
    }

    private DiscountCodeDTO mapToDTO(DiscountCode d) {
        DecimalFormat df = new DecimalFormat("#,###₫");
        String desc;
        if ("percent".equalsIgnoreCase(d.getDiscountType())) {
            desc = "Giảm " + d.getValue().intValue() + "%";
        } else {
            desc = "Giảm " + df.format(d.getValue());
        }

        if (d.getMinOrderValue() != null && d.getMinOrderValue().compareTo(BigDecimal.ZERO) > 0) {
            desc += " cho đơn từ " + df.format(d.getMinOrderValue());
        } else {
            desc += " cho mọi đơn hàng";
        }

        return DiscountCodeDTO.builder()
                .discountCodeId(d.getDiscountCodeId())
                .code(d.getCode())
                .discountType(d.getDiscountType())
                .value(d.getValue())
                .minOrderValue(d.getMinOrderValue())
                .startDate(d.getStartDate())
                .endDate(d.getEndDate())
                .usageLimit(d.getUsageLimit())
                .description(desc)
                .build();
    }
}
