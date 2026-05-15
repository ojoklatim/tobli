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

-- ── Update search_nearby RPC to return price_type and price_suffix ──
-- Must drop first — PostgreSQL does not allow changing a function's return type in place.
DROP FUNCTION IF EXISTS search_nearby(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);

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
    price_type    TEXT,
    price_suffix  TEXT,
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
DECLARE
    user_location GEOGRAPHY(POINT, 4326);
BEGIN
    user_location := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;

    RETURN QUERY
    SELECT
        b.id, b.name, i.id, i.name, i.price, i.price_type, i.price_suffix, i.image_url,
        b.lat, b.lng, b.whatsapp, b.phone, b.instagram, b.x_handle, b.website,
        (ST_Distance(b.location, user_location) / 1000.0)::DOUBLE PRECISION AS distance_km
    FROM items i
    JOIN businesses b ON b.id = i.business_id
    WHERE
        b.is_open = TRUE
        AND b.subscription_status = 'active'
        AND i.available = TRUE
        AND i.name ILIKE '%' || search_query || '%'
        AND b.location IS NOT NULL
        AND ST_DWithin(b.location, user_location, radius_km * 1000.0)
    ORDER BY b.location <-> user_location ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- After running this migration, re-enable price_type and price_suffix
-- in the Dashboard addItem insert and saveEdit update calls.
