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
        // Lấy giỏ hàng của user từ DB (nếu chưa có thì tự động tạo mới)
        Cart cart = getOrCreateCart(userId);
        // Chuyển sang DTO để chỉ trả về các thông tin cần thiết cho Frontend
        return mapToDTO(cart);
    }

    @Transactional
    public CartDTO addToCart(Integer userId, AddToCartRequestDTO request) {
        // Lấy giỏ hàng của user
        Cart cart = getOrCreateCart(userId);
        
        // Lấy thông tin phân loại sản phẩm (variant) từ DB
        ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        // Kiểm tra số lượng tồn kho có đủ không
        if (variant.getStockQuantity() < request.getQuantity()) {
            throw new RuntimeException("Not enough stock");
        }

        // Kiểm tra xem sản phẩm này đã có trong giỏ hàng chưa
        Optional<CartItem> existingItemOpt = cart.getCartItems().stream()
                .filter(item -> item.getVariant().getVariantId().equals(variant.getVariantId()))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            // Nếu có rồi thì cộng dồn số lượng
            CartItem existingItem = existingItemOpt.get();
            existingItem.setQuantity(existingItem.getQuantity() + request.getQuantity());
            cartItemRepository.save(existingItem);
        } else {
            // Nếu chưa có thì thêm mới vào giỏ hàng
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

    @Transactional
    public CartDTO updateCartItemQuantity(Integer userId, Integer cartItemId, Integer quantity) {
        // Cập nhật nhanh số lượng cho 1 món hàng
        return updateCartItem(userId, cartItemId, quantity, null);
    }

    @Transactional
    public CartDTO updateCartItem(Integer userId, Integer cartItemId, Integer quantity, Integer newVariantId) {
        // 1. Lấy giỏ hàng hiện tại của user
        Cart cart = getOrCreateCart(userId);

        // 2. Tìm món hàng cần cập nhật trong bảng cart_item
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
                
        // 3. Kiểm tra bảo mật: đảm bảo món hàng thuộc về giỏ hàng của user hiện tại
        if (!item.getCart().getCartId().equals(cart.getCartId())) {
            throw new RuntimeException("Item does not belong to user's cart");
        }

        // 4. Nếu có yêu cầu đổi phân loại sản phẩm (ví dụ đổi size/màu mới)
        if (newVariantId != null) {
            ProductVariant newVariant = productVariantRepository.findById(newVariantId)
                    .orElseThrow(() -> new RuntimeException("Variant not found"));
            item.setVariant(newVariant);
        }

        // 5. Cập nhật số lượng sản phẩm
        if (quantity != null) {
            // Nếu số lượng giảm về <= 0 thì tự động xóa món này khỏi giỏ hàng
            if (quantity <= 0) {
                cartItemRepository.delete(item);
                cart.getCartItems().remove(item);
                return mapToDTO(cart);
            }
            // Kiểm tra số lượng tồn kho có đủ đáp ứng không
            if (item.getVariant().getStockQuantity() < quantity) {
                throw new RuntimeException("Not enough stock");
            }
            item.setQuantity(quantity);
        }

        // 6. Lưu thông tin cập nhật vào CSDL và tính toán trả về DTO
        cartItemRepository.save(item);
        return mapToDTO(cart);
    }

    @Transactional
    public CartDTO removeCartItem(Integer userId, Integer cartItemId) {
        // 1. Tìm hoặc lấy giỏ hàng hiện tại của user trong database
        Cart cart = getOrCreateCart(userId);

        // 2. Tìm món hàng cần xóa trong bảng cart_item theo cartItemId
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        // 3. Kiểm tra bảo mật: đảm bảo món hàng này thực sự thuộc về giỏ hàng của user
        if (!item.getCart().getCartId().equals(cart.getCartId())) {
            throw new RuntimeException("Item does not belong to user's cart");
        }

        // 4. Xóa món hàng khỏi database (bảng cart_item) và xóa khỏi danh sách bộ nhớ Java
        cartItemRepository.delete(item);
        cart.getCartItems().remove(item);

        // 5. Tính toán lại tổng tiền giỏ hàng và đóng gói vào CartDTO trả về cho Controller
        return mapToDTO(cart);
    }

    @Transactional
    public CartDTO clearCart(Integer userId) {
        // 1. Lấy giỏ hàng của user
        Cart cart = getOrCreateCart(userId);
        // 2. Xóa toàn bộ các dòng cart_item của giỏ này trong database
        cartItemRepository.deleteAll(cart.getCartItems());
        // 3. Làm rỗng danh sách trong bộ nhớ Java
        cart.getCartItems().clear();
        // 4. Trả về CartDTO giỏ hàng rỗng (items = [], totalAmount = 0)
        return mapToDTO(cart);
    }

    // Hàm phụ trợ: Lấy giỏ hàng của user, nếu user mới chưa có giỏ thì tự động tạo mới vào DB
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

        // Lặp qua từng món trong giỏ để nhặt thông tin mang lên Frontend
        List<CartItemDTO> itemDTOs = cart.getCartItems().stream().map(item -> {
            CartItemDTO itemDTO = new CartItemDTO();
            itemDTO.setCartItemId(item.getCartItemId());
            itemDTO.setVariantId(item.getVariant().getVariantId());
            
            // Đi qua bảng Phân loại (Variant) để chọc thẳng vào bảng Sản phẩm lấy tên
            itemDTO.setProductId(item.getVariant().getProduct().getProductId());
            itemDTO.setProductName(item.getVariant().getProduct().getName());
            itemDTO.setSize(item.getVariant().getSize());
            itemDTO.setColor(item.getVariant().getColor());

            // Trích xuất giá tiền: Check xem có đang sale không, nếu không thì lấy giá gốc
            BigDecimal price = item.getVariant().getProduct().getDiscountPrice() != null ?
                    item.getVariant().getProduct().getDiscountPrice() :
                    item.getVariant().getProduct().getBasePrice();

            itemDTO.setPrice(price);
            itemDTO.setQuantity(item.getQuantity());
            
            // Tính thành tiền của món đồ này (subTotal = Giá * Số lượng)
            if (price != null && item.getQuantity() != null) {
                itemDTO.setSubTotal(price.multiply(BigDecimal.valueOf(item.getQuantity())));
            } else {
                itemDTO.setSubTotal(BigDecimal.ZERO);
            }
            return itemDTO;
        }).collect(Collectors.toList());

        dto.setItems(itemDTOs);

        // Cộng dồn thành tiền (subTotal) của tất cả món đồ lại để ra Tổng bill (totalAmount)
        BigDecimal totalAmount = itemDTOs.stream()
                .map(CartItemDTO::getSubTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setTotalAmount(totalAmount);

        return dto;
    }
}
