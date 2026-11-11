-- Update CHECK constraint on Orders.OrderStatus and Orders.PaymentStatus
-- to support all statuses used by StaffOrderService and OrderService (both uppercase and lowercase).

-- Step 1: Drop existing CHECK constraint on Orders.OrderStatus
DECLARE @constraintName NVARCHAR(200);

SELECT @constraintName = cc.CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cu
    ON cc.CONSTRAINT_NAME = cu.CONSTRAINT_NAME
WHERE cu.TABLE_NAME = 'Orders'
  AND cu.COLUMN_NAME = 'OrderStatus';

IF @constraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.Orders DROP CONSTRAINT [' + @constraintName + ']');
END
GO

-- Step 2: Add flexible CHECK constraint for Orders.OrderStatus
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS
    WHERE CONSTRAINT_NAME = 'CK_Orders_OrderStatus'
)
BEGIN
    ALTER TABLE dbo.Orders
    ADD CONSTRAINT CK_Orders_OrderStatus
    CHECK (UPPER(OrderStatus) IN (
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPING',
        'SHIPPED',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
        'RETURNED'
    ));
END
GO

-- Step 3: Check & update PaymentStatus constraint if needed
DECLARE @payConstraintName NVARCHAR(200);

SELECT @payConstraintName = cc.CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cu
    ON cc.CONSTRAINT_NAME = cu.CONSTRAINT_NAME
WHERE cu.TABLE_NAME = 'Orders'
  AND cu.COLUMN_NAME = 'PaymentStatus';

IF @payConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.Orders DROP CONSTRAINT [' + @payConstraintName + ']');
END
GO

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS
    WHERE CONSTRAINT_NAME = 'CK_Orders_PaymentStatus'
)
BEGIN
    ALTER TABLE dbo.Orders
    ADD CONSTRAINT CK_Orders_PaymentStatus
    CHECK (UPPER(PaymentStatus) IN (
        'UNPAID',
        'PAID',
        'REFUNDED',
        'FAILED'
    ));
END
GO

