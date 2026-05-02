-- ============================================================
-- TOBLI — Security Fixes Migration
-- Run this in the InsForge SQL editor
-- ============================================================

-- ── FIX CRIT-2 & CRIT-3: Prevent owners from updating sensitive columns ──
-- This trigger blocks non-admin users from modifying is_admin, 
-- subscription_status, and subscription_expires_at on their own row.

CREATE OR REPLACE FUNCTION protect_sensitive_business_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Only enforce restrictions for non-admin users
    IF NOT is_admin() THEN
        -- Prevent self-escalation to admin
        IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
            RAISE EXCEPTION 'Cannot modify admin status';
        END IF;

        -- Prevent subscription manipulation
        IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
            RAISE EXCEPTION 'Cannot modify subscription status';
        END IF;

        IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
            RAISE EXCEPTION 'Cannot modify subscription expiry';
        END IF;

        -- Prevent changing auth_user_id (account takeover)
        IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
            RAISE EXCEPTION 'Cannot modify account ownership';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_sensitive_business_columns ON businesses;
CREATE TRIGGER trg_protect_sensitive_business_columns
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION protect_sensitive_business_columns();

-- ── FIX HIGH-4: Restrict search_impressions inserts ──
-- Only allow inserting impressions for businesses that actually exist and are active.

DROP POLICY IF EXISTS "Anyone can record impressions" ON search_impressions;

CREATE POLICY "Anyone can record valid impressions" ON search_impressions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.id = search_impressions.business_id
              AND b.is_open = TRUE
              AND b.subscription_status = 'active'
        )
    );

-- ── DONE ─────────────────────────────────────────────────────
-- After running this migration, verify:
-- 1. A normal user cannot: UPDATE businesses SET is_admin = true WHERE id = '<their_id>';
-- 2. A normal user cannot: UPDATE businesses SET subscription_status = 'active' WHERE id = '<their_id>';
-- 3. An admin CAN still toggle subscription_status via the admin panel.
-- 4. search_impressions inserts are rejected for non-existent or inactive business IDs.
