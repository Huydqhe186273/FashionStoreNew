package com.example.myapp.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Tra cứu mã định danh ngân hàng (BIN code - Napas/VietQR, mã CITAD liên ngân hàng, tên viết tắt)
 * phục vụ việc ghi nhận tài khoản thanh toán và tạo lệnh chuyển khoản / chi hộ qua cổng PayOS.
 */
public class VietQRBankHelper {

    private static final Map<String, String> BANK_BIN_MAP = new HashMap<>();
    private static final Map<String, String> BIN_TO_NAME_MAP = new HashMap<>();
    private static final Map<String, String> CITAD_TO_BIN_MAP = new HashMap<>();

    static {
        // Nhóm Ngân hàng Quốc Doanh & Big 4
        register("970415", "VietinBank", "203", "01203001", "CTG", "ICB", "VIETIN", "VIETINBANK");
        register("970436", "Vietcombank", "201", "01201001", "VCB", "VIETCOM", "VIETCOMBANK");
        register("970418", "BIDV", "202", "01202001", "DAUTUVAPHATHOAT", "BIDV");
        register("970405", "Agribank", "204", "01204001", "VBA", "AGRI", "AGRIBANK", "NONGNGHIEP");

        // Nhóm Ngân hàng TMCP phổ biến
        register("970423", "TPBank", "358", "01358001", "TPB", "TIENPHONG", "TIEN PHONG", "TP BANK", "TIENPHONGBANK");
        register("970422", "MBBank", "311", "01311001", "MB", "QUANDOAN", "MB BANK", "QUAN DOI");
        register("970407", "Techcombank", "302", "01302001", "TCB", "TECHCOM", "TECHCOMBANK", "KYTHUONG");
        register("970416", "ACB", "303", "01303001", "A CHAU", "ACHAU");
        register("970432", "VPBank", "307", "01307001", "VPB", "VIETNAM THINH VUONG", "VP BANK");
        register("970441", "VIB", "314", "01314001", "QUOCTE", "VIBANK");
        register("970403", "Sacombank", "306", "01306001", "STB", "SACOMBANK", "SAI GON THUONG TIN");
        register("970437", "HDBank", "317", "01317001", "HDB", "HDBANK", "PHAT TRIEN TP HCM");
        register("970443", "SHB", "313", "01313001", "SAI GON HA NOI");
        register("970426", "MSB", "301", "01301001", "HANGHAI", "MARITIME BANK", "MSBANK");
        register("970448", "OCB", "333", "01333001", "PHUONGDONG", "PHUONG DONG");
        register("970440", "SeABank", "319", "01319001", "DONG NA A");
        register("970428", "NamABank", "308", "01308001", "NAM A", "NAMABANK");
        register("970409", "BacABank", "315", "01315001", "BAC A", "BACABANK");
        register("970449", "LPBank", "357", "01357001", "LIENVIETPOSTBANK", "BUUDIENLIENVIET", "LPB");
        register("970412", "PVcomBank", "360", "01360001", "PVCOMBANK", "DAUKHI");
        register("970438", "BaoVietBank", "359", "01359001", "BVB", "BAO VIET");
        register("970400", "SaigonBank", "310", "01301001", "SGB", "SAI GON CONG THUONG");
        register("970430", "PGBank", "341", "01341001", "XANG DAU");
        register("970454", "BVBank", "327", "01327001", "VIETCAPITAL", "BAN VIET");
        register("970452", "KienLongBank", "353", "01353001", "KLB", "KIEN LONG");
        register("970427", "VietABank", "352", "01352001", "VIET A", "VIETABANK");
        register("970419", "NCB", "355", "01355001", "QUOC DAN", "NAM VIET");
        register("970414", "OceanBank", "356", "01356001", "DAI DUONG");
        register("970408", "GPBank", "305", "01305001", "DAU KHI TOAN CAU");
        register("970444", "CB", "304", "01304001", "XAY DUNG");
        register("970406", "DongABank", "354", "01354001", "DONG A");

        // Ngân hàng số & Ví điện tử
        register("546034", "Cake by VPBank", "CAKE");
        register("963388", "Timo");
        register("971005", "Viettel Money", "VIETTEL MONEY", "VIETTELPAY");
        register("971011", "VNPT Money", "VNPT MONEY");
        register("970424", "Shinhan Bank", "616", "01616001", "SHINHAN");
        register("970457", "Woori Bank", "624", "01624001", "WOORI");

        // Đăng ký các mã định danh CITAD 3 số liên ngân hàng
        registerCitad("358", "970423"); // TPBank
        registerCitad("201", "970436"); // Vietcombank
        registerCitad("202", "970418"); // BIDV
        registerCitad("203", "970415"); // VietinBank
        registerCitad("204", "970405"); // Agribank
        registerCitad("311", "970422"); // MBBank
        registerCitad("302", "970407"); // Techcombank
        registerCitad("303", "970416"); // ACB
        registerCitad("307", "970432"); // VPBank
        registerCitad("306", "970403"); // Sacombank
        registerCitad("314", "970441"); // VIB
        registerCitad("313", "970443"); // SHB
        registerCitad("317", "970437"); // HDBank
        registerCitad("301", "970426"); // MSB
        registerCitad("333", "970448"); // OCB
        registerCitad("319", "970440"); // SeABank
        registerCitad("357", "970449"); // LPBank
        registerCitad("308", "970428"); // NamABank
        registerCitad("315", "970409"); // BacABank
        registerCitad("360", "970412"); // PVcomBank
        registerCitad("359", "970438"); // BaoVietBank
        registerCitad("310", "970400"); // SaigonBank
        registerCitad("341", "970430"); // PGBank
        registerCitad("327", "970454"); // BVBank
        registerCitad("353", "970452"); // KienLongBank
        registerCitad("352", "970427"); // VietABank
        registerCitad("355", "970419"); // NCB
        registerCitad("356", "970414"); // OceanBank
        registerCitad("305", "970408"); // GPBank
        registerCitad("304", "970444"); // CB
        registerCitad("354", "970406"); // DongABank
        registerCitad("616", "970424"); // Shinhan Bank
        registerCitad("624", "970457"); // Woori Bank
    }

    private static void register(String bin, String primaryDisplayName, String... aliases) {
        BIN_TO_NAME_MAP.put(bin, primaryDisplayName);
        BANK_BIN_MAP.put(normalize(primaryDisplayName), bin);
        for (String alias : aliases) {
            BANK_BIN_MAP.put(normalize(alias), bin);
        }
        BANK_BIN_MAP.put(bin, bin);
    }

    private static void registerCitad(String citadCode, String bin) {
        CITAD_TO_BIN_MAP.put(citadCode, bin);
        BANK_BIN_MAP.put(citadCode, bin);
    }

    private static String normalize(String s) {
        if (s == null) return "";
        return s.toUpperCase()
                .replaceAll("[^A-Z0-9]", "")
                .trim();
    }

    /**
     * Chuyển đổi tên ngân hàng, mã CITAD hoặc mã viết tắt thành mã BIN 6 chữ số hợp lệ.
     */
    public static String resolveBin(String bankNameOrCode) {
        if (bankNameOrCode == null || bankNameOrCode.trim().isEmpty()) {
            return "970423"; // Mặc định TPBank
        }

        String cleaned = normalize(bankNameOrCode);

        // 1. Nếu chuỗi là mã CITAD 8 chữ số (VD: 01358001 của TPBank chi nhánh Hà Nội)
        if (cleaned.matches("^[0-9]{8}$")) {
            String citad3 = cleaned.substring(2, 5);
            if (CITAD_TO_BIN_MAP.containsKey(citad3)) {
                return CITAD_TO_BIN_MAP.get(citad3);
            }
        }

        // 2. Nếu chuỗi là mã CITAD 3 chữ số (VD: 358 của TPBank)
        if (cleaned.matches("^[0-9]{3}$") && CITAD_TO_BIN_MAP.containsKey(cleaned)) {
            return CITAD_TO_BIN_MAP.get(cleaned);
        }

        // 3. Nếu chuỗi là mã BIN 6 chữ số
        if (cleaned.matches("^[0-9]{6}$")) {
            if (BIN_TO_NAME_MAP.containsKey(cleaned)) {
                return cleaned;
            }
        }

        // 4. Tra cứu trực tiếp theo bảng mã định danh
        if (BANK_BIN_MAP.containsKey(cleaned)) {
            return BANK_BIN_MAP.get(cleaned);
        }

        // 5. Tìm kiếm tương đối theo từ khóa
        for (Map.Entry<String, String> entry : BANK_BIN_MAP.entrySet()) {
            if (cleaned.contains(entry.getKey()) || entry.getKey().contains(cleaned)) {
                return entry.getValue();
            }
        }

        return "970423";
    }

    /**
     * Chuyển đổi mã BIN, mã CITAD (8 số hoặc 3 số), mã viết tắt hoặc tên ngân hàng
     * thành tên ngân hàng chuẩn hiển thị chính xác cho người dùng.
     */
    public static String getBankDisplayName(String bankIdOrBinOrName) {
        if (bankIdOrBinOrName == null || bankIdOrBinOrName.trim().isEmpty()) {
            return "TPBank";
        }

        String trimmed = bankIdOrBinOrName.trim();
        String cleaned = normalize(trimmed);

        // 1. Kiểm tra nếu là mã CITAD 8 số (VD: 01358001 -> 358 là TPBank)
        if (cleaned.matches("^[0-9]{8}$")) {
            String citad3 = cleaned.substring(2, 5);
            if (CITAD_TO_BIN_MAP.containsKey(citad3)) {
                String bin = CITAD_TO_BIN_MAP.get(citad3);
                return BIN_TO_NAME_MAP.getOrDefault(bin, "TPBank");
            }
        }

        // 2. Kiểm tra nếu là mã CITAD 3 số (VD: 358 -> TPBank)
        if (cleaned.matches("^[0-9]{3}$") && CITAD_TO_BIN_MAP.containsKey(cleaned)) {
            String bin = CITAD_TO_BIN_MAP.get(cleaned);
            return BIN_TO_NAME_MAP.getOrDefault(bin, "TPBank");
        }

        // 3. Kiểm tra nếu là mã BIN 6 số
        if (BIN_TO_NAME_MAP.containsKey(trimmed)) {
            return BIN_TO_NAME_MAP.get(trimmed);
        }

        // 4. Giải mã qua resolveBin
        String bin = resolveBin(trimmed);
        if (BIN_TO_NAME_MAP.containsKey(bin)) {
            return BIN_TO_NAME_MAP.get(bin);
        }

        return trimmed;
    }
}
