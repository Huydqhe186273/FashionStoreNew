-- Drop the old CHECK constraint on ReturnRequests.Status and recreate it
-- with all status values used by the 3-step return process feature.
-- Old allowed values: pending, approved, rejected
-- New additional values: return_approved, goods_received, COMPLETED

-- Step 1: Drop the existing CHECK constraint on Status column (name may vary)
DECLARE @constraintName NVARCHAR(200);

SELECT @constraintName = cc.CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE cu
    ON cc.CONSTRAINT_NAME = cu.CONSTRAINT_NAME
WHERE cu.TABLE_NAME = 'ReturnRequests'
  AND cu.COLUMN_NAME = 'Status';

IF @constraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.ReturnRequests DROP CONSTRAINT [' + @constraintName + ']');
END
GO

-- Step 2: Add new CHECK constraint allowing all 3-step return process statuses
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS
    WHERE CONSTRAINT_NAME = 'CK_ReturnRequests_Status'
)
BEGIN
    ALTER TABLE dbo.ReturnRequests
    ADD CONSTRAINT CK_ReturnRequests_Status
    CHECK (Status IN (
        'pending',
        'approved',
        'rejected',
        'return_approved',
        'goods_received',
        'COMPLETED'
    ));
END
GO

