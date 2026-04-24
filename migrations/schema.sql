-- ============================================================
-- TOBLI — Full Postgres Schema (run this in InsForge SQL editor)
-- ============================================================

-- ── 1. BUSINESSES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id TEXT UNIQUE,
    name        TEXT NOT NULL,
    owner_name  TEXT,
    sector      TEXT,
    description TEXT,
    lat         DOUBLE PRECISION,
    lng         DOUBLE PRECISION,
    whatsapp    TEXT,
    phone       TEXT,
    email       TEXT UNIQUE,
    instagram   TEXT,
    x_handle    TEXT,
    website     TEXT,
    subscription_status   TEXT DEFAULT 'inactive',
    subscription_expires_at TIMESTAMPTZ,
    is_open     BOOLEAN DEFAULT FALSE,
    is_admin    BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. ITEMS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    type        TEXT CHECK (type IN ('product', 'service')),
    price       NUMERIC,
    image_url   TEXT,
    available   BOOLEAN DEFAULT TRUE,
    featured    BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. SUBSCRIPTIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    amount              NUMERIC NOT NULL,
    paid_at             TIMESTAMPTZ DEFAULT NOW(),
    expires_at          TIMESTAMPTZ,
    method              TEXT,
    pesapal_reference   TEXT UNIQUE
);

-- ── 4. ADMINS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
    user_id TEXT PRIMARY KEY
);

INSERT INTO admins (user_id) VALUES ('d9652b4b-f1d3-438d-a36e-978a4a726c54')
ON CONFLICT DO NOTHING;

-- ── 5. SEARCH IMPRESSIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_impressions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    search_query TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_impressions_business_id ON search_impressions(business_id);
CREATE INDEX IF NOT EXISTS idx_search_impressions_created_at  ON search_impressions(created_at);

-- ── 6. SEARCH FUNCTION ───────────────────────────────────────
CREATE OR REPLACE FUNCTION search_nearby(
    search_query TEXT,
    user_lat     DOUBLE PRECISION,
    user_lng     DOUBLE PRECISION,
    radius_km    DOUBLE PRECISION DEFAULT 5
)
RETURNS TABLE (
    business_id   UUID,
    business_name TEXT,
    item_id       UUID,
    item_name     TEXT,
    price         NUMERIC,
    image_url     TEXT,
    lat           DOUBLE PRECISION,
    lng           DOUBLE PRECISION,
    whatsapp      TEXT,
    phone         TEXT,
    instagram     TEXT,
    x_handle      TEXT,
    website       TEXT,
    distance_km   DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id, b.name, i.id, i.name, i.price, i.image_url,
        b.lat, b.lng, b.whatsapp, b.phone, b.instagram, b.x_handle, b.website,
        6371.0 * 2 * ASIN(
            SQRT(
                POWER(SIN(RADIANS(b.lat - user_lat) / 2), 2) +
                COS(RADIANS(user_lat)) * COS(RADIANS(b.lat)) *
                POWER(SIN(RADIANS(b.lng - user_lng) / 2), 2)
            )
        ) AS distance_km
    FROM items i
    JOIN businesses b ON b.id = i.business_id
    WHERE
        b.is_open = TRUE
        AND b.subscription_status = 'active'
        AND i.available = TRUE
        AND i.name ILIKE '%' || search_query || '%'
        AND b.lat IS NOT NULL AND b.lng IS NOT NULL
        AND 6371.0 * 2 * ASIN(
            SQRT(
                POWER(SIN(RADIANS(b.lat - user_lat) / 2), 2) +
                COS(RADIANS(user_lat)) * COS(RADIANS(b.lat)) *
                POWER(SIN(RADIANS(b.lng - user_lng) / 2), 2)
            )
        ) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── 7. ENABLE RLS ────────────────────────────────────────────
ALTER TABLE businesses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins             ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_impressions ENABLE ROW LEVEL SECURITY;

-- ── 8. ADMIN HELPER FUNCTION ─────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. RLS POLICIES — BUSINESSES ─────────────────────────────
DROP POLICY IF EXISTS "Public can view active businesses"           ON businesses;
DROP POLICY IF EXISTS "Owners can view their own business"          ON businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON businesses;
DROP POLICY IF EXISTS "Owners can update their own business profile" ON businesses;
DROP POLICY IF EXISTS "Admins can delete businesses"               ON businesses;

-- Public sees only active, open businesses
CREATE POLICY "Public can view active businesses" ON businesses
    FOR SELECT USING (is_open = TRUE AND subscription_status = 'active');

-- Owners always see their own business regardless of status
CREATE POLICY "Owners can view their own business" ON businesses
    FOR SELECT USING (auth_user_id = auth.uid()::text OR is_admin());

CREATE POLICY "Users can create their own business profile" ON businesses
    FOR INSERT WITH CHECK (auth_user_id = auth.uid()::text);

CREATE POLICY "Owners can update their own business profile" ON businesses
    FOR UPDATE USING (auth_user_id = auth.uid()::text OR is_admin())
    WITH CHECK (auth_user_id = auth.uid()::text OR is_admin());

CREATE POLICY "Admins can delete businesses" ON businesses
    FOR DELETE USING (is_admin());

-- ── 10. RLS POLICIES — ITEMS ─────────────────────────────────
DROP POLICY IF EXISTS "Public can view items of active businesses" ON items;
DROP POLICY IF EXISTS "Owners can view their own items"            ON items;
DROP POLICY IF EXISTS "Owners can insert their own items"          ON items;
DROP POLICY IF EXISTS "Owners can update their own items"          ON items;
DROP POLICY IF EXISTS "Owners can delete their own items"          ON items;
DROP POLICY IF EXISTS "Owners can manage their own items"          ON items;

-- Public sees items of active, open businesses only
CREATE POLICY "Public can view items of active businesses" ON items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.id = items.business_id
              AND b.is_open = TRUE
              AND b.subscription_status = 'active'
        )
    );

-- Owners always see their own items regardless of subscription status
CREATE POLICY "Owners can view their own items" ON items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.id = items.business_id
              AND (b.auth_user_id = auth.uid()::text OR is_admin())
        )
    );

-- Owners can insert items into their own business
CREATE POLICY "Owners can insert their own items" ON items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.id = items.business_id
              AND (b.auth_user_id = auth.uid()::text OR is_admin())
        )
    );

-- Owners can update their own items
CREATE POLICY "Owners can update their own items" ON items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.id = items.business_id
              AND (b.auth_user_id = auth.uid()::text OR is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.id = items.business_id
              AND (b.auth_user_id = auth.uid()::text OR is_admin())
        )
    );

-- Owners can delete their own items
CREATE POLICY "Owners can delete their own items" ON items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.id = items.business_id
              AND (b.auth_user_id = auth.uid()::text OR is_admin())
        )
    );

-- ── 11. RLS POLICIES — SUBSCRIPTIONS ─────────────────────────
DROP POLICY IF EXISTS "Owners can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins manage subscriptions"             ON subscriptions;

CREATE POLICY "Owners can view their own subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.id = subscriptions.business_id
              AND (b.auth_user_id = auth.uid()::text OR is_admin())
        )
    );

CREATE POLICY "Admins manage subscriptions" ON subscriptions
    FOR ALL USING (is_admin())
    WITH CHECK (is_admin());

-- ── 12. RLS POLICIES — ADMINS ────────────────────────────────
DROP POLICY IF EXISTS "Only admins can view admin list" ON admins;
DROP POLICY IF EXISTS "Admins can insert into admins"   ON admins;

CREATE POLICY "Only admins can view admin list" ON admins
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert into admins" ON admins
    FOR INSERT WITH CHECK (is_admin());

-- ── 13. RLS POLICIES — SEARCH IMPRESSIONS ────────────────────
DROP POLICY IF EXISTS "Anyone can record impressions"             ON search_impressions;
DROP POLICY IF EXISTS "Admins can view all impressions"           ON search_impressions;
DROP POLICY IF EXISTS "Businesses can view their own impressions" ON search_impressions;

CREATE POLICY "Anyone can record impressions" ON search_impressions
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all impressions" ON search_impressions
    FOR SELECT USING (is_admin());

CREATE POLICY "Businesses can view their own impressions" ON search_impressions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.id = search_impressions.business_id
              AND b.auth_user_id = auth.uid()::text
        )
    );

-- ── DONE ─────────────────────────────────────────────────────
-- Run the block below separately to grant admin access once the user exists in auth.users:
--
-- INSERT INTO admins (user_id)
-- SELECT id FROM auth.users WHERE email = 'ojoklatim1@gmail.com'
-- ON CONFLICT (user_id) DO NOTHING;
