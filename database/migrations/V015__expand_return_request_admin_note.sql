-- Expand AdminNote column in ReturnRequests from NVARCHAR(255) to NVARCHAR(MAX)
-- to accommodate long PayOS refund notification messages.
ALTER TABLE dbo.ReturnRequests
    ALTER COLUMN AdminNote NVARCHAR(MAX) NULL;
GO

