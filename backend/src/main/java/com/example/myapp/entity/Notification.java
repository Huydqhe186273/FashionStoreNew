package com.example.myapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty("notificationId")
    private Integer NotificationId;

    @JsonProperty("type")
    @Column(columnDefinition = "NVARCHAR(100)")
    private String Type;

    @JsonProperty("content")
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String Content;

    @JsonProperty("isRead")
    private Boolean IsRead = false;

    @JsonProperty("createdAt")
    private LocalDateTime CreatedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "UserId", nullable = false, foreignKey = @ForeignKey(name = "FK_Notifications_Users"))
    private User User;
}