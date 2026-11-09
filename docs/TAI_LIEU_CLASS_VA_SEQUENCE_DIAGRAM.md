# SYSTEM DESIGN SPECIFICATION: INBOUND & FIFO BATCH MANAGEMENT
## Class Diagram & Sequence Diagrams (English Standard)
### FashionStore E-Commerce System

The Draw.io diagram file has been generated and validated with zero XML errors at both paths:
* **Root Directory File**: [`inbound_fifo_class_sequence_diagrams.drawio`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/inbound_fifo_class_sequence_diagrams.drawio)
* **Docs Directory File**: [`docs/inbound_fifo_class_sequence_diagrams.drawio`](file:///c:/Users/THUY%20TOAN/OneDrive/Desktop/SWP2/FashionStoreNew/docs/inbound_fifo_class_sequence_diagrams.drawio)

The file contains **3 Dedicated Tabs** in 100% professional English:
1. **Tab 1: `Class Diagram - Inbound & FIFO`** (UML Class architecture with DTOs, Controller, Service, Repositories, and Entities).
2. **Tab 2: `Sequence - View Inbound Orders`** (Query / Read flow following the exact standard numbering convention 1 to 11 with `[Success]` and `[Fail]`).
3. **Tab 3: `Sequence - Create Inbound Order`** (Transactional creation flow with FIFO batch allocation and real-time inventory updates).

---

# 1. UML CLASS DIAGRAM (TAB 1)

### Structural Layout & Spacing:
* **Balanced Column Spacing (240px - 270px gap)**: Horizontally balanced lifelines (`Staff`, `View`, `Controller`, `Service`, `Repositories`, `DB`). Every message label fits comfortably with 15px - 25px breathing margin, preventing any text overflow while avoiding unnecessary emptiness or horizontal scrolling.
* **Pixel-Exact Arrow Connection**: All message arrows connect precisely to the outer edges of activation bars (`xC - 5` on the left, `xC + 5` on the right) with zero penetration.
* **Top (DTOs)**: `InboundOrderDTO` & `InboundBatchItemDTO`
* **Left (Interface)**: `«interface» IInboundOrderService`
* **Center (Core)**: `InboundOrderController` $\rightarrow$ `InboundOrderService`
* **Bottom Row (Repositories & Entities)**:
  * `InboundOrderRepository` $\diamond$---- `InboundOrder` (Receipt entity)
  * `InboundBatchRepository` $\diamond$---- `InboundBatch` (FIFO batch entity)
  * `ProductVariantRepository` $\diamond$---- `ProductVariant` (SKU stock entity)
* **Entity Relationships**:
  * `InboundOrder` (1) $\blacklozenge$--------- (1..*) `InboundBatch` (Composition)
  * `InboundBatch` (*) ----------- (1) `ProductVariant` (Association)

```mermaid
classDiagram
    direction TB

    class InboundOrderDTO {
        +batchCode: String
        +supplierName: String
        +supplierOrderCode: String
        +totalAmount: BigDecimal
        +batches: List~InboundBatchItemDTO~
    }

    class InboundBatchItemDTO {
        +batchId: Integer
        +sku: String
        +supplierSku: String
        +initialQuantity: Integer
        +remainingQuantity: Integer
    }

    class InboundOrderController {
        -inboundOrderService: IInboundOrderService
        -userId: Integer
        +createInboundOrder(dto): ResponseEntity
        +getInboundOrders(kw, catId, st): ResponseEntity
        +getBatches(kw, page, size): ResponseEntity
        +getInboundStats(): ResponseEntity
    }

    class IInboundOrderService {
        <<interface>>
    }

    class InboundOrderService {
        -inboundOrderRepo: InboundOrderRepository
        -inboundBatchRepo: InboundBatchRepository
        -variantRepo: ProductVariantRepository
        +createInboundOrder(dto, userId): InboundOrderDTO
        +getInboundOrders(kw, catId, st): List~InboundOrderDTO~
        +getBatchesPaged(page, size, kw, st): PageResponse
        +getInboundStats(): InboundStatsDTO
    }

    class InboundOrderRepository {
        <<interface>>
    }

    class InboundBatchRepository {
        <<interface>>
    }

    class ProductVariantRepository {
        <<interface>>
    }

    class InboundOrder {
        +inboundOrderId: Integer
        +batchCode: String
        +supplierName: String
        +supplierOrderCode: String
        +batches: List~InboundBatch~
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

    class ProductVariant {
        +variantId: Integer
        +sku: String
        +stockQuantity: Integer
        +price: BigDecimal
        +addStock(qty): void
        +deductStock(qty): void
    }

    InboundOrderController ..> InboundOrderDTO : depends on
    InboundOrderController ..> InboundBatchItemDTO : depends on
    InboundOrderController ..> IInboundOrderService : uses
    InboundOrderService ..|> IInboundOrderService : implements
    InboundOrderController ..> InboundOrderService : injects
    InboundOrderService ..> InboundOrderRepository : calls
    InboundOrderService ..> InboundBatchRepository : calls
    InboundOrderService ..> ProductVariantRepository : calls
    InboundOrderRepository o-- InboundOrder : aggregates
    InboundBatchRepository o-- InboundBatch : aggregates
    ProductVariantRepository o-- ProductVariant : aggregates
    InboundOrder "1" *-- "1..*" InboundBatch : contains
    InboundBatch "*" --> "1" ProductVariant : references SKU
```

---

# 2. SEQUENCE DIAGRAM: VIEW INBOUND ORDERS (TAB 2)

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff
    participant View as View
    participant Ctrl as :InboundOrderController
    participant Serv as :InboundOrderService
    participant Repo as :InboundOrderRepository
    participant DB as DB

    Staff->>View: 1. Click menu "Inbound Management"
    activate View
    View->>Ctrl: 2. call API GET /api/staff/inbound/orders
    activate Ctrl
    Ctrl->>Serv: 3. getInboundOrders(keyword, categoryId, status)
    activate Serv
    Serv->>Repo: 4. searchInboundOrders(keyword, categoryId, status)
    activate Repo
    Repo->>DB: 5. query DB: SELECT * FROM InboundOrders
    activate DB
    DB-->>Repo: 6. return orders recordset
    deactivate DB
    Repo-->>Serv: 7. return InboundOrder entities
    deactivate Repo

    Serv-->>Ctrl: 7.1 throw exception (if DB error occurs)
    Ctrl-->>View: 7.2 show error alert

    Serv->>Serv: 8. checkData() & mapToDtoList()

    alt [Success]
        Serv-->>Ctrl: 9. return List<InboundOrderDTO>
        Ctrl-->>View: 10. HTTP 200 OK (List<InboundOrderDTO>)
        View-->>Staff: 11. display inbound orders list
    else [Fail]
        Serv-->>Ctrl: 8.1 return error response (500)
        Ctrl-->>View: 8.2 return error response
        View-->>Staff: 8.3 display error alert
    end
    deactivate Serv
    deactivate Ctrl
    deactivate View
```

---

# 3. SEQUENCE DIAGRAM: CREATE INBOUND ORDER & FIFO BATCHES (TAB 3)

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Staff
    participant View as View
    participant Ctrl as :InboundOrderController
    participant Serv as :InboundOrderService
    participant Repo as :InboundOrderRepository
    participant BatchRepo as :InboundBatchRepository
    participant DB as DB

    Staff->>View: 1. Input receipt details & click "Confirm Inbound"
    activate View
    View->>Ctrl: 2. call API POST /api/staff/inbound/orders
    activate Ctrl
    Ctrl->>Serv: 3. createInboundOrder(dto, userId)
    activate Serv

    Serv->>Repo: 4. existsByBatchCode() & save(order)
    activate Repo
    Repo->>DB: 5. query DB: INSERT INTO InboundOrders
    activate DB
    DB-->>Repo: 6. return persisted order entity
    deactivate DB
    Repo-->>Serv: 7. return InboundOrder entity
    deactivate Repo

    Serv->>BatchRepo: 7.1 saveBatches(batches: ACTIVE FIFO)
    activate BatchRepo
    BatchRepo->>DB: 7.2 query DB: INSERT INTO InboundBatches
    activate DB
    DB-->>BatchRepo: 7.3 return saved batches
    deactivate DB
    BatchRepo-->>Serv: 7.4 return InboundBatch entities
    deactivate BatchRepo

    Serv-->>Ctrl: 7.5 throw exception (if DB error occurs)
    Ctrl-->>View: 7.6 show error alert

    Serv->>Serv: 8. validateData() & calculateFifoIndices()

    alt [Success]
        Serv-->>Ctrl: 9. return InboundOrderDTO (with FIFO batches)
        Ctrl-->>View: 10. HTTP 201 Created (InboundOrderDTO)
        View-->>Staff: 11. display success toast & update inventory
    else [Fail]
        Serv-->>Ctrl: 8.1 return error response (400)
        Ctrl-->>View: 8.2 return error response
        View-->>Staff: 8.3 display error alert
    end
    deactivate Serv
    deactivate Ctrl
    deactivate View
```
