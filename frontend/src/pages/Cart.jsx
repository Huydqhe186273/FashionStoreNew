import React, { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCart,
  updateQuantity,
  editCartItem,
  removeItem,
  clearCart,
  createPaymentLink,
  createOrder,
  verifyPayment,
} from "../services/cartService";
import { getProductVariants } from "../services/customerProductService";
import { getActiveCoupons, applyCoupon } from "../services/couponService";
import { getUserAddresses, createAddress } from "../services/addressService";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Cart.css";

// Chuẩn hóa chuỗi hiển thị màu (sửa lỗi font tiếng Việt cũ như Tr?ng -> Trắng)
const formatColor = (color) => {
  if (!color) return "";
  if (color.includes("Tr?ng")) return color.replace("Tr?ng", "Trắng");
  return color;
};

export default function Cart() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { toast, showToast, confirm } = useToast();
  const navigate = useNavigate();
  const userId = user?.id;

  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Sổ địa chỉ & Form giao hàng ---
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [address, setAddress] = useState({
    recipientName: user?.fullName || user?.name || "",
    phone: user?.phone || "",
    addressLine: "",
    city: "",
  });

  // --- Mã giảm giá (Coupon) ---
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // --- Modal Đổi phân loại (Variant Modal) ---
  const [editingVariantItem, setEditingVariantItem] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [selectedVariantColor, setSelectedVariantColor] = useState("");
  const [selectedVariantSize, setSelectedVariantSize] = useState("");
  const [variantLoading, setVariantLoading] = useState(false);
  const [updatingVariant, setUpdatingVariant] = useState(false);

  // Tải thông tin giỏ hàng
  const loadCart = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getCart(userId);
      setCartData(data);
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Tải danh sách địa chỉ đã lưu
  const loadAddresses = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await getUserAddresses(userId);
      setSavedAddresses(list || []);
      if (list && list.length > 0) {
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        setSelectedAddressId(defaultAddr.addressId);
        setIsAddingNewAddress(false);
      } else {
        setIsAddingNewAddress(true);
      }
    } catch (err) {
      console.error("Lỗi tải sổ địa chỉ:", err);
      setIsAddingNewAddress(true);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;
    if (userId) {
      loadCart();
      loadAddresses();
    } else {
      setLoading(false);
    }
  }, [userId, authLoading, loadCart, loadAddresses]);

  // Cập nhật tên/sđt mặc định nếu user load sau
  useEffect(() => {
    if (user && !address.recipientName) {
      setAddress((prev) => ({
        ...prev,
        recipientName: user.fullName || user.name || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // Kiểm tra callback thanh toán PayOS từ URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const orderCode = urlParams.get("orderCode");

    if (paymentStatus === "success" && orderCode) {
      verifyPayment(orderCode)
        .then((res) => {
          showToast(
            "success",
            res.message || "Thanh toán đơn hàng thành công!",
          );
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
          if (userId) loadCart();
        })
        .catch(() => {
          showToast("error", "Có lỗi khi xác minh thanh toán.");
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        });
    } else if (paymentStatus === "cancel") {
      showToast("error", "Bạn đã hủy thanh toán.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userId, loadCart, showToast]);

  // --- Xử lý Cập nhật số lượng (+ / -) ---
  const handleUpdateQuantity = async (cartItemId, newQuantity, item = null) => {
    // Nếu số lượng giảm về < 1 (bấm nút trừ khi đang là 1): Mở modal hỏi ý kiến người dùng để xác nhận xóa
    if (newQuantity < 1) {
      const targetItem =
        item || cartData?.items?.find((i) => i.cartItemId === cartItemId);
      if (targetItem) {
        handleRemoveItemRequest(targetItem);
      }
      return;
    }

    try {
      // 2. Đánh dấu món này đang cập nhật (để làm mờ dòng đó và khóa nút)
      setUpdatingItemId(cartItemId);
      // nhận cartDTO mới từ server
      const updatedCart = await updateQuantity(userId, cartItemId, newQuantity);
      // cập nhật state cartData
      setCartData(updatedCart);

      // Tái kiểm tra coupon nếu đã áp dụng
      if (appliedCoupon && updatedCart.totalAmount) {
        revalidateCoupon(appliedCoupon.code, updatedCart.totalAmount);
      }
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      showToast("error", "Cập nhật thất bại. Có thể do hết hàng trong kho.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // --- Xử lý Đổi Phân loại (Size / Màu) ---
  const handleOpenVariantModal = async (item) => {
    setEditingVariantItem(item);
    setSelectedVariantColor(item.color || "");
    setSelectedVariantSize(item.size || "");
    setProductVariants([]);
    setVariantLoading(true);

    try {
      const data = await getProductVariants(item.productId);
      setProductVariants(data || []);

      const colors = [...new Set((data || []).map((v) => v.color))];
      if (colors.length > 0) {
        const initialColor = colors.includes(item.color)
          ? item.color
          : colors[0];
        setSelectedVariantColor(initialColor);
        const sizesForColor = (data || []).filter(
          (v) => v.color === initialColor,
        );
        const hasSameSize = sizesForColor.some((v) => v.size === item.size);
        setSelectedVariantSize(
          hasSameSize ? item.size : sizesForColor[0]?.size || "",
        );
      }
    } catch (err) {
      console.error("Lỗi tải phân loại:", err);
      toast.error("Không thể tải danh sách size/màu của sản phẩm này.");
    } finally {
      setVariantLoading(false);
    }
  };

  const handleConfirmChangeVariant = async () => {
    if (!editingVariantItem || !selectedVariantColor || !selectedVariantSize)
      return;

    const matched = productVariants.find(
      (v) => v.color === selectedVariantColor && v.size === selectedVariantSize,
    );

    if (!matched) {
      toast.warning("Vui lòng chọn phân loại hợp lệ.");
      return;
    }

    if (matched.stockQuantity < editingVariantItem.quantity) {
      toast.error(
        `Phân loại này chỉ còn ${matched.stockQuantity} sản phẩm trong kho.`,
      );
      return;
    }

    if (matched.variantId === editingVariantItem.variantId) {
      setEditingVariantItem(null);
      return;
    }

    try {
      setUpdatingVariant(true);
      const updatedCart = await editCartItem(
        userId,
        editingVariantItem.cartItemId,
        editingVariantItem.quantity,
        matched.variantId,
      );
      setCartData(updatedCart);
      toast.success("Đã đổi phân loại sản phẩm thành công!");
      setEditingVariantItem(null);

      if (appliedCoupon && updatedCart.totalAmount) {
        revalidateCoupon(appliedCoupon.code, updatedCart.totalAmount);
      }
    } catch (err) {
      console.error("Lỗi đổi phân loại:", err);
      toast.error(
        err.response?.data?.message || err.message || "Đổi phân loại thất bại.",
      );
    } finally {
      setUpdatingVariant(false);
    }
  };

  // --- Xử lý Mã giảm giá (Coupon) ---
  const revalidateCoupon = async (code, orderTotal) => {
    try {
      const res = await applyCoupon(code, orderTotal);
      if (res.valid) {
        setAppliedCoupon(res);
      } else {
        setAppliedCoupon(null);
        toast.warning(`Mã ${code} không còn đủ điều kiện: ${res.message}`);
      }
    } catch (_) {
      setAppliedCoupon(null);
    }
  };

  const handleApplyCoupon = async (codeToUse) => {
    const code = (codeToUse || couponInput).trim();
    if (!code) {
      toast.warning("Vui lòng nhập mã giảm giá.");
      return;
    }
    if (!cartData?.totalAmount || cartData.totalAmount <= 0) {
      toast.warning("Giỏ hàng của bạn đang trống!");
      return;
    }

    try {
      setCouponLoading(true);
      const res = await applyCoupon(code, cartData.totalAmount);
      if (res.valid) {
        setAppliedCoupon(res);
        setCouponInput(res.code);
        toast.success(res.message || `Đã áp dụng mã ${res.code}!`);
        setShowCouponsModal(false);
      } else {
        toast.error(res.message || "Mã giảm giá không hợp lệ.");
      }
    } catch (err) {
      console.error("Lỗi áp dụng mã:", err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Không thể áp dụng mã giảm giá.",
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.info("Đã gỡ mã giảm giá.");
  };

  const handleOpenAvailableCoupons = async () => {
    setShowCouponsModal(true);
    setLoadingCoupons(true);
    try {
      const list = await getActiveCoupons();
      setAvailableCoupons(list || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách coupon:", err);
      toast.error("Không thể tải danh sách mã giảm giá.");
    } finally {
      setLoadingCoupons(false);
    }
  };

  // --- Xử lý Xóa sản phẩm ---
  const handleRemoveItemRequest = (item) => {
    setItemToDelete(item);
  };

  const confirmRemoveItem = async () => {
    if (!itemToDelete) return;
    try {
      setUpdatingItemId(itemToDelete.cartItemId);
      const updatedCart = await removeItem(userId, itemToDelete.cartItemId);
      setCartData(updatedCart);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
      if (appliedCoupon && updatedCart.totalAmount) {
        revalidateCoupon(appliedCoupon.code, updatedCart.totalAmount);
      }
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      toast.error("Xóa sản phẩm thất bại.");
    } finally {
      setUpdatingItemId(null);
      setItemToDelete(null);
    }
  };

  const cancelRemoveItem = () => {
    setItemToDelete(null);
  };

  const handleClearCart = async () => {
    const confirmed = await confirm({
      title: "Xác nhận xóa toàn bộ giỏ hàng",
      message:
        "Bạn có chắc chắn muốn xóa tất cả sản phẩm đang có trong giỏ hàng không?",
      confirmText: "Xóa tất cả",
      cancelText: "Giữ lại",
      type: "danger",
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const updatedCart = await clearCart(userId);
      setCartData(updatedCart);
      setAppliedCoupon(null);
      toast.success("Đã xóa tất cả sản phẩm khỏi giỏ hàng.");
    } catch (error) {
      console.error("Lỗi xóa giỏ hàng:", error);
      toast.error("Xóa tất cả sản phẩm thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (
      cartData?.items &&
      cartData.items.length > 0 &&
      cartData.items[0].productId
    ) {
      navigate(`/shop/product/${cartData.items[0].productId}`);
    } else {
      navigate("/shop");
    }
  };

  // --- Tiến hành Thanh toán PayOS ---
  const handleCheckout = async () => {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống!");
      return;
    }

    let finalAddressId = selectedAddressId;

    if (isAddingNewAddress || !finalAddressId) {
      if (
        !address.recipientName.trim() ||
        !address.phone.trim() ||
        !address.addressLine.trim() ||
        !address.city.trim()
      ) {
        toast.warning("Vui lòng điền đầy đủ thông tin địa chỉ giao hàng!");
        return;
      }
      try {
        setLoading(true);
        const saved = await createAddress(userId, address);
        finalAddressId = saved.addressId;
      } catch (err) {
        console.error("Lỗi lưu địa chỉ:", err);
        toast.error("Không thể lưu địa chỉ giao hàng.");
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const orderResponse = await createOrder(
        userId,
        finalAddressId,
        appliedCoupon?.code,
      );
      const data = await createPaymentLink(orderResponse.orderId);
      if (data && data.checkoutUrl) {
        // payment nhận từ backend
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Lỗi: Không nhận được URL thanh toán từ server.");
      }
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      toast.error(
        error.response?.data?.error ||
        error.message ||
        "Không thể khởi tạo thanh toán. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };
  // logic tính tiền
  const totalItemsCount =
    cartData?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const rawSubTotal = cartData?.totalAmount || 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotalAmount = Math.max(0, rawSubTotal - discountAmount);

  // Lọc sizes khả dụng cho màu đang chọn trong modal
  const availableSizesForSelectedColor = productVariants
    .filter((v) => v.color === selectedVariantColor)
    .map((v) => v.size);

  const currentMatchedVariant = productVariants.find(
    (v) => v.color === selectedVariantColor && v.size === selectedVariantSize,
  );

  return (
    <div className="cart-page-wrapper">
      {/* Thanh Header Giỏ hàng */}
      <div className="cart-header-bar">
        <div className="cart-header-left">
          <button
            type="button"
            onClick={handleBack}
            className="cart-back-btn"
            title="Quay lại xem sản phẩm"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Quay lại</span>
          </button>

          <div className="cart-title-wrap">
            <h1 className="cart-main-title">Giỏ hàng của bạn</h1>
            {totalItemsCount > 0 && (
              <span className="cart-badge-count">
                {totalItemsCount} sản phẩm
              </span>
            )}
          </div>
        </div>

        {cartData && cartData.items && cartData.items.length > 0 && (
          <button
            type="button"
            onClick={handleClearCart}
            disabled={loading}
            className="cart-clear-all-btn"
            title="Xóa tất cả sản phẩm khỏi giỏ hàng"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Xóa tất cả</span>
          </button>
        )}
      </div>

      {loading || authLoading ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748b",
          }}
        >
          <p style={{ fontSize: "1.1rem", fontWeight: "500" }}>
            Đang tải thông tin giỏ hàng...
          </p>
        </div>
      ) : !userId ? (
        <div className="cart-empty-container">
          <div className="cart-empty-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 11c0 3.532 2.156 6.453 5.342 7.575a7.973 7.973 0 01-10.684 0C9.844 17.453 12 14.532 12 11zm0 0a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </div>
          <h2 className="cart-empty-title">Bạn chưa đăng nhập</h2>
          <p className="cart-empty-desc">
            Vui lòng đăng nhập để lưu trữ và quản lý các sản phẩm trong giỏ hàng
            của bạn.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="cart-empty-btn"
          >
            Đăng nhập ngay
          </button>
        </div>
      ) : !cartData || !cartData.items || cartData.items.length === 0 ? (
        <div className="cart-empty-container">
          <div className="cart-empty-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="cart-empty-title">Giỏ hàng của bạn đang trống</h2>
          <p className="cart-empty-desc">
            Hãy khám phá bộ sưu tập thời trang thời thượng và chọn cho mình
            những món đồ ưng ý nhé!
          </p>
          <button
            type="button"
            onClick={() => navigate("/shop")}
            className="cart-empty-btn"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Khám phá mua sắm ngay
          </button>
        </div>
      ) : (
        /* Layout 2 cột: Bảng sản phẩm / Sổ địa chỉ & Tóm tắt / Coupon / Thanh toán */
        <div className="cart-layout-grid">
          {/* CỘT TRÁI: Bảng sản phẩm & Chọn địa chỉ giao hàng */}
          <div className="cart-left-col">
            {/* Khối danh sách sản phẩm */}
            <div className="cart-card">
              <div className="cart-card-header">
                <h3>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  Danh sách sản phẩm ({cartData.items.length})
                </h3>
              </div>

              <div className="cart-table-wrapper">
                <table className="cart-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40%" }}>Sản phẩm</th>
                      <th style={{ width: "18%" }}>Đơn giá</th>
                      <th style={{ width: "18%", textAlign: "center" }}>
                        Số lượng
                      </th>
                      <th style={{ width: "16%" }}>Thành tiền</th>
                      <th style={{ width: "8%", textAlign: "center" }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartData.items.map((item) => (
                      <tr
                        key={item.cartItemId}
                        style={{
                          opacity:
                            updatingItemId === item.cartItemId ? 0.45 : 1,
                          transition: "opacity 0.2s",
                        }}
                      >
                        {/* Cột Sản phẩm & Phân loại */}
                        <td>
                          <div className="cart-product-cell">
                            <div className="cart-product-thumb">
                              <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                              </svg>
                            </div>
                            <div className="cart-product-meta">
                              <span
                                className="cart-product-name"
                                onClick={() =>
                                  item.productId &&
                                  navigate(`/shop/product/${item.productId}`)
                                }
                                title="Bấm để xem chi tiết sản phẩm"
                              >
                                {item.productName}
                              </span>

                              <div className="cart-variant-badges">
                                <span className="variant-tag">
                                  <span>Phân loại:</span>
                                  <strong>
                                    {formatColor(item.color)}
                                  </strong> • <strong>Size {item.size}</strong>
                                </span>
                              </div>

                              {/* Nút Đổi Size / Màu trực tiếp bằng Modal */}
                              {item.productId && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenVariantModal(item)}
                                  className="cart-change-size-link"
                                  title="Đổi size hoặc màu sắc trực tiếp"
                                >
                                  ✏️ Đổi size / màu khác
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Đơn giá */}
                        <td>
                          <span className="cart-unit-price">
                            {item.price?.toLocaleString()}₫
                          </span>
                        </td>

                        {/* Bộ điều khiển số lượng */}
                        <td style={{ textAlign: "center" }}>
                          <div className="cart-qty-stepper">
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.cartItemId,
                                  item.quantity - 1,
                                  item,
                                )
                              }
                              disabled={updatingItemId === item.cartItemId}
                              title={
                                item.quantity <= 1
                                  ? "Xóa khỏi giỏ hàng"
                                  : "Giảm số lượng"
                              }
                            >
                              −
                            </button>
                            <span className="cart-qty-val">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.cartItemId,
                                  item.quantity + 1,
                                )
                              }
                              disabled={updatingItemId === item.cartItemId}
                              title="Tăng số lượng"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Thành tiền */}
                        <td>
                          <span className="cart-subtotal-price">
                            {item.subTotal?.toLocaleString()}₫
                          </span>
                        </td>

                        {/* Thao tác xóa */}
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="cart-item-delete-btn"
                            onClick={() => handleRemoveItemRequest(item)}
                            disabled={updatingItemId === item.cartItemId}
                            title="Xóa món này khỏi giỏ"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Khối thông tin giao hàng & Sổ địa chỉ */}
            <div className="cart-card">
              <div className="cart-card-header">
                <h3>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  Địa chỉ nhận hàng
                </h3>
              </div>

              {/* Sổ địa chỉ đã lưu (Saved Addresses) */}
              {savedAddresses && savedAddresses.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div className="cart-address-options-bar">
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      Chọn từ sổ địa chỉ của bạn:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                      className="cart-new-address-toggle"
                    >
                      {isAddingNewAddress
                        ? "← Chọn địa chỉ có sẵn"
                        : "+ Thêm địa chỉ mới"}
                    </button>
                  </div>

                  {!isAddingNewAddress && (
                    <div className="cart-address-list">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.addressId}
                          className={`cart-address-card ${selectedAddressId === addr.addressId ? "selected" : ""}`}
                          onClick={() => setSelectedAddressId(addr.addressId)}
                        >
                          <div className="cart-address-card-header">
                            <span className="cart-address-card-name">
                              {addr.recipientName}
                            </span>
                            {addr.isDefault && (
                              <span className="cart-address-default-pill">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <span className="cart-address-card-phone">
                            📞 {addr.phone}
                          </span>
                          <span className="cart-address-card-text">
                            📍 {addr.addressLine}, {addr.city}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Form nhập địa chỉ mới (nếu chưa có hoặc chọn thêm mới) */}
              {isAddingNewAddress && (
                <div className="cart-shipping-form">
                  <div className="cart-form-group">
                    <label className="cart-form-label">
                      Họ và tên người nhận{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="cart-form-input"
                      value={address.recipientName}
                      onChange={(e) =>
                        setAddress({
                          ...address,
                          recipientName: e.target.value,
                        })
                      }
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>

                  <div className="cart-form-group">
                    <label className="cart-form-label">
                      Số điện thoại liên hệ{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="tel"
                      className="cart-form-input"
                      value={address.phone}
                      onChange={(e) =>
                        setAddress({ ...address, phone: e.target.value })
                      }
                      placeholder="VD: 0987654321"
                    />
                  </div>

                  <div className="cart-form-group col-span-2">
                    <label className="cart-form-label">
                      Tỉnh / Thành phố{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="cart-form-input"
                      value={address.city}
                      onChange={(e) =>
                        setAddress({ ...address, city: e.target.value })
                      }
                      placeholder="VD: Hà Nội, TP. Hồ Chí Minh, Đà Nẵng..."
                    />
                  </div>

                  <div className="cart-form-group col-span-2">
                    <label className="cart-form-label">
                      Địa chỉ chi tiết (Số nhà, ngõ, tên đường, phường/xã){" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="cart-form-input"
                      value={address.addressLine}
                      onChange={(e) =>
                        setAddress({ ...address, addressLine: e.target.value })
                      }
                      placeholder="VD: Số 123 Đường Cầu Giấy, Phường Dịch Vọng..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: Khối Coupon, Tóm tắt đơn hàng & Nút thanh toán Sticky */}
          <div className="cart-right-col">
            <div className="cart-summary-card">
              <div className="cart-card-header">
                <h3>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  Tóm tắt đơn hàng
                </h3>
              </div>

              <div className="cart-summary-body">
                {/* KHỐI MÃ GIẢM GIÁ (COUPON) */}
                <div className="cart-coupon-box">
                  <div className="cart-coupon-box-header">
                    <span className="cart-coupon-box-title">
                      🏷️ Mã giảm giá / Voucher
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenAvailableCoupons}
                      className="cart-view-coupons-btn"
                    >
                      Xem mã có sẵn
                    </button>
                  </div>

                  {appliedCoupon ? (
                    <div className="cart-coupon-applied-card">
                      <div className="cart-coupon-applied-info">
                        <span>✓</span>
                        <span>
                          Mã <strong>{appliedCoupon.code}</strong> (-
                          {appliedCoupon.discountAmount?.toLocaleString()}₫)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="cart-coupon-remove-btn"
                        title="Gỡ mã giảm giá"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="cart-coupon-input-group">
                      <input
                        type="text"
                        placeholder="Nhập mã ưu đãi..."
                        className="cart-coupon-input"
                        value={couponInput}
                        onChange={(e) =>
                          setCouponInput(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleApplyCoupon()
                        }
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponLoading || !couponInput.trim()}
                        className="cart-coupon-apply-btn"
                      >
                        {couponLoading ? "Đang kiểm tra..." : "Áp dụng"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="cart-summary-row">
                  <span>Tạm tính ({cartData.items.length} món)</span>
                  <span style={{ fontWeight: "600", color: "#0f172a" }}>
                    {rawSubTotal.toLocaleString()}₫
                  </span>
                </div>

                <div className="cart-summary-row">
                  <span>Phí vận chuyển</span>
                  <span className="freeship-badge">MIỄN PHÍ</span>
                </div>

                <div className="cart-summary-row">
                  <span>Giảm giá</span>
                  <span
                    style={{
                      color: discountAmount > 0 ? "#059669" : "#64748b",
                      fontWeight: "600",
                    }}
                  >
                    {discountAmount > 0
                      ? `-${discountAmount.toLocaleString()}₫`
                      : "-0₫"}
                  </span>
                </div>

                <div className="cart-summary-divider" />

                <div className="cart-total-row">
                  <span className="cart-total-label">Tổng thanh toán:</span>
                  <span className="cart-total-amount">
                    {finalTotalAmount.toLocaleString()}₫
                  </span>
                </div>

                <div className="cart-vat-note">
                  (Đã bao gồm VAT & Miễn phí ship toàn quốc)
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  className="cart-checkout-btn"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span>
                    {loading
                      ? "Đang kết nối PayOS..."
                      : "Tiến hành thanh toán PayOS"}
                  </span>
                </button>
              </div>

              {/* Cam kết tin cậy & an toàn */}
              <div className="cart-trust-badges">
                <div className="trust-item">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Thanh toán bảo mật chuẩn quốc tế qua cổng PayOS</span>
                </div>
                <div className="trust-item">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Hỗ trợ đổi trả miễn phí trong vòng 7 ngày</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Đổi Phân Loại (Size & Màu Sắc Trực Tiếp Trong Giỏ) */}
      {editingVariantItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  color: "#0f172a",
                }}
              >
                Đổi phân loại sản phẩm
              </h3>
              <button
                type="button"
                onClick={() => setEditingVariantItem(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                ✕
              </button>
            </div>

            <p
              style={{
                margin: "0 0 16px 0",
                color: "#334155",
                fontWeight: "600",
                fontSize: "0.95rem",
              }}
            >
              {editingVariantItem.productName}
            </p>

            {variantLoading ? (
              <div
                style={{
                  padding: "30px 0",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                Đang tải các phân loại khả dụng...
              </div>
            ) : (
              <div>
                {/* Chọn Màu Sắc */}
                <div className="variant-modal-section">
                  <div className="variant-modal-section-title">
                    Chọn màu sắc:
                  </div>
                  <div className="variant-pill-group">
                    {[...new Set(productVariants.map((v) => v.color))].map(
                      (col) => (
                        <button
                          key={col}
                          type="button"
                          className={`variant-pill-btn ${selectedVariantColor === col ? "active" : ""}`}
                          onClick={() => {
                            setSelectedVariantColor(col);
                            const sizes = productVariants
                              .filter((v) => v.color === col)
                              .map((v) => v.size);
                            if (!sizes.includes(selectedVariantSize)) {
                              setSelectedVariantSize(sizes[0] || "");
                            }
                          }}
                        >
                          {formatColor(col)}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Chọn Size */}
                <div className="variant-modal-section">
                  <div className="variant-modal-section-title">
                    Chọn kích cỡ (Size):
                  </div>
                  <div className="variant-pill-group">
                    {availableSizesForSelectedColor.map((s) => {
                      const matched = productVariants.find(
                        (v) => v.color === selectedVariantColor && v.size === s,
                      );
                      const isOutOfStock =
                        !matched || matched.stockQuantity <= 0;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={isOutOfStock}
                          className={`variant-pill-btn ${selectedVariantSize === s ? "active" : ""}`}
                          onClick={() => setSelectedVariantSize(s)}
                        >
                          Size {s} {isOutOfStock ? "(Hết)" : ""}
                        </button>
                      );
                    })}
                  </div>

                  <div className="variant-stock-hint">
                    {currentMatchedVariant ? (
                      currentMatchedVariant.stockQuantity > 0 ? (
                        <span style={{ color: "#059669", fontWeight: "500" }}>
                          ✓ Còn {currentMatchedVariant.stockQuantity} sản phẩm
                          trong kho (Mã: {currentMatchedVariant.sku})
                        </span>
                      ) : (
                        <span style={{ color: "#ef4444", fontWeight: "500" }}>
                          ✕ Phân loại này hiện đã hết hàng
                        </span>
                      )
                    ) : (
                      <span>Vui lòng chọn màu và size</span>
                    )}
                  </div>
                </div>

                {/* Nút hành động modal */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "24px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setEditingVariantItem(null)}
                    style={{
                      padding: "9px 16px",
                      backgroundColor: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmChangeVariant}
                    disabled={
                      updatingVariant ||
                      !currentMatchedVariant ||
                      currentMatchedVariant.stockQuantity <
                      editingVariantItem.quantity
                    }
                    style={{
                      padding: "9px 18px",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      opacity: updatingVariant ? 0.7 : 1,
                    }}
                  >
                    {updatingVariant ? "Đang cập nhật..." : "Xác nhận đổi"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Danh Sách Mã Giảm Giá Khả Dụng */}
      {showCouponsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  color: "#0f172a",
                }}
              >
                Mã giảm giá ưu đãi
              </h3>
              <button
                type="button"
                onClick={() => setShowCouponsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                ✕
              </button>
            </div>

            {loadingCoupons ? (
              <div
                style={{
                  padding: "30px 0",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                Đang tìm các ưu đãi tốt nhất cho bạn...
              </div>
            ) : availableCoupons.length === 0 ? (
              <div
                style={{
                  padding: "30px 0",
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                Hiện không có mã giảm giá nào đang áp dụng.
              </div>
            ) : (
              <div className="coupon-list-wrap">
                {availableCoupons.map((c) => (
                  <div key={c.discountCodeId} className="coupon-card-item">
                    <div>
                      <div className="coupon-card-code">{c.code}</div>
                      <div className="coupon-card-desc">{c.description}</div>
                      {c.endDate && (
                        <div className="coupon-card-date">
                          Hạn dùng:{" "}
                          {new Date(c.endDate).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon(c.code)}
                      className="coupon-select-btn"
                    >
                      Áp dụng
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "18px",
              }}
            >
              <button
                type="button"
                onClick={() => setShowCouponsModal(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Xác Nhận Xóa Từng Món */}
      {itemToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "1.2rem",
                fontWeight: "700",
                color: "#0f172a",
              }}
            >
              Xác nhận xóa sản phẩm
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                color: "#475569",
                lineHeight: "1.5",
                fontSize: "0.95rem",
              }}
            >
              Bạn có chắc chắn muốn xóa{" "}
              <strong>{itemToDelete.productName}</strong> (
              {formatColor(itemToDelete.color)}, Size {itemToDelete.size}) khỏi
              giỏ hàng?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={cancelRemoveItem}
                style={{
                  padding: "9px 16px",
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                }}
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={confirmRemoveItem}
                disabled={updatingItemId !== null}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  opacity: updatingItemId ? 0.7 : 1,
                }}
              >
                {updatingItemId ? "Đang xóa..." : "Xóa món này"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
