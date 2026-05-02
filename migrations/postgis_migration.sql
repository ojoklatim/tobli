-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add Location column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- 3. Migrate existing data
UPDATE businesses 
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- 4. Create trigger to sync location automatically
CREATE OR REPLACE FUNCTION sync_business_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
    ELSE
        NEW.location := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_business_location ON businesses;
CREATE TRIGGER trg_sync_business_location
BEFORE INSERT OR UPDATE OF lat, lng
ON businesses
FOR EACH ROW
EXECUTE FUNCTION sync_business_location();

-- 5. Create spatial index
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST (location);

-- 6. Replace search_nearby with PostGIS optimized version
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
DECLARE
    user_location GEOGRAPHY(POINT, 4326);
BEGIN
    user_location := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
    
    RETURN QUERY
    SELECT
        b.id, b.name, i.id, i.name, i.price, i.image_url,
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
