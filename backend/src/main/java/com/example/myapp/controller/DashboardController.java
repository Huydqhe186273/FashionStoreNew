package com.example.myapp.controller;

import com.example.myapp.model.DashboardOverviewDTO;
import com.example.myapp.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    // Xử lý GET /api/admin/dashboard/overview để trả toàn bộ dữ liệu tổng quan dashboard.
    public ResponseEntity<DashboardOverviewDTO> getOverview() {
        DashboardOverviewDTO overview = dashboardService.getDashboardOverview();
        return ResponseEntity.ok(overview);
    }
}
