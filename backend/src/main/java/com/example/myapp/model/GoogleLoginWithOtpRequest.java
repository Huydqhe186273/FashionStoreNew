package com.example.myapp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleLoginWithOtpRequest {
    private String email;
    private String fullName;
    private String googleId;
    private String otp;
    private String idToken;
    private String credential;
}
