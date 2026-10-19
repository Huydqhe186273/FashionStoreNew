package com.example.myapp.repos;

import com.example.myapp.entity.DiscountCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiscountCodeRepository extends JpaRepository<DiscountCode, Integer> {

    @Query("SELECT d FROM DiscountCode d WHERE UPPER(d.Code) = UPPER(:code)")
    Optional<DiscountCode> findByCodeIgnoreCase(@Param("code") String code);

    @Query("SELECT d FROM DiscountCode d WHERE (d.StartDate IS NULL OR d.StartDate <= :now) AND (d.EndDate IS NULL OR d.EndDate >= :now) AND (d.UsageLimit IS NULL OR d.UsageLimit > 0)")
    List<DiscountCode> findActiveCoupons(@Param("now") LocalDateTime now);
}
