package com.example.myapp.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStaffRequestDTO {
    @NotBlank(message = "Họ và tên không được để trống!")
    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự!")
    private String fullName;

    @NotBlank(message = "Email không được để trống!")
    @Email(message = "Định dạng email không hợp lệ!")
    private String email;

    private String password;

    @Pattern(regexp = "^(0[35789][0-9]{8})?$", message = "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09!")
    private String phone;

    private String role; // "staff" or "admin"
    private String status; // "active" or "locked"
}
