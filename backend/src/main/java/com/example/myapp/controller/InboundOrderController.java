package com.example.myapp.controller;

import com.example.myapp.model.CreateInboundOrderRequestDTO;
import com.example.myapp.model.InboundBatchItemDTO;
import com.example.myapp.model.InboundOrderDTO;
import com.example.myapp.security.CustomUserDetails;
import com.example.myapp.service.InboundOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/staff/inbound", "/api/admin/inbound"})
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class InboundOrderController {

    private final InboundOrderService inboundOrderService;

    public InboundOrderController(InboundOrderService inboundOrderService) {
        this.inboundOrderService = inboundOrderService;
    }

    @GetMapping("/orders")
    public ResponseEntity<List<InboundOrderDTO>> getInboundOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(inboundOrderService.getInboundOrders(keyword, categoryId, status));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<InboundOrderDTO> getInboundOrderDetail(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(inboundOrderService.getInboundOrderDetail(id));
    }

    @PostMapping("/orders")
    public ResponseEntity<InboundOrderDTO> createInboundOrder(@RequestBody CreateInboundOrderRequestDTO dto) {
        Integer userId = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            userId = ((CustomUserDetails) authentication.getPrincipal()).getId();
        }

        InboundOrderDTO created = inboundOrderService.createInboundOrder(dto, userId);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/batches")
    public ResponseEntity<List<InboundBatchItemDTO>> getBatches(
            @RequestParam(required = false) Integer variantId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(inboundOrderService.getBatches(variantId, categoryId, status, keyword));
    }

    @GetMapping("/stats")
    public ResponseEntity<com.example.myapp.model.InboundStatsDTO> getInboundStats() {
        return ResponseEntity.ok(inboundOrderService.getInboundStats());
    }
}
