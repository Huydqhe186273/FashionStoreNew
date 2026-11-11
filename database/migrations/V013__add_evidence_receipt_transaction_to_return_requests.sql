-- Add EvidenceImages, ReceiptImage, TransactionRef columns to ReturnRequests table.
-- These fields were added to the ReturnRequest entity in the 3-step return process feature.

IF COL_LENGTH('dbo.ReturnRequests', 'EvidenceImages') IS NULL
BEGIN
    ALTER TABLE dbo.ReturnRequests ADD EvidenceImages NVARCHAR(MAX) NULL;
END
GO

IF COL_LENGTH('dbo.ReturnRequests', 'ReceiptImage') IS NULL
BEGIN
    ALTER TABLE dbo.ReturnRequests ADD ReceiptImage NVARCHAR(MAX) NULL;
END
GO

IF COL_LENGTH('dbo.ReturnRequests', 'TransactionRef') IS NULL
BEGIN
    ALTER TABLE dbo.ReturnRequests ADD TransactionRef NVARCHAR(500) NULL;
END
GO

