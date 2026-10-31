package com.example.myapp.service;

import com.example.myapp.entity.*;
import com.example.myapp.model.*;
import com.example.myapp.repos.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
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
        if (orders.isEmpty()) {
            return Collections.emptyList();
        }

        // Map orderId -> [totalItems, totalQuantity]
        Map<Integer, int[]> statsMap = new HashMap<>();
        List<Object[]> statsList = inboundBatchRepository.countBatchesAndQuantityPerOrder();
        for (Object[] row : statsList) {
            Integer oId = ((Number) row[0]).intValue();
            int totalItems = ((Number) row[1]).intValue();
            int totalQty = ((Number) row[2]).intValue();
            statsMap.put(oId, new int[]{totalItems, totalQty});
        }

        return orders.stream().map(o -> {
            int[] stats = statsMap.getOrDefault(o.getInboundOrderId(), new int[]{0, 0});
            return toOrderSummaryDTO(o, stats[0], stats[1]);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InboundOrderDTO getInboundOrderDetail(Integer id) {
        InboundOrder order = inboundOrderRepository.findByIdWithBatches(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đợt nhập kho #" + id));
        return toOrderDTO(order);
    }

    @Transactional(readOnly = true)
    public InboundStatsDTO getInboundStats() {
        long totalOrders = inboundOrderRepository.count();
        List<Object[]> statsList = inboundBatchRepository.getBatchStatistics();
        long totalBatches = 0;
        long activeBatches = 0;
        long depletedBatches = 0;
        long totalRemainingStock = 0;

        if (statsList != null && !statsList.isEmpty()) {
            Object[] row = statsList.get(0);
            totalBatches = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            activeBatches = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            depletedBatches = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            totalRemainingStock = row[3] != null ? ((Number) row[3]).longValue() : 0L;
        }

        return InboundStatsDTO.builder()
                .totalOrders(totalOrders)
                .totalBatches(totalBatches)
                .activeBatches(activeBatches)
                .depletedBatches(depletedBatches)
                .totalRemainingStock(totalRemainingStock)
                .build();
    }

    @Transactional(readOnly = true)
    public List<InboundBatchItemDTO> getBatches(Integer variantId, Integer categoryId, String status, String keyword) {
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String st = (status != null && !status.trim().isEmpty()) ? status.trim() : null;

        List<InboundBatch> batches;
        if (variantId == null && categoryId == null && st == null && kw == null) {
            batches = inboundBatchRepository.findAllBatchesForList();
        } else {
            batches = inboundBatchRepository.searchBatches(variantId, categoryId, st, kw);
        }

        // Đánh dấu lô nào là lô đang ưu tiên xuất bán theo FIFO (lô cũ nhất còn hàng của từng biến thể)
        Map<Integer, Integer> oldestActiveBatchPerVariant = new HashMap<>();

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
            if (batchCode.length() > 50) {
                throw new IllegalArgumentException("Mã đợt nhập / mã lô không được vượt quá 50 ký tự!");
            }
            if (!batchCode.matches("^[A-Z0-9_-]+$")) {
                throw new IllegalArgumentException("Mã đợt nhập chỉ được chứa chữ cái, số, dấu gạch ngang (-) hoặc gạch dưới (_)!");
            }
            if (inboundOrderRepository.existsByBatchCode(batchCode)) {
                throw new IllegalArgumentException("Mã đợt nhập / mã lô '" + batchCode + "' đã tồn tại! Vui lòng chọn mã khác.");
            }
        }

        LocalDateTime importDate = dto.getImportDate() != null ? dto.getImportDate() : LocalDateTime.now();
        if (importDate.toLocalDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Ngày nhập kho không hợp lệ! Chỉ cho phép tạo phiếu nhập kho trong ngày hôm nay hoặc tương lai.");
        }
        if (importDate.isAfter(LocalDateTime.now().plusYears(1))) {
            throw new IllegalArgumentException("Ngày nhập kho không được vượt quá 1 năm trong tương lai!");
        }

        String supplier = (dto.getSupplierName() != null && !dto.getSupplierName().trim().isEmpty())
                ? dto.getSupplierName().trim()
                : "Nhà cung cấp nội bộ";
        if (supplier.length() > 150) {
            throw new IllegalArgumentException("Tên nhà cung cấp không được vượt quá 150 ký tự!");
        }

        String note = (dto.getNote() != null && !dto.getNote().trim().isEmpty()) ? dto.getNote().trim() : null;
        if (note != null && note.length() > 500) {
            throw new IllegalArgumentException("Ghi chú đợt nhập không được vượt quá 500 ký tự!");
        }

        // Kiểm tra chống trùng biến thể trong cùng một đơn nhập
        Set<Integer> uniqueVariants = new HashSet<>();
        for (int i = 0; i < dto.getItems().size(); i++) {
            CreateInboundBatchItemDTO itemDTO = dto.getItems().get(i);
            if (itemDTO.getVariantId() == null) {
                throw new IllegalArgumentException("Dòng #" + (i + 1) + ": Biến thể sản phẩm không được để trống!");
            }
            if (!uniqueVariants.add(itemDTO.getVariantId())) {
                throw new IllegalArgumentException("Biến thể ID #" + itemDTO.getVariantId() + " bị chọn trùng lặp nhiều lần trong cùng một đợt nhập! Vui lòng gộp số lượng vào 1 dòng.");
            }
            if (itemDTO.getQuantity() == null || itemDTO.getQuantity() <= 0) {
                throw new IllegalArgumentException("Dòng #" + (i + 1) + ": Số lượng nhập phải lớn hơn 0!");
            }
            if (itemDTO.getQuantity() > 100000) {
                throw new IllegalArgumentException("Dòng #" + (i + 1) + ": Số lượng nhập mỗi mặt hàng tối đa là 100.000 sản phẩm!");
            }
            BigDecimal price = itemDTO.getImportPrice() != null ? itemDTO.getImportPrice() : BigDecimal.ZERO;
            if (price.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Dòng #" + (i + 1) + ": Giá nhập không được âm!");
            }
            if (price.compareTo(new BigDecimal("1000000000")) > 0) {
                throw new IllegalArgumentException("Dòng #" + (i + 1) + ": Giá nhập không được vượt quá 1.000.000.000 đ!");
            }
        }

        InboundOrder order = new InboundOrder();
        order.setBatchCode(batchCode);
        order.setSupplierName(supplier);
        order.setImportDate(importDate);
        order.setNote(note);
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
            BigDecimal price = itemDTO.getImportPrice() != null ? itemDTO.getImportPrice() : BigDecimal.ZERO;
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

    private InboundOrderDTO toOrderSummaryDTO(InboundOrder o, int totalItems, int totalQty) {
        String catName = o.getCategory() != null ? o.getCategory().getName() : "Đa danh mục";
        String userName = o.getCreatedBy() != null ? o.getCreatedBy().getFullName() : "Hệ thống";

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
                .items(Collections.emptyList())
                .build();
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
