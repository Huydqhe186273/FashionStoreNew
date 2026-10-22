package com.example.myapp.model;

import lombok.Data;

@Data
public class GoogleLoginWithOtpRequest {
    private String email;
    private String fullName;
    private String googleId;
    private String otp;
}
