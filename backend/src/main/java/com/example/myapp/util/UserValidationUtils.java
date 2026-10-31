package com.example.myapp.util;

import java.util.Set;
import java.util.regex.Pattern;

public class UserValidationUtils {

    // Regex email chuẩn RFC 5322 (hỗ trợ Gmail và các miền hợp lệ, độ dài TLD từ 2 đến 64 ký tự)
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}$"
    );

    // Regex số điện thoại di động Việt Nam: chính xác 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09
    private static final Pattern VIETNAM_PHONE_PATTERN = Pattern.compile(
            "^0[35789][0-9]{8}$"
    );

    // Regex họ tên: chữ cái Unicode tiếng Việt, khoảng trắng, gạch nối, độ dài 2-100 ký tự
    private static final Pattern FULL_NAME_PATTERN = Pattern.compile(
            "^[\\p{L}]+(?:[\\s'-][\\p{L}]+)*$"
    );

    private static final Set<String> ALLOWED_ROLES = Set.of("customer", "staff", "admin");
    private static final Set<String> ALLOWED_STATUSES = Set.of("active", "locked");

    /**
     * Chuẩn hóa và kiểm tra họ và tên:
     * - Không được để trống
     * - Độ dài từ 2 đến 100 ký tự
     * - Không chứa số hoặc ký tự đặc biệt nguy hiểm
     * - Tự động gom khoảng trắng thừa
     */
    public static String validateAndNormalizeFullName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            throw new IllegalArgumentException("Họ và tên không được để trống!");
        }
        String normalized = fullName.trim().replaceAll("\\s+", " ");
        if (normalized.length() < 2 || normalized.length() > 100) {
            throw new IllegalArgumentException("Họ và tên phải có độ dài từ 2 đến 100 ký tự!");
        }
        if (!FULL_NAME_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Họ và tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng, không được chứa số hoặc ký tự đặc biệt!");
        }
        return normalized;
    }

    /**
     * Chuẩn hóa và kiểm tra Email/Gmail:
     * - Không được để trống
     * - Độ dài từ 6 đến 150 ký tự
     * - Chuẩn định dạng email (ví dụ: user@gmail.com)
     * - Tự động chuyển về chữ thường và cắt khoảng trắng thừa
     */
    public static String validateAndNormalizeEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email không được để trống!");
        }
        String normalized = email.trim().toLowerCase();
        if (normalized.length() < 6 || normalized.length() > 150) {
            throw new IllegalArgumentException("Email phải có độ dài từ 6 đến 150 ký tự!");
        }
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Định dạng email không hợp lệ! Vui lòng nhập đúng định dạng (Ví dụ: user@gmail.com).");
        }
        return normalized;
    }

    /**
     * Chuẩn hóa và kiểm tra số điện thoại:
     * - Chuẩn số điện thoại di động Việt Nam gồm chính xác 10 chữ số
     * - Bắt đầu bằng 03, 05, 07, 08, hoặc 09
     * - Tự động chuyển tiền tố quốc tế +84 hoặc 84 về 0
     */
    public static String validateAndNormalizePhone(String phone, boolean required) {
        if (phone == null || phone.trim().isEmpty()) {
            if (required) {
                throw new IllegalArgumentException("Số điện thoại không được để trống!");
            }
            return null;
        }
        String normalized = phone.replaceAll("[\\s.-]", "");
        if (normalized.startsWith("+84")) {
            normalized = "0" + normalized.substring(3);
        } else if (normalized.startsWith("84") && normalized.length() == 11) {
            normalized = "0" + normalized.substring(2);
        }

        if (!VIETNAM_PHONE_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Số điện thoại không hợp lệ! Vui lòng nhập đúng số điện thoại di động Việt Nam gồm chính xác 10 chữ số (bắt đầu bằng 03, 05, 07, 08 hoặc 09).");
        }
        return normalized;
    }

    /**
     * Kiểm tra mật khẩu:
     * - Tối thiểu 6 ký tự, tối đa 32 ký tự
     * - Không chứa khoảng trắng
     */
    public static void validatePassword(String password) {
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên!");
        }
        if (password.length() > 32) {
            throw new IllegalArgumentException("Mật khẩu không được vượt quá 32 ký tự!");
        }
        if (password.contains(" ")) {
            throw new IllegalArgumentException("Mật khẩu không được chứa khoảng trắng!");
        }
    }

    /**
     * Chuẩn hóa và kiểm tra vai trò:
     * - Chỉ nhận: customer, staff, admin
     */
    public static String validateAndNormalizeRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            return "customer";
        }
        String normalized = role.trim().toLowerCase();
        if (!ALLOWED_ROLES.contains(normalized)) {
            throw new IllegalArgumentException("Vai trò không hợp lệ! Chỉ chấp nhận: customer, staff, admin.");
        }
        return normalized;
    }

    /**
     * Chuẩn hóa và kiểm tra trạng thái:
     * - Chỉ nhận: active, locked
     */
    public static String validateAndNormalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return "active";
        }
        String normalized = status.trim().toLowerCase();
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ! Chỉ chấp nhận: active, locked.");
        }
        return normalized;
    }
}
