package com.example.myapp.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Tra cứu mã định danh ngân hàng (BIN code - Napas/VietQR)
 * phục vụ việc tạo lệnh chuyển khoản / chi hộ qua cổng PayOS.
 */
public class VietQRBankHelper {

    private static final Map<String, String> BANK_BIN_MAP = new HashMap<>();
    private static final Map<String, String> BIN_TO_NAME_MAP = new HashMap<>();

    static {
        // Nhóm Ngân hàng Quốc Doanh & Big 4
        register("970415", "VietinBank", "CTG", "ICB");
        register("970436", "Vietcombank", "VCB");
        register("970418", "BIDV");
        register("970405", "Agribank", "VBA");

        // Nhóm Ngân hàng TMCP phổ biến
        register("970422", "MBBank", "MB", "QUANDOAN");
        register("970407", "Techcombank", "TCB");
        register("970416", "ACB", "A CHAU");
        register("970423", "TPBank", "TPB", "TIENPHONG");
        register("970432", "VPBank", "VPB", "VIETNAM THINH VUONG");
        register("970441", "VIB", "QUOCTE");
        register("970403", "Sacombank", "STB");
        register("970437", "HDBank", "HDB");
        register("970443", "SHB");
        register("970426", "MSB", "HANGHAI");
        register("970448", "OCB", "PHUONGDONG");
        register("970440", "SeABank");
        register("970428", "NamABank", "NAM A");
        register("970409", "BacABank", "BAC A");
        register("970449", "LPBank", "LIENVIETPOSTBANK", "BUUDIENLIENVIET");
        register("970412", "PVcomBank");
        register("970438", "BaoVietBank", "BVB");
        register("970400", "SaigonBank", "SGB");
        register("970430", "PGBank");
        register("970454", "BVBank", "VIETCAPITAL");
        register("970452", "KienLongBank", "KLB");

        // Ngân hàng số & Ví điện tử
        register("546034", "Cake by VPBank", "CAKE");
        register("963388", "Timo");
        register("971005", "Viettel Money", "VIETTEL MONEY", "VIETTELPAY");
        register("971011", "VNPT Money", "VNPT MONEY");
        register("970424", "Shinhan Bank", "SHINHAN");
        register("970457", "Woori Bank", "WOORI");
    }

    private static void register(String bin, String primaryDisplayName, String... aliases) {
        BIN_TO_NAME_MAP.put(bin, primaryDisplayName);
        BANK_BIN_MAP.put(normalize(primaryDisplayName), bin);
        for (String alias : aliases) {
            BANK_BIN_MAP.put(normalize(alias), bin);
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

    /**
     * Chuyển đổi mã BIN, mã viết tắt hoặc tên ngân hàng thành tên ngân hàng chuẩn để hiển thị.
     * Mặc định là MBBank nếu không xác định được.
     */
    public static String getBankDisplayName(String bankIdOrBinOrName) {
        if (bankIdOrBinOrName == null || bankIdOrBinOrName.trim().isEmpty()) {
            return "MBBank";
        }

        String trimmed = bankIdOrBinOrName.trim();
        if (BIN_TO_NAME_MAP.containsKey(trimmed)) {
            return BIN_TO_NAME_MAP.get(trimmed);
        }

        String bin = resolveBin(trimmed);
        if (BIN_TO_NAME_MAP.containsKey(bin)) {
            return BIN_TO_NAME_MAP.get(bin);
        }

        return trimmed;
    }
}
