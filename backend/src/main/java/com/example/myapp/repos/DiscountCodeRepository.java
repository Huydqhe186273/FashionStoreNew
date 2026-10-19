package com.example.myapp.repos;

import com.example.myapp.entity.DiscountCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiscountCodeRepository extends JpaRepository<DiscountCode, Integer> {

    @Query("SELECT d FROM DiscountCode d LEFT JOIN FETCH d.CreatedBy ORDER BY d.DiscountCodeId DESC")
    List<DiscountCode> findAllWithCreatedBy();

    @Query("SELECT d FROM DiscountCode d LEFT JOIN FETCH d.CreatedBy WHERE d.DiscountCodeId = :id")
    Optional<DiscountCode> findByIdWithCreatedBy(@Param("id") Integer id);

    @Query("SELECT d FROM DiscountCode d LEFT JOIN FETCH d.CreatedBy WHERE LOWER(d.Code) = LOWER(TRIM(:code))")
    Optional<DiscountCode> findByCodeIgnoreCase(@Param("code") String code);

    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM DiscountCode d WHERE LOWER(TRIM(d.Code)) = LOWER(TRIM(:code))")
    boolean existsByCodeIgnoreCase(@Param("code") String code);

    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM DiscountCode d WHERE LOWER(TRIM(d.Code)) = LOWER(TRIM(:code)) AND d.DiscountCodeId <> :id")
    boolean existsByCodeIgnoreCaseAndDiscountCodeIdNot(@Param("code") String code, @Param("id") Integer id);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.DiscountCode.DiscountCodeId = :discountCodeId")
    long countOrdersByDiscountCodeId(@Param("discountCodeId") Integer discountCodeId);
}
