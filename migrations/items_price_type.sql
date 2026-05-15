-- ============================================================
-- Migration: Add price_type and price_suffix to items
-- Run this in the InsForge SQL editor BEFORE re-enabling
-- price_type / price_suffix in Dashboard insert/update calls.
-- ============================================================

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS price_type   TEXT NOT NULL DEFAULT 'fixed'
    CHECK (price_type IN ('fixed', 'starting', 'negotiable')),
  ADD COLUMN IF NOT EXISTS price_suffix TEXT;

-- Back-fill existing rows (all existing items are treated as fixed price)
UPDATE items SET price_type = 'fixed' WHERE price_type IS NULL;

-- After running this migration, re-enable price_type and price_suffix
-- in the Dashboard addItem insert and saveEdit update calls.
