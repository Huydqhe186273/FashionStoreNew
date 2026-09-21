package com.example.myapp.service;

import com.example.myapp.entity.*;
import com.example.myapp.repos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;

    @Transactional
    public Order createOrderFromCart(Integer userId, Integer addressId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found or empty"));

        if (cart.getCartItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // Tạo order mới
        Order order = new Order();
        order.setUser(user);
        order.setAddress(address);
        order.setOrderStatus("pending");
        order.setPaymentStatus("unpaid");
        order.setCreatedAt(LocalDateTime.now());
        
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        
        // Lưu order trước để có ID
        order = orderRepository.save(order);

        // Chuyển từ cartItem sang orderItem
        for (CartItem cartItem : cart.getCartItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setVariant(cartItem.getVariant());
            orderItem.setQuantity(cartItem.getQuantity());
            
            BigDecimal price = cartItem.getVariant().getProduct().getBasePrice();
            if (cartItem.getVariant().getProduct().getDiscountPrice() != null) {
                price = cartItem.getVariant().getProduct().getDiscountPrice();
            }
            orderItem.setPriceAtPurchase(price);
            
            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            
            orderItemRepository.save(orderItem);
            orderItems.add(orderItem);
        }

        order.setTotalAmount(totalAmount);
        order.setOrderItems(orderItems);
        order = orderRepository.save(order);

        // Lưu ý: Chưa xóa cart vì chờ thanh toán thành công mới xóa.
        return order;
    }

    @Transactional
    public void markOrderAsPaid(Integer orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            order.setPaymentStatus("PAID");
            orderRepository.save(order);
            
            Cart cart = cartRepository.findByUserId(order.getUser().getUserId()).orElse(null);
            if (cart != null) {
                cartItemRepository.deleteAll(cart.getCartItems());
                cart.getCartItems().clear();
                cartRepository.save(cart);
            }
        }
    }
}
