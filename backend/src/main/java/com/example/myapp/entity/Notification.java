package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "Notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer NotificationId;
    @Column(columnDefinition = "NVARCHAR(100)")
    private String Type;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String Content;
    private Boolean IsRead = false;
    private LocalDateTime CreatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "UserId", nullable = false, foreignKey = @ForeignKey(name = "FK_Notifications_Users"))
    private User User;
}