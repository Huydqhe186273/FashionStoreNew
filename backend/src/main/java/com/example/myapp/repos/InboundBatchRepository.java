package com.example.myapp.repos;

import com.example.myapp.entity.InboundBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InboundBatchRepository extends JpaRepository<InboundBatch, Integer> {

    // FIFO lookup: Lấy các lô còn hàng của biến thể theo thứ tự ngày nhập tăng dần (lô cũ nhất trước)
    @Query("SELECT b FROM InboundBatch b WHERE b.variant.VariantId = :variantId AND b.remainingQuantity > :minRemaining ORDER BY b.importDate ASC, b.batchId ASC")
    List<InboundBatch> findActiveBatchesByVariantFifo(@Param("variantId") Integer variantId, @Param("minRemaining") Integer minRemaining);

    // Lấy các lô của một đợt nhập
    List<InboundBatch> findByInboundOrder_InboundOrderId(Integer inboundOrderId);

    // Tìm kiếm danh sách lô hàng theo tiêu chí
    @Query("SELECT b FROM InboundBatch b " +
           "JOIN FETCH b.variant v " +
           "JOIN FETCH v.Product p " +
           "LEFT JOIN FETCH p.Category c " +
           "JOIN FETCH b.inboundOrder o " +
           "WHERE (:variantId IS NULL OR v.VariantId = :variantId) AND " +
           "(:categoryId IS NULL OR p.Category.CategoryId = :categoryId) AND " +
           "(:status IS NULL OR LOWER(b.status) = LOWER(:status)) AND " +
           "(:keyword IS NULL OR LOWER(o.batchCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.Name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(v.Sku) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY b.importDate DESC, b.batchId DESC")
    List<InboundBatch> searchBatches(@Param("variantId") Integer variantId,
                                     @Param("categoryId") Integer categoryId,
                                     @Param("status") String status,
                                     @Param("keyword") String keyword);
}
