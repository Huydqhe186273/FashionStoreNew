package com.example.myapp.service;

import com.example.myapp.entity.*;
import com.example.myapp.model.*;
import com.example.myapp.repos.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InboundOrderService {

    private final InboundOrderRepository inboundOrderRepository;
    private final InboundBatchRepository inboundBatchRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public InboundOrderService(InboundOrderRepository inboundOrderRepository,
                               InboundBatchRepository inboundBatchRepository,
                               ProductVariantRepository productVariantRepository,
                               CategoryRepository categoryRepository,
                               UserRepository userRepository) {
        this.inboundOrderRepository = inboundOrderRepository;
        this.inboundBatchRepository = inboundBatchRepository;
        this.productVariantRepository = productVariantRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<InboundOrderDTO> getInboundOrders(String keyword, Integer categoryId, String status) {
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String st = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        List<InboundOrder> orders = inboundOrderRepository.searchInboundOrders(kw, categoryId, st);
        return orders.stream().map(this::toOrderDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InboundOrderDTO getInboundOrderDetail(Integer id) {
        InboundOrder order = inboundOrderRepository.findByIdWithBatches(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đợt nhập kho #" + id));
        return toOrderDTO(order);
    }

    @Transactional(readOnly = true)
    public List<InboundBatchItemDTO> getBatches(Integer variantId, Integer categoryId, String status, String keyword) {
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String st = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        List<InboundBatch> batches = inboundBatchRepository.searchBatches(variantId, categoryId, st, kw);

        // Đánh dấu lô nào là lô đang ưu tiên xuất bán theo FIFO (lô cũ nhất còn hàng của từng biến thể)
        Map<Integer, Integer> oldestActiveBatchPerVariant = new HashMap<>();
        for (InboundBatch b : batches) {
            if ("ACTIVE".equalsIgnoreCase(b.getStatus()) && b.getRemainingQuantity() > 0) {
                Integer vId = b.getVariant().getVariantId();
                if (!oldestActiveBatchPerVariant.containsKey(vId)) {
                    // Do query order by importDate DESC, ta cần tìm lô có importDate cũ nhất
                }
            }
        }

        // Tìm lô cũ nhất còn hàng của tất cả variant
        List<InboundBatch> allActive = batches.stream()
                .filter(b -> "ACTIVE".equalsIgnoreCase(b.getStatus()) && b.getRemainingQuantity() > 0)
                .sorted(Comparator.comparing(InboundBatch::getImportDate).thenComparing(InboundBatch::getBatchId))
                .collect(Collectors.toList());

        for (InboundBatch b : allActive) {
            Integer vId = b.getVariant().getVariantId();
            if (!oldestActiveBatchPerVariant.containsKey(vId)) {
                oldestActiveBatchPerVariant.put(vId, b.getBatchId());
            }
        }

        return batches.stream().map(b -> {
            InboundBatchItemDTO dto = toBatchDTO(b);
            Integer vId = b.getVariant().getVariantId();
            dto.setIsCurrentFifoActive(oldestActiveBatchPerVariant.get(vId) != null && oldestActiveBatchPerVariant.get(vId).equals(b.getBatchId()));
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public InboundOrderDTO createInboundOrder(CreateInboundOrderRequestDTO dto, Integer userId) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("Đợt nhập kho phải có ít nhất 1 mặt hàng!");
        }

        String batchCode = dto.getBatchCode();
        if (batchCode == null || batchCode.trim().isEmpty()) {
            batchCode = "LO-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        } else {
            batchCode = batchCode.trim().toUpperCase();
            if (inboundOrderRepository.existsByBatchCode(batchCode)) {
                throw new IllegalArgumentException("Mã đợt nhập / mã lô '" + batchCode + "' đã tồn tại! Vui lòng chọn mã khác.");
            }
        }

        InboundOrder order = new InboundOrder();
        order.setBatchCode(batchCode);
        order.setSupplierName(dto.getSupplierName() != null ? dto.getSupplierName().trim() : "Nhà cung cấp nội bộ");
        order.setImportDate(dto.getImportDate() != null ? dto.getImportDate() : LocalDateTime.now());
        order.setNote(dto.getNote());
        order.setStatus("COMPLETED");

        if (dto.getCategoryId() != null) {
            categoryRepository.findById(dto.getCategoryId()).ifPresent(order::setCategory);
        }

        if (userId != null) {
            userRepository.findById(userId).ifPresent(order::setCreatedBy);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<InboundBatch> batches = new ArrayList<>();

        for (CreateInboundBatchItemDTO itemDTO : dto.getItems()) {
            if (itemDTO.getVariantId() == null) {
                throw new IllegalArgumentException("Biến thể sản phẩm không được để trống!");
            }
            if (itemDTO.getQuantity() == null || itemDTO.getQuantity() <= 0) {
                throw new IllegalArgumentException("Số lượng nhập phải lớn hơn 0!");
            }
            BigDecimal price = itemDTO.getImportPrice() != null ? itemDTO.getImportPrice() : BigDecimal.ZERO;
            if (price.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Giá nhập không được âm!");
            }

            ProductVariant variant = productVariantRepository.findById(itemDTO.getVariantId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể #" + itemDTO.getVariantId()));

            InboundBatch batch = new InboundBatch();
            batch.setInboundOrder(order);
            batch.setVariant(variant);
            batch.setInitialQuantity(itemDTO.getQuantity());
            batch.setRemainingQuantity(itemDTO.getQuantity());
            batch.setImportPrice(price);
            batch.setStatus("ACTIVE");
            batch.setImportDate(order.getImportDate());
            batches.add(batch);

            // Cập nhật tăng tồn kho tổng của ProductVariant
            int currentStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
            variant.setStockQuantity(currentStock + itemDTO.getQuantity());
            productVariantRepository.save(variant);

            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
            totalAmount = totalAmount.add(lineTotal);
        }

        order.setTotalAmount(totalAmount);
        order.setBatches(batches);
        order = inboundOrderRepository.save(order);

        return toOrderDTO(order);
    }

    private InboundOrderDTO toOrderDTO(InboundOrder o) {
        String catName = o.getCategory() != null ? o.getCategory().getName() : "Đa danh mục";
        String userName = o.getCreatedBy() != null ? o.getCreatedBy().getFullName() : "Hệ thống";

        int totalItems = o.getBatches() != null ? o.getBatches().size() : 0;
        int totalQty = o.getBatches() != null ? o.getBatches().stream().mapToInt(InboundBatch::getInitialQuantity).sum() : 0;

        List<InboundBatchItemDTO> itemDTOs = o.getBatches() != null
                ? o.getBatches().stream().map(this::toBatchDTO).collect(Collectors.toList())
                : new ArrayList<>();

        return InboundOrderDTO.builder()
                .inboundOrderId(o.getInboundOrderId())
                .batchCode(o.getBatchCode())
                .categoryId(o.getCategory() != null ? o.getCategory().getCategoryId() : null)
                .categoryName(catName)
                .supplierName(o.getSupplierName())
                .importDate(o.getImportDate())
                .totalAmount(o.getTotalAmount())
                .note(o.getNote())
                .status(o.getStatus())
                .totalItems(totalItems)
                .totalQuantity(totalQty)
                .createdByName(userName)
                .createdAt(o.getCreatedAt())
                .items(itemDTOs)
                .build();
    }

    private InboundBatchItemDTO toBatchDTO(InboundBatch b) {
        ProductVariant v = b.getVariant();
        Product p = v != null ? v.getProduct() : null;
        Category c = p != null ? p.getCategory() : null;

        BigDecimal price = b.getImportPrice() != null ? b.getImportPrice() : BigDecimal.ZERO;
        BigDecimal subtotal = price.multiply(BigDecimal.valueOf(b.getRemainingQuantity() != null ? b.getRemainingQuantity() : 0));

        return InboundBatchItemDTO.builder()
                .batchId(b.getBatchId())
                .inboundOrderId(b.getInboundOrder() != null ? b.getInboundOrder().getInboundOrderId() : null)
                .batchCode(b.getInboundOrder() != null ? b.getInboundOrder().getBatchCode() : "N/A")
                .variantId(v != null ? v.getVariantId() : null)
                .sku(v != null ? v.getSku() : "N/A")
                .size(v != null ? v.getSize() : "")
                .color(v != null ? v.getColor() : "")
                .productId(p != null ? p.getProductId() : null)
                .productName(p != null ? p.getName() : "N/A")
                .categoryId(c != null ? c.getCategoryId() : null)
                .categoryName(c != null ? c.getName() : "N/A")
                .initialQuantity(b.getInitialQuantity())
                .remainingQuantity(b.getRemainingQuantity())
                .importPrice(b.getImportPrice())
                .subtotal(subtotal)
                .status(b.getStatus())
                .importDate(b.getImportDate())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
