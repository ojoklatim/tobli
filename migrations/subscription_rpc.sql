-- ============================================================
-- TOBLI — Subscription Payment RPC Migration
-- Run this in the InsForge SQL editor AFTER the other migrations
-- ============================================================

-- ── 1. CREATE process_subscription_payment FUNCTION ──────────
-- Called by Cloudflare Pages functions (pesapal-status, pesapal-ipn)
-- after Pesapal confirms payment. Runs as SECURITY DEFINER so it can
-- bypass RLS and the protect_sensitive_business_columns trigger.

DROP FUNCTION IF EXISTS process_subscription_payment;

CREATE OR REPLACE FUNCTION process_subscription_payment(
    target_business_id UUID,
    payment_amount     NUMERIC,
    payment_method     TEXT,
    pesapal_ref        TEXT
)
RETURNS void AS $$
DECLARE
    new_expiry TIMESTAMPTZ;
BEGIN
    -- Set a flag so the protect_sensitive_business_columns trigger
    -- allows this update (server-side payment processing, not a user action)
    PERFORM set_config('app.bypass_subscription_check', 'true', true);

    -- Calculate new expiry: extend from current expiry if still active,
    -- otherwise start from now
    new_expiry := GREATEST(
        NOW(),
        COALESCE(
            (SELECT subscription_expires_at FROM businesses WHERE id = target_business_id),
            NOW()
        )
    ) + INTERVAL '30 days';

    -- Insert subscription record (skip if this pesapal_ref was already processed)
    INSERT INTO subscriptions (business_id, amount, method, pesapal_reference, paid_at, expires_at)
    VALUES (
        target_business_id,
        payment_amount,
        payment_method,
        pesapal_ref,
        NOW(),
        new_expiry
    )
    ON CONFLICT (pesapal_reference) DO NOTHING;

    -- Only update the business if the insert actually happened (not a duplicate)
    IF FOUND THEN
        UPDATE businesses
        SET subscription_status     = 'active',
            subscription_expires_at = new_expiry,
            updated_at              = NOW()
        WHERE id = target_business_id;
    END IF;

    -- Reset the bypass flag
    PERFORM set_config('app.bypass_subscription_check', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 2. UPDATE protect_sensitive_business_columns TRIGGER ─────
-- This function blocks non-admin users from modifying sensitive columns.
-- We add a check for the 'app.bypass_subscription_check' flag so our
-- process_subscription_payment function can update the status.

CREATE OR REPLACE FUNCTION protect_sensitive_business_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow bypass from process_subscription_payment function
    IF current_setting('app.bypass_subscription_check', true) = 'true' THEN
        RETURN NEW;
    END IF;

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

-- Re-attach trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS trg_protect_sensitive_business_columns ON businesses;
CREATE TRIGGER trg_protect_sensitive_business_columns
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION protect_sensitive_business_columns();

-- ── DONE ─────────────────────────────────────────────────────
