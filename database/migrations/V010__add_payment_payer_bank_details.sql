-- Store the payer bank account returned by PayOS for later refunds.
IF COL_LENGTH('dbo.Payments', 'PayerBankName') IS NULL
BEGIN
    ALTER TABLE dbo.Payments ADD PayerBankName NVARCHAR(255) NULL;
END
GO

IF COL_LENGTH('dbo.Payments', 'PayerBankAccount') IS NULL
BEGIN
    ALTER TABLE dbo.Payments ADD PayerBankAccount NVARCHAR(255) NULL;
END
GO

IF COL_LENGTH('dbo.Payments', 'PayerAccountHolder') IS NULL
BEGIN
    ALTER TABLE dbo.Payments ADD PayerAccountHolder NVARCHAR(255) NULL;
END
GO