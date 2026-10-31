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

    @Query("SELECT b FROM InboundBatch b WHERE b.variant.VariantId = :variantId ORDER BY b.batchId DESC")
    List<InboundBatch> findLatestBatchesByVariantId(@Param("variantId") Integer variantId);

    // Lấy nhanh toàn bộ lô hàng khi không lọc tìm kiếm (tránh lỗi parameter sniffing của SQL Server)
    @Query("SELECT b FROM InboundBatch b " +
           "JOIN FETCH b.variant v " +
           "JOIN FETCH v.Product p " +
           "LEFT JOIN FETCH p.Category c " +
           "JOIN FETCH b.inboundOrder o " +
           "ORDER BY b.importDate DESC, b.batchId DESC")
    List<InboundBatch> findAllBatchesForList();

    // Thống kê nhanh toàn bộ lô hàng (Active, Depleted, Tồn kho) trong 1 câu SQL duy nhất
    @Query("SELECT " +
           "COUNT(b), " +
           "COALESCE(SUM(CASE WHEN b.status = 'ACTIVE' THEN 1 ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN b.status = 'DEPLETED' THEN 1 ELSE 0 END), 0), " +
           "COALESCE(SUM(b.remainingQuantity), 0) " +
           "FROM InboundBatch b")
    List<Object[]> getBatchStatistics();

    // Tìm kiếm danh sách lô hàng theo tiêu chí
    @Query("SELECT b FROM InboundBatch b " +
           "JOIN FETCH b.variant v " +
           "JOIN FETCH v.Product p " +
           "LEFT JOIN FETCH p.Category c " +
           "JOIN FETCH b.inboundOrder o " +
           "WHERE (:variantId IS NULL OR v.VariantId = :variantId) AND " +
           "(:categoryId IS NULL OR c.CategoryId = :categoryId) AND " +
           "(:status IS NULL OR LOWER(b.status) = LOWER(:status)) AND " +
           "(:keyword IS NULL OR LOWER(o.batchCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.Name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(v.Sku) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY b.importDate DESC, b.batchId DESC")
    List<InboundBatch> searchBatches(@Param("variantId") Integer variantId,
                                     @Param("categoryId") Integer categoryId,
                                     @Param("status") String status,
                                     @Param("keyword") String keyword);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM InboundBatch b WHERE b.variant.VariantId = :variantId")
    boolean existsByVariantId(@Param("variantId") Integer variantId);

    @Query("SELECT b.inboundOrder.inboundOrderId, COUNT(b), COALESCE(SUM(b.initialQuantity), 0) FROM InboundBatch b GROUP BY b.inboundOrder.inboundOrderId")
    List<Object[]> countBatchesAndQuantityPerOrder();
}
