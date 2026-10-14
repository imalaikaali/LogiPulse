-- ====================================================================
-- LogiPulse Relational Database Schema (PostgreSQL / Supabase)
-- Supports Unified Real-time Courier System: Users, Orders, and Messages
-- ====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. ENUMS
-- --------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('user', 'rider', 'admin');
CREATE TYPE order_status AS ENUM ('Pending', 'Picked Up', 'In Transit', 'Delivered');

-- --------------------------------------------------------------------
-- 2. USERS TABLE
-- Stores customers, riders, and platform admins.
-- Coordinates track live rider positions with precision.
-- --------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    phone VARCHAR(32),
    avatar_url TEXT,
    -- Live GPS coordinates for riders (stored as numeric/float or PostGIS POINT)
    current_lat NUMERIC(10, 7) NULL,
    current_lng NUMERIC(10, 7) NULL,
    is_online BOOLEAN DEFAULT true,
    vehicle_type VARCHAR(50) DEFAULT 'Motorcycle',
    rating NUMERIC(3, 2) DEFAULT 5.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying riders and locations quickly
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_online_riders ON users(role, is_online) WHERE role = 'rider';

-- --------------------------------------------------------------------
-- 3. ORDERS TABLE
-- Represents the delivery contract between user and assigned rider.
-- Contains pickup/dropoff coordinates, package details (JSONB), and status.
-- --------------------------------------------------------------------
CREATE TABLE orders (
    order_id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rider_id VARCHAR(64) NULL REFERENCES users(id) ON DELETE SET NULL,
    
    pickup_address TEXT NOT NULL,
    pickup_lat NUMERIC(10, 7) NOT NULL,
    pickup_lng NUMERIC(10, 7) NOT NULL,
    
    dropoff_address TEXT NOT NULL,
    dropoff_lat NUMERIC(10, 7) NOT NULL,
    dropoff_lng NUMERIC(10, 7) NOT NULL,
    
    -- Structured package details: weight, dimensions, category, fragile flag
    package_details JSONB NOT NULL DEFAULT '{
        "title": "Standard Parcel",
        "category": "Parcel",
        "weightKg": 1.0,
        "notes": "",
        "isFragile": false
    }'::jsonb,
    
    status order_status NOT NULL DEFAULT 'Pending',
    fare_amount NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ NULL,
    delivered_at TIMESTAMPTZ NULL
);

-- Indexes for performance & dashboard filtering
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_rider_id ON orders(rider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pending ON orders(status) WHERE status = 'Pending';
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- --------------------------------------------------------------------
-- 4. MESSAGES TABLE
-- Real-time conversation between customer (user) and assigned courier (rider)
-- --------------------------------------------------------------------
CREATE TABLE messages (
    message_id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for fast thread retrieval in chat
CREATE INDEX idx_messages_order_timestamp ON messages(order_id, timestamp ASC);

-- --------------------------------------------------------------------
-- 5. AUTOMATIC TIMESTAMP TRIGGER
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- --------------------------------------------------------------------
-- 6. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Admins can view/manage everything
CREATE POLICY "Admins full access users" ON users FOR ALL 
    USING ((SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

CREATE POLICY "Users can read all public profiles" ON users FOR SELECT 
    USING (true);

CREATE POLICY "Users can update own profile" ON users FOR UPDATE 
    USING (id = auth.uid()::text);

-- Order access policies
CREATE POLICY "Users view own orders" ON orders FOR SELECT 
    USING (user_id = auth.uid()::text 
       OR rider_id = auth.uid()::text 
       OR (status = 'Pending' AND (SELECT role FROM users WHERE id = auth.uid()::text) = 'rider')
       OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

CREATE POLICY "Users create orders" ON orders FOR INSERT 
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Riders update assigned orders" ON orders FOR UPDATE 
    USING (rider_id = auth.uid()::text 
       OR (rider_id IS NULL AND (SELECT role FROM users WHERE id = auth.uid()::text) = 'rider')
       OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

-- Messages access policies
CREATE POLICY "Order participants view messages" ON messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.order_id = messages.order_id 
              AND (orders.user_id = auth.uid()::text 
                OR orders.rider_id = auth.uid()::text
                OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin')
        )
    );

CREATE POLICY "Order participants send messages" ON messages FOR INSERT 
    WITH CHECK (
        sender_id = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.order_id = messages.order_id 
              AND (orders.user_id = auth.uid()::text OR orders.rider_id = auth.uid()::text)
        )
    );

-- --------------------------------------------------------------------
-- 7. SUPABASE REALTIME REPLICATION ENABLEMENT
-- --------------------------------------------------------------------
-- ALTER PUBLICATION supabase_realtime ADD TABLE users;
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
