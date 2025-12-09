-- =====================================================
-- Migration: Add Inactive Payment Status
-- Description: Adds 'inactive' status to payments table
-- Date: 2024-12-09
-- =====================================================

-- Drop existing constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add new constraint with 'inactive' status
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'inactive'));

-- Add comment explaining the statuses
COMMENT ON COLUMN payments.status IS 'Payment status: pending (awaiting payment), paid (completed), overdue (past due date), cancelled (cancelled payment), inactive (client paused/inactive)';
