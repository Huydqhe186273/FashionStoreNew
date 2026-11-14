# INTEGRATION TEST REPORT DOCUMENT
**GROUP 5 - SWP391**

---

### 1. Document Information
* **Project Name**: Fashion Store E-Commerce System
* **Project Code**: GROUP5_SWP391
* **Document Code**: GROUP5_Integration-Test_v1.0
* **Creator**: Nguyen Ba Cuong (HE186626)
* **Issue Date**: 12/11/2026
* **Version**: 1.0

---

### 2. Record of Change
| Effective Date | Version | Change Item | *A,D,M | Change Description | Reference |
| :--- | :--- | :--- | :---: | :--- | :--- |
| 12/11/2026 | 1.0 | Initial Test Document | A | Create Integration Test Report for Group 5 (Return & Refund 3-Step, Customer Management, Inbound FIFO, and Order Processing). | SRS_FashionStore_v1.0 |

---

### 3. Test Case List & Environment Setup
* **Test Environment Setup Description**:
  1. **Server**: Spring Boot 3.x, Embedded Tomcat, Java 17 (JDK 17.0.12), Port 8080.
  2. **Database**: Microsoft SQL Server 2022 (`FashionStoreDB`), HikariCP Connection Pool.
  3. **Web Browser**: Google Chrome v120+, Microsoft Edge.
  4. **Frontend**: React 18, Vite 6.x, Port 3000.
  5. **Third-Party Services**: PayOS Payment & Refund Gateway (Sandbox), Cloudinary CDN (Evidence photo storage).

| No | Function Name | Sheet Name | Description | Pre-Condition |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Customer Return Request Submission | Return & Refund Management | Customer submits return request with defect photos and bank details for COD orders. | Order status is "Delivered"; Customer is logged in. |
| **2** | 3-Step Return Processing | Return & Refund Management | Staff reviews request (Step 1), receives goods & restocks inventory (Step 2), and confirms refund (Step 3). | Return request exists in system; Staff logged in with `ROLE_STAFF`/`ROLE_ADMIN`. |
| **3** | Customer Account Management | Customer Management | Admin creates customer accounts with real-time duplicate validation for email/phone and manages active status. | Admin logged in with `ROLE_ADMIN`. |
| **4** | Inbound Order & FIFO Batch Tracking | Inbound & FIFO Inventory | Warehouse staff creates inbound procurement orders and tracks active batches following the FIFO principle. | Supplier and product variants exist in system. |
| **5** | Order Processing & FIFO Deduction | Order Management | Staff processes orders from Pending to Delivered and automatically deducts stock using FIFO. | Order placed by customer with available stock. |

---

### 4. Integration Test Statistics
| No | Module Code | Passed | Failed | Pending | N/A | Number of Test Cases |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | Return & Refund Management (`MOD_RET`) | 6 | 0 | 0 | 0 | 6 |
| 2 | Customer Account Management (`MOD_CUST`) | 3 | 0 | 0 | 0 | 3 |
| 3 | Inbound & FIFO Inventory (`MOD_INB`) | 3 | 0 | 0 | 0 | 3 |
| 4 | Order Processing & Fulfillment (`MOD_ORD`) | 3 | 0 | 0 | 0 | 3 |
| **Total** | | **15** | **0** | **0** | **0** | **15** |
| **Test Coverage** | | **100%** | | | | |
| **Test Successful Rate** | | **100%** | | | | |

---

### 5. Detailed Test Cases by Feature (Step-by-Step UI Testing)

#### Feature 1: 3-Step Return & Refund Management (`MOD_RET`)
* **Test Requirement**: End-to-end customer return request submission with defect proof, followed by staff 3-step physical and financial fulfillment.
* **Testing Round**: Round 1 (Passed: 6, Failed: 0, Pending: 0, N/A: 0)

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Note |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **TC-RET-01** | Customer submits return request with defect image & bank details | 1. Customer logs in successfully<br>2. Navigate to "Order History" page<br>3. Click "Return & Refund Request" button<br>4. Fill in Bank Name, Account Number, Account Holder<br>5. Select return reason and upload defect proof photo<br>6. Click "Confirm Request" button | - System shows success notification<br>- Order status updates to "Pending Return Approval"<br>- Evidence photo is uploaded and previewed | - Order status is "Delivered" | **Passed** | 12/11/2026 | Cuong | Tested with COD order |
| **TC-RET-02** | Prevent duplicate return request on the same order | 1. Customer opens order history with an order already having a pending return<br>2. Check return request button | - "Return & Refund" button is disabled or replaced with "Return Processing"<br>- System does not allow submitting duplicate request | - Order already has a pending return request | **Passed** | 12/11/2026 | Cuong | Duplicate request blocked |
| **TC-RET-03** | Staff approves return request (Step 1) | 1. Staff logs in to admin system<br>2. Open "Manage Orders" page<br>3. Click "View Detail" on order with return request<br>4. Review defect photo and customer reason<br>5. Click "Approve Return (Step 1)" button<br>6. Click "OK" in confirmation popup | - Request status updates to "return_approved"<br>- Stepper moves to Step 2 (Receive Goods & Restock)<br>- Bank account details are hidden at this step | - Order is in Step 1 (Waiting for shop approval) | **Passed** | 12/11/2026 | Cuong | Bank info hidden as required |
| **TC-RET-04** | Staff rejects invalid return request (Step 1) | 1. Staff opens order detail modal at Step 1<br>2. Click "Reject Request" button<br>3. Enter rejection reason for customer<br>4. Click "Confirm Rejection" | - Request status updates to "Rejected"<br>- Return workflow terminates<br>- Order remains in normal delivered state | - Order is in Step 1 | **Passed** | 12/11/2026 | Cuong | Customer keeps product |
| **TC-RET-05** | Staff receives returned goods & restocks inventory (Step 2) | 1. Staff opens order detail modal at Step 2<br>2. Inspect returned parcel delivered by courier<br>3. Click "Receive Goods & Restock" button<br>4. Click "OK" in confirmation popup | - Request status updates to "goods_received"<br>- Product variant stock quantity is restored to warehouse<br>- Stepper moves to Step 3 (Refund Customer) | - Order has been approved in Step 1 | **Passed** | 12/11/2026 | Cuong | Restock verified in DB |
| **TC-RET-06** | Staff confirms refund payout to customer (Step 3) | 1. Staff opens order detail modal at Step 3<br>2. View customer bank account details displayed on screen<br>3. Click "Copy" button to transfer refund money<br>4. Click "Confirm Refund Completed" button | - Return request status updates to "COMPLETED"<br>- Order status updates to "RETURNED"<br>- Refund payment is recorded as completed | - Order has completed Step 2 (Goods restocked) | **Passed** | 12/11/2026 | Cuong | Payout completed |

---

#### Feature 2: Customer Account Management (`MOD_CUST`)
* **Test Requirement**: Admin customer profile creation, duplicate email/phone validation, and account access control.
* **Testing Round**: Round 1 (Passed: 3, Failed: 0, Pending: 0, N/A: 0)

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Note |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **TC-CUST-01** | Add new customer with valid information | 1. Admin logs in to admin dashboard<br>2. Click "Customer Management" menu<br>3. Click "Add Customer" button<br>4. Enter Full Name, new Email, new Phone, Password<br>5. Click "Save Customer" button | - System shows success notification<br>- Modal closes automatically<br>- New customer appears in the customer table | - Admin logged in with Admin role | **Passed** | 12/11/2026 | Cuong | Saved into database |
| **TC-CUST-02** | Show error when adding duplicate email or phone | 1. Click "Add Customer" button<br>2. Enter an Email or Phone that already exists in the system<br>3. Click "Save Customer" button | - Red alert banner displays: "Email or Phone already exists"<br>- Modal remains open with entered values preserved<br>- Duplicate customer is NOT added to table | - Existing customer records in system | **Passed** | 12/11/2026 | Cuong | Offline mock bug fixed |
| **TC-CUST-03** | Lock customer account | 1. Locate the customer account in the table<br>2. Click "Lock Account" button<br>3. Click "Confirm" in confirmation dialog | - Customer status badge updates to "Inactive" (Locked)<br>- Customer cannot log in to the website anymore | - Customer account is in Active status | **Passed** | 12/11/2026 | Cuong | Account locked |

---

#### Feature 3: Inbound Procurement & FIFO Inventory (`MOD_INB`)
* **Test Requirement**: Warehouse inbound creation, supplier invoice tracking, and FIFO batch queue management.
* **Testing Round**: Round 1 (Passed: 3, Failed: 0, Pending: 0, N/A: 0)

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Note |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **TC-INB-01** | Create new inbound order with SKU items | 1. Warehouse staff logs in to system<br>2. Navigate to "Inbound Management" page (`/staff/inbound`)<br>3. Click "New Inbound Order" button<br>4. Select Supplier, enter Supplier Invoice Code<br>5. Add SKU items, enter Import Quantity and Cost Price<br>6. Click "Save Inbound Order" | - Inbound order saved successfully<br>- New active batches created in "FIFO Batches" list<br>- Variant stock quantity increases accordingly | - Staff logged in with `ROLE_STAFF`/`ROLE_ADMIN` | **Passed** | 12/11/2026 | Cuong | Stock updated |
| **TC-INB-02** | Track FIFO batches and trace supplier invoice | 1. Navigate to "Inbound Management" -> Tab "Batches"<br>2. Search by batch code or SKU<br>3. Check invoice trace link | - System displays batch details: initial quantity, remaining quantity, status (`ACTIVE`/`DEPLETED`)<br>- Displays linked Supplier Invoice code | - Existing inbound batches in system | **Passed** | 12/11/2026 | Cuong | Traceability verified |
| **TC-INB-03** | Server-side filter and pagination of inbound batches | 1. On "Batches" tab, select Category filter and Status filter (`ACTIVE`)<br>2. Click page 2 on pagination control | - Table refreshes with matching batches<br>- Server-side lazy loading executes without UI freezing | - More than 10 batches exist in DB | **Passed** | 12/11/2026 | Cuong | Fast loading |

---

#### Feature 4: Order Processing & FIFO Deduction (`MOD_ORD`)
* **Test Requirement**: Order status lifecycle advancement, automatic FIFO inventory deduction, and cancellation refund.
* **Testing Round**: Round 1 (Passed: 3, Failed: 0, Pending: 0, N/A: 0)

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester | Note |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **TC-ORD-01** | Confirm order and deduct stock by FIFO queue | 1. Staff opens "Manage Orders" page<br>2. Locate an order in `PENDING` status<br>3. Click "Confirm Order" button | - Order status updates to `PROCESSING`<br>- Inventory is deducted from the oldest active batch (`ImportDate` earliest)<br>- Batch remaining quantity decreases | - Order has items with available active batches | **Passed** | 12/11/2026 | Cuong | FIFO logic verified |
| **TC-ORD-02** | Advance order delivery status (Shipping to Delivered) | 1. Staff marks order as `SHIPPING`<br>2. Hand over package to courier<br>3. When customer receives package, staff/customer confirms delivery | - Order status updates to `DELIVERED`<br>- For COD orders, payment status updates to `paid`<br>- Order badge displays "Delivered" | - Order is in `SHIPPING` status | **Passed** | 12/11/2026 | Cuong | COD payment updated |
| **TC-ORD-03** | Cancel order and automatically refund via PayOS | 1. Staff opens order detail of an online-paid order in `PROCESSING` status<br>2. Click "Cancel Order" button<br>3. Enter cancellation reason and confirm | - Order status updates to `CANCELLED`<br>- Items are automatically restocked into active batches<br>- PayOS automated refund executes successfully | - Order was paid via PayOS online | **Passed** | 12/11/2026 | Cuong | Auto refund executed |

---

### 6. Security & Access Control Scenarios
| Test Case ID | Scenario Name | Role / Session | Coverage Technique | Given (Pre-condition) | When (Action / Step) | Then (Expected Result) | Status | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-SEC-01** | Bank details hidden from unauthorized stages | Customer / Staff (Step 1-2) | Use Case Testing | Order has return request at Step 1 or Step 2 | View order details | Bank account details card is completely hidden from screen | **Passed** | None |
| **TC-SEC-02** | Customer cannot approve their own return | Customer | Role Authorization | Order has pending return request | Customer attempts to trigger staff approval button/endpoint | Access denied (HTTP 403 Forbidden) | **Passed** | None |
| **TC-SEC-03** | Unauthenticated user cannot access staff order management | Guest (No login session) | Boundary / Security | User has not logged in | Open `/admin/orders` or `/staff/inbound` directly | System redirects to `/login` page | **Passed** | None |

