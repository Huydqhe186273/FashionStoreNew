-- Add return/refund fields mapped by the ReturnRequest entity.
IF COL_LENGTH('dbo.ReturnRequests', 'BankName') IS NULL
BEGIN
    ALTER TABLE dbo.ReturnRequests ADD BankName NVARCHAR(255) NULL;
END
GO

IF COL_LENGTH('dbo.ReturnRequests', 'BankAccount') IS NULL
BEGIN
    ALTER TABLE dbo.ReturnRequests ADD BankAccount NVARCHAR(255) NULL;
END
GO

IF COL_LENGTH('dbo.ReturnRequests', 'AccountHolder') IS NULL
BEGIN
    ALTER TABLE dbo.ReturnRequests ADD AccountHolder NVARCHAR(255) NULL;
END
GO

IF COL_LENGTH('dbo.ReturnRequests', 'AdminNote') IS NULL
BEGIN
    ALTER TABLE dbo.ReturnRequests ADD AdminNote NVARCHAR(255) NULL;
END
GO
