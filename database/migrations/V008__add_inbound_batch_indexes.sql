-- Migration V008: Add covering index for FIFO InboundBatches lazy-load pagination
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_InboundBatches_ImportDate_BatchId' AND object_id = OBJECT_ID('InboundBatches'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_InboundBatches_ImportDate_BatchId 
    ON InboundBatches(ImportDate DESC, BatchId DESC) 
    INCLUDE (VariantId, InboundOrderId, RemainingQuantity, Status, ImportPrice, InitialQuantity);
END
GO
