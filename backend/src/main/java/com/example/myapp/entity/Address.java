package com.example.myapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "Addresses")
@Getter
@Setter
@NoArgsConstructor
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("addressId")
    private Integer AddressId;
    
    @JsonProperty("recipientName")
    private String RecipientName;
    
    @JsonProperty("phone")
    private String Phone;
    
    @JsonProperty("addressLine")
    private String AddressLine;
    
    @JsonProperty("city")
    private String City;
    
    @JsonProperty("isDefault")
    private Boolean IsDefault = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "UserId", nullable = false, foreignKey = @ForeignKey(name = "FK_Addresses_Users"))
    @JsonIgnore
    private User User;
}