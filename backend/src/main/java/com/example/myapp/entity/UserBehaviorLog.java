package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "UserBehaviorLogs")
@Getter
@Setter
@NoArgsConstructor
public class UserBehaviorLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long LogId;
    private String SessionId;
    private String ActionType;
    private Integer DurationSeconds;
    private LocalDateTime CreatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserId", foreignKey = @ForeignKey(name = "FK_Behavior_Users"))
    private User User;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ProductId", nullable = false, foreignKey = @ForeignKey(name = "FK_Behavior_Products"))
    private Product Product;
}