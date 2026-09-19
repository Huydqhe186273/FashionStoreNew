package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "UserPreferences")
@Getter
@Setter
@NoArgsConstructor
public class UserPreference {
    @Id
    private Integer UserId;
    @Lob
    private String PreferredCategories;
    private BigDecimal PreferredPriceMin;
    private BigDecimal PreferredPriceMax;
    @Lob
    private String PreferredColors;
    @Lob
    private String PreferredSizes;
    private LocalDateTime UpdatedAt;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "UserId", foreignKey = @ForeignKey(name = "FK_Preferences_Users"))
    private User User;
}