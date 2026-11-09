# SYSTEM DESIGN SPECIFICATION: ORDER PROCESSING & STATUS WORKFLOW
## Class Diagram & Sequence Diagrams (English Standard)
### FashionStore E-Commerce System

The Draw.io diagram file has been generated and validated with zero XML errors at both paths:
* **Root Directory File**: [`order_processing_class_sequence_diagrams.drawio`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/order_processing_class_sequence_diagrams.drawio)
* **Docs Directory File**: [`docs/order_processing_class_sequence_diagrams.drawio`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/docs/order_processing_class_sequence_diagrams.drawio)

The file contains **3 Dedicated Tabs** in 100% professional English:
1. **Tab 1: `Class Diagram - Order Processing`** (UML Class architecture with DTOs, Controller, Service, Repositories, and Entities).
2. **Tab 2: `Sequence - View & Filter Orders`** (Query / Read flow following the exact standard numbering convention 1 to 11 with `[Success]` and `[Fail]`).
3. **Tab 3: `Sequence - Process Order (FIFO)`** (Transactional status transition flow from `PENDING` to `PROCESSING` with FIFO batch allocation and inventory deduction).

---

# 1. UML CLASS DIAGRAM (TAB 1)

### Structural Layout & Spacing:
* **Balanced Column Spacing (240px - 270px gap)**: Horizontally balanced lifelines (`Staff`, `View`, `Controller`, `Service`, `Repositories`, `DB`). Every message label fits comfortably with 15px - 25px breathing margin, preventing any text overflow while avoiding unnecessary emptiness or horizontal scrolling.
* **Pixel-Exact Arrow Connection**: All message arrows connect precisely to the outer edges of activation bars (`xC - 5` on the left, `xC + 5` on the right) with zero penetration.
* **Top (DTOs)**: `StaffOrderListItemDTO` & `StaffOrderDetailDTO`
* **Left (Interface)**: `«interface» IStaffOrderService`
* **Center (Core)**: `StaffOrderController` $\rightarrow$ `StaffOrderService`
* **Bottom Row (Repositories & Entities)**:
  * `OrderRepository` $\diamond$---- `Order` (Sales Order entity)
  * `OrderItemRepository` $\diamond$---- `OrderItem` (Order line item entity)
  * `InboundBatchRepository` $\diamond$---- `InboundBatch` (FIFO batch deduction entity)
* **Entity Relationships**:
  * `Order` (1) $\blacklozenge$--------- (1..*) `OrderItem` (Composition)
  * `OrderItem` (*) ----------- (1..*) `InboundBatch` (Association / FIFO allocation)

```mermaid
classDiagram
    direction TB

    class StaffOrderListItemDTO {
        +orderId: Integer
        +customerName: String
        +customerEmail: String
        +customerPhone: String
        +orderStatus: String
        +paymentStatus: String
        +totalAmount: BigDecimal
        +itemCount: Integer
        +createdAt: LocalDateTime
    }

    class StaffOrderDetailDTO {
        +orderId: Integer
        +recipientName: String
        +recipientPhone: String
        +shippingAddress: String
        +orderStatus: String
        +paymentStatus: String
        +totalAmount: BigDecimal
        +items: List~StaffOrderItemDTO~
    }

    class IStaffOrderService {
        <<interface>>
        +getOrders(status, keyword) List~StaffOrderListItemDTO~
        +getOrderDetail(orderId) StaffOrderDetailDTO
        +updateOrderStatus(id, newStatus) StaffOrderDetailDTO
        +markOrderRTO(id, note) StaffOrderDetailDTO
    }

    class StaffOrderController {
        -staffOrderService: IStaffOrderService
        +getOrders(status, keyword): ResponseEntity
        +getOrderDetail(id): ResponseEntity
        +updateOrderStatus(id, dto): ResponseEntity
        +markOrderRTO(id, body): ResponseEntity
        +approveReturn(id): ResponseEntity
    }

    class StaffOrderService {
        -orderRepository: OrderRepository
        -productVariantRepo: ProductVariantRepository
        -inboundBatchRepo: InboundBatchRepository
        +getOrders(status, keyword): List~StaffOrderListItemDTO~
        +getOrderDetail(orderId): StaffOrderDetailDTO
        +updateOrderStatus(id, newStatus): StaffOrderDetailDTO
        +markOrderRTO(id, note): StaffOrderDetailDTO
    }

    class OrderRepository {
        <<interface>>
        +findAllByOrderByCreatedAtDesc() List~Order~
        +findByIdWithItems(id) Optional~Order~
    }

    class OrderItemRepository {
        <<interface>>
    }

    class InboundBatchRepository {
        <<interface>>
        +findActiveBatchesByVariantFifo(variantId, 0) List~InboundBatch~
    }

    class Order {
        +orderId: Integer
        +orderStatus: String
        +paymentStatus: String
        +totalAmount: BigDecimal
        +createdAt: LocalDateTime
        +orderItems: List~OrderItem~
        +getters / setters()
    }

    class OrderItem {
        +orderItemId: Integer
        +quantity: Integer
        +priceAtPurchase: BigDecimal
        +order: Order
        +variant: ProductVariant
        +getters / setters()
    }

    class InboundBatch {
        +batchId: Integer
        +supplierSku: String
        +initialQuantity: Integer
        +remainingQuantity: Integer
        +importPrice: BigDecimal
        +status: String [ACTIVE, DEPLETED]
        +deductQuantity(qty): void
    }

    StaffOrderController ..> StaffOrderListItemDTO
    StaffOrderController ..> StaffOrderDetailDTO
    StaffOrderController ..> IStaffOrderService
    StaffOrderService ..|> IStaffOrderService
    StaffOrderController ..> StaffOrderService
    StaffOrderService ..> OrderRepository
    StaffOrderService ..> OrderItemRepository
    StaffOrderService ..> InboundBatchRepository
    OrderRepository o-- Order : aggregates
    OrderItemRepository o-- OrderItem : aggregates
    InboundBatchRepository o-- InboundBatch : aggregates
    Order "1" *-- "1..*" OrderItem : contains
    OrderItem "*" --> "1..*" InboundBatch : deducts FIFO
```

---

# 2. SEQUENCE DIAGRAM 1: VIEW & FILTER ORDERS (TAB 2)

### Flow Summary:
Staff views the order management screen and filters orders by status (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`) or customer keyword.

```mermaid
sequenceDiagram
    autonumber
    actor Staff
    participant View
    participant Controller as :StaffOrderController
    participant Service as :StaffOrderService
    participant Repo as :OrderRepository
    participant DB

    Staff ->> View: 1. Select status filter & input keyword
    View ->> Controller: 2. call API GET /api/staff/orders
    Controller ->> Service: 3. getOrders(statusFilter, keyword)
    Service ->> Repo: 4. findAllByOrderByCreatedAtDesc()
    Repo ->> DB: 5. query DB: SELECT * FROM Orders
    DB -->> Repo: 6. return orders recordset
    Repo -->> Service: 7. return List<Order> entities
    Note over Service, Controller: 7.1 throw exception / 7.2 show error alert if DB fails
    Service ->> Service: 8. filterOrders() & mapToListItemDTO()
    
    alt Success
        Service -->> Controller: 9. return List<StaffOrderListItemDTO>
        Controller -->> View: 10. HTTP 200 OK (List<StaffOrderListItemDTO>)
        View -->> Staff: 11. display orders table & status badges
    else Fail
        Service -->> Controller: 8.1 return error response (500)
        Controller -->> View: 8.2 return error response
        View -->> Staff: 8.3 display error alert
    end
```

---

# 3. SEQUENCE DIAGRAM 2: PROCESS ORDER & FIFO ALLOCATION (TAB 3)

### Flow Summary:
Staff processes an order from `PENDING` to `PROCESSING`. The system verifies real-time stock across active FIFO batches, deducts quantities from oldest batches first, marks exhausted batches as `DEPLETED`, updates product variant inventory, and changes order status atomically under `@Transactional`.

```mermaid
sequenceDiagram
    autonumber
    actor Staff
    participant View
    participant Controller as :StaffOrderController
    participant Service as :StaffOrderService
    participant OrderRepo as :OrderRepository
    participant BatchRepo as :InboundBatchRepository
    participant DB

    Staff ->> View: 1. Click "Confirm Order" (PROCESSING)
    View ->> Controller: 2. call API PUT /api/staff/orders/{id}/status
    Controller ->> Service: 3. updateOrderStatus(orderId, "PROCESSING")
    Service ->> OrderRepo: 4. findByIdWithItems(orderId)
    OrderRepo ->> DB: 5. query DB: SELECT * FROM Orders JOIN Items
    DB -->> OrderRepo: 6. return Order entity with items
    OrderRepo -->> Service: 7. return Order entity
    Service ->> BatchRepo: 7.1 findActiveBatchesByVariantFifo(variantId)
    BatchRepo ->> DB: 7.2 query DB: SELECT * FROM InboundBatches FIFO
    DB -->> BatchRepo: 7.3 return active FIFO batches
    BatchRepo -->> Service: 7.4 return List<InboundBatch>
    Note over Service, Controller: 7.5 throw exception / 7.6 show alert if stock insufficient
    Service ->> Service: 8. deductFifoBatches() & updateOrderStatus()

    alt Success
        Service -->> Controller: 9. return StaffOrderDetailDTO (status updated)
        Controller -->> View: 10. HTTP 200 OK (StaffOrderDetailDTO)
        View -->> Staff: 11. show success toast & update status badge
    else Fail
        Service -->> Controller: 8.1 return error response (400)
        Controller -->> View: 8.2 return error response
        View -->> Staff: 8.3 display error alert
    end
```

