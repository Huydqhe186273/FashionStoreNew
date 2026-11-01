package com.example.myapp.controller;

import com.example.myapp.model.StaffCreateReturnDTO;
import com.example.myapp.model.StaffOrderDetailDTO;
import com.example.myapp.model.StaffOrderListItemDTO;
import com.example.myapp.model.UpdateOrderStatusRequestDTO;
import com.example.myapp.service.StaffOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({ "/api/staff/orders", "/api/admin/orders" })
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffOrderController {

    private final StaffOrderService staffOrderService;

    public StaffOrderController(StaffOrderService staffOrderService) {
        this.staffOrderService = staffOrderService;
    }

    @GetMapping
    public ResponseEntity<List<StaffOrderListItemDTO>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(staffOrderService.getOrders(status, keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffOrderDetailDTO> getOrderDetail(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(staffOrderService.getOrderDetail(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<StaffOrderDetailDTO> updateOrderStatus(
            @PathVariable("id") Integer id,
            @RequestBody UpdateOrderStatusRequestDTO dto) {
        return ResponseEntity.ok(staffOrderService.updateOrderStatus(id, dto.getStatus()));
    }

    @PostMapping("/{id}/create-return")
    public ResponseEntity<StaffOrderDetailDTO> createStaffReturn(
            @PathVariable("id") Integer id,
            @RequestBody StaffCreateReturnDTO dto) {
        return ResponseEntity.ok(staffOrderService.createStaffReturn(id, dto));
    }

    @PostMapping("/{id}/rto")
    public ResponseEntity<StaffOrderDetailDTO> markOrderRTO(
            @PathVariable("id") Integer id,
            @RequestBody(required = false) Map<String, String> body) {
        String note = body != null ? body.get("note") : null;
        return ResponseEntity.ok(staffOrderService.markOrderRTO(id, note));
    }

    @PutMapping("/{id}/approve-return")
    public ResponseEntity<StaffOrderDetailDTO> approveReturn(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(staffOrderService.approveReturn(id));
    }

    @PutMapping("/{id}/reject-return")
    public ResponseEntity<StaffOrderDetailDTO> rejectReturn(
            @PathVariable("id") Integer id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Không đủ điều kiện hoàn trả";
        return ResponseEntity.ok(staffOrderService.rejectReturn(id, reason));
    }
}
