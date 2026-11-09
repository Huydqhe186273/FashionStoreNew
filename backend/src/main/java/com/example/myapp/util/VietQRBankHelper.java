package com.example.myapp.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Tra cứu mã định danh ngân hàng (BIN code - Napas/VietQR)
 * phục vụ việc tạo lệnh chuyển khoản / chi hộ qua cổng PayOS.
 */
public class VietQRBankHelper {

    private static final Map<String, String> BANK_BIN_MAP = new HashMap<>();

    static {
        // Nhóm Ngân hàng Quốc Doanh & Big 4
        register("970415", "VIETINBANK", "CTG", "ICB");
        register("970436", "VIETCOMBANK", "VCB");
        register("970418", "BIDV");
        register("970405", "AGRIBANK", "VBA");

        // Nhóm Ngân hàng TMCP phổ biến
        register("970422", "MBBANK", "MB", "QUANDOAN");
        register("970407", "TECHCOMBANK", "TCB");
        register("970416", "ACB", "A CHAU");
        register("970423", "TPBANK", "TPB", "TIENPHONG");
        register("970432", "VPBANK", "VPB", "VIETNAM THINH VUONG");
        register("970441", "VIB", "QUOCTE");
        register("970403", "SACOMBANK", "STB");
        register("970437", "HDBANK", "HDB");
        register("970443", "SHB");
        register("970426", "MSB", "HANGHAI");
        register("970448", "OCB", "PHUONGDONG");
        register("970440", "SEABANK");
        register("970428", "NAMABANK", "NAM A");
        register("970409", "BACABANK", "BAC A");
        register("970449", "LPBANK", "LIENVIETPOSTBANK", "BUUDIENLIENVIET");
        register("970412", "PVCOMBANK");
        register("970438", "BAOVIETBANK", "BVB");
        register("970400", "SAIGONBANK", "SGB");
        register("970430", "PGBANK");
        register("970454", "BVBANK", "VIETCAPITAL");
        register("970452", "KIENLONGBANK", "KLB");

        // Ngân hàng số & Ví điện tử
        register("546034", "CAKE", "CAKE BY VPBANK");
        register("963388", "TIMO");
        register("971005", "VIETTELMONEY", "VIETTEL MONEY", "VIETTELPAY");
        register("971011", "VNPTMONEY", "VNPT MONEY");
        register("970424", "SHINHAN", "SHINHANBANK");
        register("970457", "WOORI", "WOORIBANK");
    }

    private static void register(String bin, String... names) {
        for (String name : names) {
            BANK_BIN_MAP.put(normalize(name), bin);
        }
        BANK_BIN_MAP.put(bin, bin);
    }

    private static String normalize(String s) {
        if (s == null) return "";
        return s.toUpperCase()
                .replaceAll("[^A-Z0-9]", "")
                .trim();
    }

    /**
     * Chuyển đổi tên ngân hàng hoặc mã viết tắt thành mã BIN 6 chữ số hợp lệ.
     * Mặc định là 970422 (MBBank) nếu không xác định được.
     */
    public static String resolveBin(String bankNameOrCode) {
        if (bankNameOrCode == null || bankNameOrCode.trim().isEmpty()) {
            return "970422"; // Mặc định MBBank
        }

        String cleaned = normalize(bankNameOrCode);

        // Nếu chuỗi đã là dãy số 6 ký tự
        if (cleaned.matches("^[0-9]{6}$")) {
            return cleaned;
        }

        if (BANK_BIN_MAP.containsKey(cleaned)) {
            return BANK_BIN_MAP.get(cleaned);
        }

        // Tìm kiếm tương đối theo từ khóa
        for (Map.Entry<String, String> entry : BANK_BIN_MAP.entrySet()) {
            if (cleaned.contains(entry.getKey()) || entry.getKey().contains(cleaned)) {
                return entry.getValue();
            }
        }

        return "970422";
    }
}
