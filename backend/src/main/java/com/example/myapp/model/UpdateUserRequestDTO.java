package com.example.myapp.model;

import jakarta.validation.constraints.Email;
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
public class UpdateUserRequestDTO {
    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự!")
    private String fullName;

    @Pattern(regexp = "^(0[35789][0-9]{8})?$", message = "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09!")
    private String phone;

    @Email(message = "Định dạng email không hợp lệ!")
    private String email;

    private String status;
    private String role;
}
