# Developer Profile & Environment Rules (Đào Quang Huy)

- **Owner:** Đào Quang Huy (`Huydqhe186273`)
- **Active Branch:** `huy`
- **JDK:** Microsoft OpenJDK 17 LTS (`C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot`), target version `17` (class file version 61.0). NEVER compile or change target to Java 25.
- **Database:** SQL Server instance `MSSQLSERVER01` on localhost:1433, db name `FashionStoreDB`. Credentials are `sa` / `sa`. NEVER change fallback password to `12345` or `123456`.
- **Compiler Lock:** `backend/.settings/org.eclipse.jdt.core.prefs` must always enforce Java 17 compliance.
- **Backend Port:** 8080 (Spring Boot).
- **Frontend Port:** 3000 / 5173 (React + Vite).

## Assigned Tasks (Huy)
- **II.5 Cart & Checkout:**
  - II.5.1 `Cart` (Screen, Iter1, Done)
  - II.5.2 `Add to Cart` (Function, Iter1, Done)
  - II.5.3 `Edit Cart` (Function, Iter2, Done)
  - II.5.4 `Remove Cart Item` (Function, Iter2, Done)
  - II.5.5 `Apply Coupon` (Function, Iter2, To Do / Code ready)
  - II.5.6 `Checkout` (Screen, Iter2, To Do / Code ready)
  - II.5.7 `Create Order` (Function, Iter2, To Do / Code ready)
- **II.8 Payment (PayOS):**
  - II.8.1 `Create PayOS Payment` (API, Iter1, Done)
  - II.8.2 `PayOS Webhook` (API, Iter1, To Do)
  - II.8.3 `Payment Status` (API, Iter1, To Do)
- **II.9 Notifications:**
  - II.9.4 `Order Notification` (API, Iter2, To Do / Code ready)
  - II.9.5 `Notification List` (Screen, Iter2, To Do / Code ready)
  - II.9.6 `Mark Notification Read` (Function, Iter2, To Do / Code ready)

