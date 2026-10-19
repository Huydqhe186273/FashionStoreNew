package com.example.myapp.repos;

import com.example.myapp.entity.InboundOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InboundOrderRepository extends JpaRepository<InboundOrder, Integer> {

    boolean existsByBatchCode(String batchCode);

    Optional<InboundOrder> findByBatchCode(String batchCode);

    @Query("SELECT DISTINCT o FROM InboundOrder o LEFT JOIN FETCH o.batches b LEFT JOIN FETCH b.variant v LEFT JOIN FETCH v.Product p LEFT JOIN FETCH o.category c WHERE " +
           "(:keyword IS NULL OR LOWER(o.batchCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(o.supplierName) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:categoryId IS NULL OR o.category.CategoryId = :categoryId) AND " +
           "(:status IS NULL OR LOWER(o.status) = LOWER(:status)) " +
           "ORDER BY o.importDate DESC, o.inboundOrderId DESC")
    List<InboundOrder> searchInboundOrders(@Param("keyword") String keyword,
                                           @Param("categoryId") Integer categoryId,
                                           @Param("status") String status);

    @Query("SELECT o FROM InboundOrder o LEFT JOIN FETCH o.batches b LEFT JOIN FETCH b.variant v LEFT JOIN FETCH v.Product p LEFT JOIN FETCH o.category c WHERE o.inboundOrderId = :id")
    Optional<InboundOrder> findByIdWithBatches(@Param("id") Integer id);
}
