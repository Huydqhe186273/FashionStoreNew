package com.example.myapp.service;

import com.example.myapp.entity.*;
import com.example.myapp.model.*;
import com.example.myapp.repos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final UserBehaviorLogRepository userBehaviorLogRepository;

    @Transactional(readOnly = true)
    public CartDTO getCartByUserId(Integer userId) {
        Cart cart = getOrCreateCart(userId);
        return mapToDTO(cart);
    }

    @Transactional
    public CartDTO addToCart(Integer userId, AddToCartRequestDTO request) {
        Cart cart = getOrCreateCart(userId);
        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        if (variant.getStockQuantity() < request.getQuantity()) {
            throw new RuntimeException("Not enough stock");
        }

        Optional<CartItem> existingItemOpt = cart.getCartItems().stream()
                .filter(item -> item.getVariant().getVariantId().equals(variant.getVariantId()))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setVariant(variant);
            newItem.setQuantity(request.getQuantity());
            cartItemRepository.save(newItem);
            cart.getCartItems().add(newItem);
        }

        logBehavior(userId, variant.getProduct(), "add_to_cart");

        return mapToDTO(cart);
    }

    private Cart getOrCreateCart(Integer userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });
    }

    private void logBehavior(Integer userId, Product product, String actionType) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            UserBehaviorLog log = new UserBehaviorLog();
            log.setUser(user);
            log.setProduct(product);
            log.setActionType(actionType);
            log.setCreatedAt(LocalDateTime.now());
            userBehaviorLogRepository.save(log);
        }
    }

    private CartDTO mapToDTO(Cart cart) {
        CartDTO dto = new CartDTO();
        dto.setCartId(cart.getCartId());

        List<CartItemDTO> itemDTOs = cart.getCartItems().stream().map(item -> {
            CartItemDTO itemDTO = new CartItemDTO();
            itemDTO.setCartItemId(item.getCartItemId());
            itemDTO.setVariantId(item.getVariant().getVariantId());
            itemDTO.setProductId(item.getVariant().getProduct().getProductId());
            itemDTO.setProductName(item.getVariant().getProduct().getName());
            itemDTO.setSize(item.getVariant().getSize());
            itemDTO.setColor(item.getVariant().getColor());

            BigDecimal price = item.getVariant().getProduct().getDiscountPrice() != null ?
                    item.getVariant().getProduct().getDiscountPrice() :
                    item.getVariant().getProduct().getBasePrice();

            itemDTO.setPrice(price);
            itemDTO.setQuantity(item.getQuantity());
            
            if (price != null && item.getQuantity() != null) {
                itemDTO.setSubTotal(price.multiply(BigDecimal.valueOf(item.getQuantity())));
            } else {
                itemDTO.setSubTotal(BigDecimal.ZERO);
            }
            return itemDTO;
        }).collect(Collectors.toList());

        dto.setItems(itemDTOs);

        BigDecimal totalAmount = itemDTOs.stream()
                .map(CartItemDTO::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalAmount(totalAmount);

        return dto;
    }
}
