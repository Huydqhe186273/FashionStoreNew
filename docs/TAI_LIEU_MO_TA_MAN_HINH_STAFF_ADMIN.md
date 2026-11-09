# UI Conceptual Screen Specification: Staff & Admin Interfaces
**System:** FashionStore E-Commerce Management System  
**Document Standard:** Conceptual Screen Mockup & Field Description Dictionary (Iteration 2)  
**Order:** Aligned sequentially with the Admin & Staff Sidebar Menu (from Dashboard downwards)

---

### 14.2 . Admin Analytics Dashboard
#### 14.2.1 Admin Analytics Dashboard (UC-15, Iter2)
Executive business performance metrics, sales trend charts, and operational summary dashboard.

Figure FR-15. Admin Analytics Dashboard – conceptual screen mockup.

**Brief Description:** This screen provides top-level executive visibility into store operations and commercial performance. It aggregates real-time transactional data into KPI summary tiles, interactive monthly revenue trend charts, recent transaction logs, and rapid access to all administrative management modules via the persistent sidebar navigation.

| Field Name | Description |
| :--- | :--- |
| **Sidebar Menu Links** | Persistent navigation menu allowing quick access to all administrative modules. |
| **User Profile & Logout** | Displays logged-in administrator information and session logout button. |
| **Screen Title & Subtitle** | Identifies the dashboard screen and states its real-time data monitoring purpose. |
| **System Status Indicator** | Visual badge indicating active communication status with the backend service. |
| **Refresh Data Button** | Triggers manual reloading of the latest business metrics and charts. |
| **Total Revenue KPI Card** | Displays aggregate gross monetary earnings from completed customer orders. |
| **Total Orders KPI Card** | Displays total count of purchase orders processed by the system. |
| **Total Products & Stock KPI** | Displays the count of master catalog items and total physical warehouse units. |
| **Total Users & Customers KPI** | Displays the count of registered system users and customer accounts. |
| **Monthly Revenue Trend Chart** | Line and area graph visualizing revenue fluctuations across calendar months. |
| **Recent Orders Table** | Displays a summary list of the most recent customer orders with code, customer name, total, and status. |

---

### 14.3 . Customer Account Management
#### 14.3.1 Customer Account Management (UC-16, Iter2)
Customer profile administration, purchase history tracking, and security access control interface.

Figure FR-16. Customer Account Management – conceptual screen mockup.

**Brief Description:** This screen allows system administrators to oversee customer user accounts, inspect lifetime order activity, update profile contact details, and enforce account security via instant status toggling (Active / Locked).

| Field Name | Description |
| :--- | :--- |
| **Customer Search Input** | Text box to search customer accounts by name, email, or telephone number. |
| **Account Status Filter** | Dropdown to filter displayed accounts by active or locked standing. |
| **Add New Customer Button** | Opens a modal dialog to manually register a new customer account. |
| **Customer Full Name Input** | Text box where the administrator inputs the customer's legal full name. |
| **Email Address Input** | Unique email address input used for account identification and authentication. |
| **Phone Number Input** | Text box capturing the customer's contact telephone number. |
| **Account Status Selector** | Radio selection setting account standing to active or locked. |
| **Save Customer Button** | Submits and saves customer account information into the system. |
| **Customer Accounts Table** | Grid displaying User ID, Full Name, Email, Phone, Role, Total Orders, and Status. |
| **Account Status Badge** | Color-coded indicator displaying the customer's active or suspended standing. |
| **Edit Profile Button** | Opens the modal dialog to update customer contact details. |
| **Toggle Lock / Unlock Button** | In-row action button to immediately suspend or reactivate the customer account. |

---

### 14.4 . Staff & Permission Management
#### 14.4.1 Staff & Permission Management (UC-17, Iter2)
Internal employee account provisioning, administrative privilege assignment, and access control interface.

Figure FR-17. Staff & Permission Management – conceptual screen mockup.

**Brief Description:** This screen enables top-level administrators to create and manage operational staff accounts, designate system authorization roles (Staff vs. Admin), reset employee credentials, and suspend account privileges.

| Field Name | Description |
| :--- | :--- |
| **Staff Search Input** | Text box to search employee records by name, email, or phone. |
| **Role Filter Dropdown** | Dropdown menu to filter staff accounts by privilege level (Admin or Staff). |
| **Status Filter Dropdown** | Dropdown menu to filter staff accounts by active or suspended state. |
| **Add New Staff Button** | Opens a modal dialog to provision a new internal staff member. |
| **Staff Full Name Input** | Text box capturing the employee's formal full name. |
| **Work Email Input** | Text box recording enterprise email used for staff login credentials. |
| **Initial Password Input** | Secure text box establishing default login password for the employee. |
| **Phone Number Input** | Text box recording employee direct contact telephone number. |
| **System Role Selector** | Dropdown menu assigning permission scope (Administrator or Operational Staff). |
| **Save Staff Button** | Submits and provisions the employee account in the database. |
| **Staff Accounts Table** | Grid displaying Staff ID, Full Name, Work Email, Phone, Role Badge, and Status. |
| **Role Privilege Badge** | Color-coded visual pill indicating employee system authority level. |
| **Edit Staff Button** | Opens modal dialog to update employee information or reassign roles. |
| **Toggle Lock Button** | Action button to suspend or reinstate staff system access privileges. |

---

### 14.5 . Order Fulfillment & Return Management
#### 14.5.1 Order Fulfillment & Return Management (UC-18, Iter2)
End-to-end sales order processing, delivery tracking, and customer return/refund workflow interface.

Figure FR-18. Order Fulfillment & Return Management – conceptual screen mockup.

**Brief Description:** This screen empowers fulfillment staff and administrators to supervise order execution across all lifecycle stages (Pending, Processing, Shipped, Delivered, Cancelled, Returned). It supports status progression, Return-To-Origin (RTO/failed delivery) handling, and a dedicated Return & Refund processing modal with bank account validation and FIFO inventory restock.

| Field Name | Description |
| :--- | :--- |
| **Order Search Field** | Text box to search orders by Order ID, customer name, phone number, or email. |
| **Status Filter Tabs** | Quick-selection tabs to filter orders by lifecycle stage (Pending, Processing, Shipped, Delivered, Cancelled, Returned). |
| **Orders List Table** | Summary grid displaying Order ID, Customer, Phone, Date, Status, Payment Status, and Total Amount. |
| **Order Status Badge** | Color-coded indicator highlighting current operational progress of the parcel. |
| **Payment Status Badge** | Indicator displaying financial settlement state (Paid, Unpaid COD, or Refunded). |
| **View Order Details Button** | Opens a modal displaying full recipient shipping address, ordered items, and price breakdown. |
| **Order Items Table** | Displays ordered product thumbnails, variant details (color, size), quantity, and line totals. |
| **Price Breakdown Summary** | Displays itemized subtotal, delivery fee, promotional discount deduction, and final grand total. |
| **Order Status Selector** | Dropdown enabling authorized staff to advance the order lifecycle state. |
| **Confirm Status Update Button**| Saves status transition, triggers customer email notifications, and updates warehouse logs. |
| **Mark RTO (Failed Delivery)** | Flags parcel as undeliverable and automatically triggers inventory restock. |
| **Process Return & Refund Button**| Opens the return evaluation and refund settlement dialog for eligible orders. |
| **Return Reason Dropdown** | Dropdown selector categorizing customer reason for product return. |
| **Refund Amount Input** | Monetary input defining the reimbursement sum approved for refund. |
| **Bank Account Information** | Text inputs capturing customer destination bank name, account number, and holder name. |
| **Restock to FIFO Checkbox** | Toggle option determining whether returned goods are restored to active warehouse batches. |
| **Approve & Execute Refund Button** | Finalizes refund disbursement, commits inventory restoration, and logs audit record. |

---

### 14.6 . Product Catalog Management
#### 14.6.1 Product Catalog Management (UC-19, Iter2)
Centralized master product catalog, pricing, and media gallery management interface.

Figure FR-19. Product Catalog Management – conceptual screen mockup.

**Brief Description:** This screen provides store administrators and staff with comprehensive catalog authoring capabilities. Users can create, update, categorize, search, activate/deactivate master products, upload high-resolution media to Cloudinary CDN, and transition seamlessly to variant configuration.

| Field Name | Description |
| :--- | :--- |
| **Product Search Field** | Text box enabling real-time lookup across product titles and keywords. |
| **Category Filter Dropdown** | Dropdown menu filtering displayed catalog items by merchandise category. |
| **Status Filter Dropdown** | Dropdown filtering products by storefront visibility status (Active or Inactive). |
| **Add New Product Button** | Opens the modal dialog to create a new master catalog product. |
| **Product Title Input** | Text box where staff enters the commercial name of the apparel item. |
| **Category Selector** | Dropdown menu assigning the parent merchandise category. |
| **Base Price Input** | Currency input defining the standard retail selling price before promotions. |
| **Product Status Toggle** | Switch control determining if the product is immediately visible on the customer storefront. |
| **Description Textarea** | Multi-line text field capturing detailed fabric, design, and styling information. |
| **Product Image Upload Zone** | Drag-and-drop file uploader and URL input with thumbnail preview for CDN storage. |
| **Save Product Button** | Validates product data, uploads media, saves record, and prompts for variant creation. |
| **Products List Table** | Master table showing Thumbnail, Product Name, Category, Base Price, Total Stock, and Status. |
| **Product Status Switch** | In-row toggle switch to quickly activate or deactivate an item on the public storefront. |
| **Edit Product Action** | Opens modal dialog populated with existing item data for updating. |
| **Manage Media Gallery Action** | Opens gallery manager to upload secondary lifestyle photos and set primary thumbnail. |
| **Configure Variants Action** | Navigation button routing staff directly to Variant Management for the chosen product. |

---

### 14.7 . Product Variant Management
#### 14.7.1 Product Variant Management (UC-20, Iter2)
Multi-attribute SKU generator and variant inventory level management interface.

Figure FR-20. Product Variant Management – conceptual screen mockup.

**Brief Description:** This screen enables warehouse and catalog personnel to configure specific product variations (colors, sizes, and SKUs) and maintain exact stock quantities across variants. It features an automated multi-attribute Matrix Generator and direct links to warehouse replenishment.

| Field Name | Description |
| :--- | :--- |
| **Variant Search Input** | Text box to search variants by SKU code, color, size, or parent product title. |
| **Parent Product Filter** | Dropdown menu filtering variants by a specific master product. |
| **Stock Level Filter** | Dropdown menu filtering variants by availability (All, In Stock, Out of Stock). |
| **Matrix Generator Button** | Opens the automated tool to generate combinations of sizes and colors simultaneously. |
| **Matrix Target Product** | Dropdown selecting the parent master product for batch variant generation. |
| **Matrix Colors Tag Input** | Tagging input to add and select color attributes for the batch. |
| **Matrix Sizes Tag Input** | Tagging input to add and select size attributes (e.g., S, M, L, XL). |
| **Generate Matrix Button** | Automatically generates the cartesian product of colors and sizes with unique SKUs. |
| **Add Single Variant Button** | Opens a modal to manually author an individual SKU variant. |
| **Size & Color Inputs** | Input fields specifying the size and color attributes of the variant. |
| **SKU Code Input** | Unique stock-keeping unit identifier field, auto-generated or manually defined. |
| **Save Variant Button** | Validates SKU uniqueness and stores the variant configuration. |
| **Variants Data Table** | Displays Variant ID, Parent Product Name, Color, Size, SKU Code, and Current Stock. |
| **Stock Status Badge** | Visual indicator highlighting whether the variant is currently in stock or depleted. |
| **Direct Restock Button** | Quick action redirecting staff to the Inbound Receipt form with this variant pre-selected. |
| **Edit / Delete Actions** | Action buttons to modify variant attributes or delete unused variants. |

---

### 14.8 . Inbound Inventory Management
#### 14.8.1 Inbound Inventory Management (UC-21, Iter2)
Warehouse inbound receipt creation and FIFO batch inventory tracking interface.

Figure FR-21. Inbound Inventory Management – conceptual screen mockup.

**Brief Description:** This screen provides comprehensive inventory replenishment and batch lifecycle tracking. It allows warehouse staff and managers to create new inbound shipments, record supplier invoices, validate variant stock intake, and monitor individual batch depletion using First-In-First-Out (FIFO) tracking.

| Field Name | Description |
| :--- | :--- |
| **Orders / Batches Tab Switcher**| Toggles between the list of Inbound Receipts and the detailed FIFO Batches view. |
| **Inventory Metric Cards** | Top cards summarizing total inbound receipts, active batches, and total available stock units. |
| **Inbound Search & Category Filter**| Controls to search shipments by batch code or filter by merchandise category. |
| **Create Inbound Order Button** | Opens modal dialog to author and submit a new warehouse stock replenishment receipt. |
| **Auto-Generated Batch Code** | System auto-generated, read-only batch identifier ensuring uniqueness across shipments. |
| **Supplier Name Field** | Text field recording the designated vendor or apparel factory supplying the goods. |
| **Import Category Selector** | Dropdown menu assigning the parent merchandise category for the delivery. |
| **Automatic Order Timestamp** | System automatically captures and logs the exact local date and time upon receipt submission. |
| **Receipt Notes Textarea** | Multi-line text field for recording invoice numbers or delivery notes. |
| **Product & Variant Selectors** | Dropdown menus allowing staff to select the specific master product and variant received. |
| **Inbound Quantity Stepper** | Numeric input field specifying the received quantity for the selected variant. |
| **Import Unit Price Field** | Monetary input recording wholesale purchase cost per unit paid to supplier. |
| **Add / Remove Line Item Buttons**| Controls to add multiple variant rows to the receipt or delete unwanted draft rows. |
| **Receipt Grand Total Summary** | Dynamic display computing the total monetary cost of the replenishment shipment. |
| **Submit Inbound Receipt Button**| Validates inputs, increases warehouse inventory, and logs FIFO batch records. |
| **Inbound Receipts Table** | Displays existing shipments showing Batch Code, Supplier, Date, Total Amount, and Receiver. |
| **View Receipt Details Button** | Opens modal dialog displaying itemized manifest of products and quantities in the receipt. |
| **FIFO Batches Table** | Detailed grid displaying Batch Code, Variant SKU, Import Date, Original Qty, and Remaining Stock. |

---

### 14.9 . Category Management
#### 14.9.1 Category Management (UC-22, Iter2)
Hierarchical taxonomy, gender classification, and fashion collection management interface.

Figure FR-22. Category Management – conceptual screen mockup.

**Brief Description:** This screen enables administrators and merchandise staff to define and maintain the fashion store's catalog taxonomy. It supports multi-level parent-child category hierarchies, target gender tagging (Men, Women, Unisex), and seasonal collection attribution.

| Field Name | Description |
| :--- | :--- |
| **Category Search Field** | Text box allowing lookup of categories by name or keyword. |
| **Gender Filter Dropdown** | Dropdown menu filtering categories by target demographic (Men, Women, Unisex). |
| **Add New Category Button** | Opens modal dialog to create a new catalog category. |
| **Category Name Input** | Text field where staff enters the public category name. |
| **Target Gender Radio Selector** | Option selector specifying the gender demographic (Men, Women, Unisex). |
| **Season Classification Dropdown**| Selector assigning seasonal collection attribution (Spring-Summer, Fall-Winter, All Seasons). |
| **Parent Category Dropdown** | Dropdown menu to establish taxonomy hierarchy or define top-level root categories. |
| **Save Category Button** | Submits and saves category definition into the system. |
| **Categories Data Table** | Displays Category ID, Name, Target Gender, Season Attribute, Parent Category, and Product Count. |
| **Product Count Badge** | Counter displaying the total number of catalog products currently assigned to the category. |
| **Edit / Delete Action Buttons** | Action buttons to modify category attributes or safely remove unused categories. |

---

### 14.10 . Coupon & Promotion Management
#### 14.10.1 Coupon & Promotion Management (UC-23, Iter2)
Promotional voucher configuration, discount rule builder, and campaign lifecycle management interface.

Figure FR-23. Coupon & Promotion Management – conceptual screen mockup.

**Brief Description:** This screen enables administrators to create, schedule, and track promotional discount vouchers. It supports both percentage-based and fixed-amount monetary deductions, minimum order spending thresholds, usage limits, and validity period controls.

| Field Name | Description |
| :--- | :--- |
| **Coupon Search Input** | Text box to search vouchers by promotional code string. |
| **Discount Type Filter** | Dropdown menu filtering vouchers by percentage or fixed monetary discount. |
| **Promotion Status Filter** | Dropdown menu filtering vouchers by active, expired, or disabled state. |
| **Create New Coupon Button** | Opens modal dialog to construct and publish a new discount voucher. |
| **Voucher Code Input** | Text box where administrator specifies the public coupon code string. |
| **Discount Type Selector** | Toggle/dropdown selecting deduction model: Percentage or Fixed Monetary Amount. |
| **Discount Value Input** | Numeric input defining the percentage rate or exact cash deduction value. |
| **Minimum Order Threshold** | Monetary input defining minimum basket total required to apply the discount. |
| **Start & End Date Pickers** | Datetime selectors establishing the active validity timeframe of the promotional campaign. |
| **Usage Limit Cap Input** | Numeric input setting maximum cumulative number of times the voucher can be redeemed. |
| **Save Coupon Button** | Validates terms, checks dates, and publishes the discount voucher into the system. |
| **Coupons List Table** | Master grid displaying Code, Type, Discount Value, Minimum Spend, Validity Dates, and Status. |
| **Copy Code Action Button** | One-click shortcut copying the promo code directly to user clipboard. |
| **Redemption Counter Badge** | Displays current claimed redemptions relative to total allocated usage cap. |
| **Edit / Toggle Status Actions**| Action buttons to adjust campaign terms or instantly pause and reactivate vouchers. |

---

### 14.11 . Business Financial & Sales Reports
#### 14.11.1 Business Financial & Sales Reports (UC-24, Iter2)
Financial statement generation, sales performance analytics, and date-range reporting interface.

Figure FR-24. Business Financial & Sales Reports – conceptual screen mockup.

**Brief Description:** This screen allows store executives and finance personnel to inspect consolidated revenue, analyze profit margins, evaluate return rates, and export periodic sales statements using flexible custom date ranges or quick-preset periods.

| Field Name | Description |
| :--- | :--- |
| **Date Range Pickers** | Calendar pickers establishing custom start and end boundaries for the reporting period. |
| **Quick Presets Buttons** | One-click shortcuts setting predefined date ranges (Last 7 Days, Last 30 Days, This Year). |
| **Apply Filter Button** | Executes data aggregation and recalculates all metrics according to the selected dates. |
| **Report Category Tabs** | Toggles views between Revenue & Financials, Orders & Conversion, and Bestsellers. |
| **Gross Revenue KPI Card** | Displays aggregate sales revenue earned within the selected reporting timeframe. |
| **Net Estimated Profit KPI** | Computed monetary metric showing estimated profits after wholesale cost deductions. |
| **Completed Orders KPI** | Total count of sales orders successfully delivered within the timeframe. |
| **Return & Refund Rate KPI** | Percentage indicator reflecting the proportion of delivered orders subjected to returns. |
| **Average Order Value (AOV) KPI**| Average revenue generated per customer transaction across the filtered period. |
| **Periodic Breakdown Table** | Granular tabular view displaying sales revenue and order volume broken down by day or month. |
| **Best Selling Products Table** | Ranked list of merchandise showing units sold and revenue contribution share. |
| **Export / Print Report Button** | Generates exportable summary spreadsheets or formatted statements for accounting records. |


---

# PART II. STAFF PORTAL SCREENS (MÀN HÌNH DÀNH CHO NHÂN VIÊN)
> Khi người dùng đăng nhập bằng tài khoản **Nhân viên (Staff)**, hệ thống áp dụng cơ chế phân quyền (Role-Based Access Control): ẩn các màn hình nhạy cảm về doanh thu (Dashboard, Báo cáo) và quản trị nhân sự (Khách hàng, Nhân viên, Mã giảm giá). Màn hình mặc định khi đăng nhập là **Xử lý Đơn Hàng** (`/staff/orders`).

---

### 14.12 . Staff Order Processing & Returns
#### 14.12.1 Staff Order Processing & Returns (UC-25, Iter2)
Daily order fulfillment workflow, delivery tracking, and return/refund processing interface for staff.

Figure FR-25. Staff Order Processing – conceptual screen mockup.

**Brief Description:** This screen serves as the primary operational workspace for warehouse and customer service staff. It allows staff members to monitor new customer orders, update delivery status (Processing, Shipped, Delivered), flag undeliverable parcels (RTO), and handle customer return/refund requests with bank account validation.

| Field Name | Description |
| :--- | :--- |
| **Staff Sidebar Navigation** | Operational sidebar displaying only staff-authorized modules (Orders, Products, Variants, Inbound, Categories). |
| **Staff User Profile & Logout** | Displays staff employee identity (`Nhân viên (Staff)`), email badge, and session logout button. |
| **Order Search Field** | Text box to search customer orders by Order ID, recipient name, phone number, or email. |
| **Status Quick-Filter Tabs** | Tabs to filter orders by operational stage: All, Pending, Processing, Shipped, Delivered, Cancelled, Returned. |
| **Staff Orders Grid Table** | Displays Order ID, Customer Name, Phone, Creation Date, Order Status, Payment Status, and Total Amount. |
| **Operational Status Badge** | Color-coded indicator highlighting whether the parcel is pending packing, in transit, or completed. |
| **Payment Status Badge** | Visual pill indicating whether payment was settled online via PayOS VietQR or pending COD cash collection. |
| **Order Details Button** | Opens the order manifest modal displaying customer shipping address, ordered items, and price breakdown. |
| **Order Status Selector** | Dropdown control allowing staff to advance order lifecycle (e.g., transitioning from Processing to Shipped). |
| **Confirm Status Update Button**| Saves status transition, triggers customer status update notifications, and logs fulfillment history. |
| **Mark RTO (Return to Origin)** | Action button for delivery failure or customer rejection, triggering automatic stock replenishment. |
| **Process Return & Refund Button**| Opens appraisal dialog for delivered orders when customer requests an exchange or refund. |
| **Return Reason Dropdown** | Dropdown categorizing return cause (Defective fabric, Incorrect size sent, Shipping damage). |
| **Refund Amount Input** | Monetary input specifying verified refund reimbursement amount. |
| **Customer Bank Account Fields** | Text inputs capturing beneficiary bank name, account number, and verified recipient name. |
| **Restock to FIFO Checkbox** | Toggle allowing staff to return undamaged goods back into active warehouse inventory. |
| **Approve & Execute Refund Button** | Submits refund authorization, logs reversal, and updates order status to Returned. |

---

### 14.13 . Staff Inbound Inventory Management
#### 14.13.1 Staff Inbound Inventory Management (UC-26, Iter2)
Warehouse goods receipt authoring and FIFO batch tracking interface for staff.

Figure FR-26. Staff Inbound Inventory Management – conceptual screen mockup.

**Brief Description:** This screen allows warehouse staff to receive shipments from garment factories and suppliers, enter batch manifests, validate delivered variant quantities against invoices, and supervise FIFO batch depletion.

| Field Name | Description |
| :--- | :--- |
| **Orders / Batches Tab Switcher**| Toggles between the list of Inbound Shipments and the detailed FIFO Batches Tracking view. |
| **Warehouse Metric Summary Cards**| Top overview cards displaying total processed shipments, active warehouse batches, and available physical stock. |
| **Batch Search & Category Filter**| Search bar to look up shipments by batch code or filter manifests by apparel category. |
| **Create Inbound Receipt Button**| Opens a popup dialog to record a new warehouse stock delivery. |
| **Auto-Generated Batch Code** | System auto-generated, read-only batch identifier ensuring uniqueness across shipments. |
| **Supplier Name Input** | Text box recording garment vendor or manufacturing supplier for the delivery. |
| **Category Selector** | Dropdown designating product category for the inbound goods. |
| **Automatic Order Timestamp** | System automatically captures and logs the exact local date and time upon receipt submission. |
| **Receipt Notes Field** | Remarks area for invoice reference numbers and container notes. |
| **Product & Variant Pickers** | Dropdown selectors to choose received master product and specific color/size variant. |
| **Quantity Received Stepper** | Numeric field specifying the physical count of units received for the variant. |
| **Unit Import Price Input** | Monetary field recording wholesale purchase cost per item. |
| **Add / Remove Row Buttons** | Controls to add multiple variant rows to the receipt or delete invalid rows. |
| **Calculated Total Cost** | Dynamic summary displaying total invoice expenditure for the shipment. |
| **Submit Inbound Receipt Button**| Confirms receipt, increases variant stock, and registers FIFO tracking records. |
| **Inbound Receipts Table** | Grid showing existing shipments with Batch Code, Supplier, Date, Total Cost, and Receiving Staff. |
| **View Manifest Details Button** | Opens modal displaying itemized line items, variant SKUs, quantities, and costs. |
| **FIFO Batches Grid** | Table tracking individual batch lifecycle: Batch Code, SKU, Import Date, Original Qty, and Remaining Stock. |

---

### 14.14 . Staff Product Catalog Management
#### 14.14.1 Staff Product Catalog Management (UC-27, Iter2)
Master product information authoring, pricing, and media gallery upload interface for staff.

Figure FR-27. Staff Product Catalog Management – conceptual screen mockup.

**Brief Description:** This screen allows merchandise staff to create and edit apparel products, configure base retail pricing, draft fabric and care descriptions, upload media to Cloudinary CDN, and seamlessly proceed to variant configuration.

| Field Name | Description |
| :--- | :--- |
| **Product Search Field** | Text box enabling real-time search across product titles and codes. |
| **Category Filter Dropdown** | Dropdown filtering product list by merchandise category. |
| **Status Filter Dropdown** | Dropdown filtering items by storefront publication state (Active or Inactive). |
| **Add New Product Button** | Opens modal dialog to register a new master product in the system. |
| **Product Title Input** | Text box where staff enters the commercial name of the apparel item. |
| **Category Selector** | Dropdown menu assigning the parent merchandise category. |
| **Base Price Input** | Currency input establishing standard retail price before promotions. |
| **Publication Status Toggle** | Switch determining whether the product is published to the customer shop. |
| **Description Textarea** | Multi-line text field capturing fabric composition and care instructions. |
| **Product Image Upload Zone** | Drag-and-drop file uploader and URL input with thumbnail preview for CDN storage. |
| **Save Product Button** | Validates product data, uploads media, saves record, and prompts for variant creation. |
| **Products List Table** | Master table showing Thumbnail, Product Name, Category, Base Price, Total Stock, and Status. |
| **Product Status Switch** | In-row toggle switch to quickly activate or deactivate an item on the public storefront. |
| **Edit Product Action** | Opens modal dialog populated with existing item data for updating. |
| **Manage Media Gallery Action** | Opens gallery manager to upload secondary lifestyle photos and set primary thumbnail. |
| **Configure Variants Action** | Navigation button routing staff directly to Variant Management for the chosen product. |

---

### 14.15 . Staff Variant Management
#### 14.15.1 Staff Variant Management (UC-28, Iter2)
Multi-attribute SKU generator and variant inventory level management interface for staff.

Figure FR-28. Staff Variant Management – conceptual screen mockup.

**Brief Description:** This screen enables warehouse and catalog personnel to configure specific product variations (colors, sizes, and SKUs) and maintain exact stock quantities across variants. It features an automated multi-attribute Matrix Generator and direct links to warehouse replenishment.

| Field Name | Description |
| :--- | :--- |
| **Variant Search Input** | Text box to search variants by SKU code, color, size, or parent product title. |
| **Parent Product Filter** | Dropdown menu filtering variants by a specific master product. |
| **Stock Level Filter** | Dropdown menu filtering variants by availability (All, In Stock, Out of Stock). |
| **Matrix Generator Button** | Opens the automated tool to generate combinations of sizes and colors simultaneously. |
| **Matrix Target Product** | Dropdown selecting the parent master product for batch variant generation. |
| **Matrix Colors Tag Input** | Tagging input to add and select color attributes for the batch. |
| **Matrix Sizes Tag Input** | Tagging input to add and select size attributes (e.g., S, M, L, XL). |
| **Generate Matrix Button** | Automatically generates the cartesian product of colors and sizes with unique SKUs. |
| **Add Single Variant Button** | Opens a modal to manually author an individual SKU variant. |
| **Size & Color Inputs** | Input fields specifying the size and color attributes of the variant. |
| **SKU Code Input** | Unique stock-keeping unit identifier field, auto-generated or manually defined. |
| **Save Variant Button** | Validates SKU uniqueness and stores the variant configuration. |
| **Variants Data Table** | Displays Variant ID, Parent Product Name, Color, Size, SKU Code, and Current Stock. |
| **Stock Status Badge** | Visual indicator highlighting whether the variant is currently in stock or depleted. |
| **Direct Restock Button** | Quick action redirecting staff to the Inbound Receipt form with this variant pre-selected. |
| **Edit / Delete Actions** | Action buttons to modify variant attributes or delete unused variants. |

---

### 14.16 . Staff Category Management
#### 14.16.1 Staff Category Management (UC-29, Iter2)
Merchandise category taxonomy, target gender, and seasonal collection management interface for staff.

Figure FR-29. Staff Category Management – conceptual screen mockup.

**Brief Description:** This screen enables merchandise staff to organize the store catalog into hierarchical categories, configure gender demographic tags (Men, Women, Unisex), and assign apparel items to seasonal collections.

| Field Name | Description |
| :--- | :--- |
| **Category Search Field** | Text box allowing staff to search categories by name or keyword. |
| **Gender Filter Dropdown** | Dropdown menu filtering categories by target demographic (Men, Women, Unisex). |
| **Add New Category Button** | Opens modal dialog to create a new catalog category. |
| **Category Name Input** | Text field where staff enters the public category name. |
| **Target Gender Radio Selector** | Option selector specifying the gender demographic (Men, Women, Unisex). |
| **Season Classification Dropdown**| Selector assigning seasonal collection attribution (Spring-Summer, Fall-Winter, All Seasons). |
| **Parent Category Dropdown** | Dropdown menu to establish taxonomy hierarchy or define top-level root categories. |
| **Save Category Button** | Submits and saves category definition into the system. |
| **Categories Data Table** | Displays Category ID, Name, Target Gender, Season Attribute, Parent Category, and Product Count. |
| **Product Count Badge** | Counter displaying the total number of catalog products currently assigned to the category. |
| **Edit / Delete Action Buttons** | Action buttons to modify category attributes or safely remove unused categories. |
