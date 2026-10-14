import React, { useState } from 'react';
import { Database, Copy, Check, FileCode, Shield, Server, Cpu } from 'lucide-react';

const SQL_SCHEMA_CODE = `-- ====================================================================
-- LogiPulse Relational Database Schema (PostgreSQL / Supabase)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('user', 'rider', 'admin');
CREATE TYPE order_status AS ENUM ('Pending', 'Picked Up', 'In Transit', 'Delivered');

-- 2. USERS TABLE
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    phone VARCHAR(32),
    avatar_url TEXT,
    -- Live GPS coordinates for riders (numeric precision or PostGIS)
    current_lat NUMERIC(10, 7) NULL,
    current_lng NUMERIC(10, 7) NULL,
    is_online BOOLEAN DEFAULT true,
    vehicle_type VARCHAR(50) DEFAULT 'Motorcycle',
    rating NUMERIC(3, 2) DEFAULT 5.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_online_riders ON users(role, is_online) WHERE role = 'rider';

-- 3. ORDERS TABLE
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

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_rider_id ON orders(rider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pending ON orders(status) WHERE status = 'Pending';

-- 4. MESSAGES TABLE (Real-time order chat)
CREATE TABLE messages (
    message_id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_order_timestamp ON messages(order_id, timestamp ASC);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read public profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (id = auth.uid()::text);

CREATE POLICY "Users read own and available orders" ON orders FOR SELECT 
    USING (user_id = auth.uid()::text 
       OR rider_id = auth.uid()::text 
       OR (status = 'Pending' AND (SELECT role FROM users WHERE id = auth.uid()::text) = 'rider')
       OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

CREATE POLICY "Users insert orders" ON orders FOR INSERT 
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Participants chat messages" ON messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.order_id = messages.order_id 
              AND (orders.user_id = auth.uid()::text 
                OR orders.rider_id = auth.uid()::text
                OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin')
        )
    );`;

const TYPESCRIPT_BOILERPLATE = `// src/types/courier.ts
export type UserRole = 'user' | 'rider' | 'admin';
export type OrderStatus = 'Pending' | 'Picked Up' | 'In Transit' | 'Delivered';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar: string;
  current_coordinates?: Coordinates; // populated for riders
  isOnline?: boolean;
  vehicleType?: 'Bicycle' | 'Motorcycle' | 'Electric Scooter' | 'Van';
  rating?: number;
}

export interface Order {
  order_id: string;
  user_id: string;
  rider_id: string | null;
  pickup_address: string;
  pickup_coords: Coordinates;
  dropoff_address: string;
  dropoff_coords: Coordinates;
  package_details: {
    title: string;
    category: 'Document' | 'Electronics' | 'Food' | 'Fragile' | 'Parcel';
    weightKg: number;
    notes?: string;
    isFragile?: boolean;
  };
  status: OrderStatus;
  fare_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  message_id: string;
  order_id: string;
  sender_id: string;
  text: string;
  timestamp: string;
  is_read?: boolean;
}`;

export const SchemaViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sql' | 'types' | 'er'>('sql');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white tracking-tight">Database Schema & State Boilerplate</h2>
            <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded font-mono">
              PostgreSQL / Supabase Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Relational DDL specifications, foreign key topologies, Row Level Security rules, and React Context TypeScript interfaces.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'sql' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            PostgreSQL / Supabase DDL
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'types' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            TypeScript Definitions
          </button>
          <button
            onClick={() => setActiveTab('er')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'er' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ER Relational Topology
          </button>
        </div>
      </div>

      {/* SQL Tab */}
      {activeTab === 'sql' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-mono text-slate-200">schema.sql</span>
            </div>
            <button
              onClick={() => handleCopy(SQL_SCHEMA_CODE, 'sql')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
            >
              {copied === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'sql' ? 'Copied to Clipboard' : 'Copy SQL'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto bg-slate-950/50 leading-relaxed max-h-[600px] no-scrollbar">
            <code>{SQL_SCHEMA_CODE}</code>
          </pre>
        </div>
      )}

      {/* TypeScript Tab */}
      {activeTab === 'types' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-slate-200">src/types/courier.ts</span>
            </div>
            <button
              onClick={() => handleCopy(TYPESCRIPT_BOILERPLATE, 'types')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
            >
              {copied === 'types' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'types' ? 'Copied Types' : 'Copy Types'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto bg-slate-950/50 leading-relaxed max-h-[600px] no-scrollbar">
            <code>{TYPESCRIPT_BOILERPLATE}</code>
          </pre>
        </div>
      )}

      {/* ER Visual Topology */}
      {activeTab === 'er' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Users Node */}
            <div className="p-4 bg-slate-900 border border-sky-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-sky-400 font-mono">1. USERS</h4>
                <span className="text-[10px] text-slate-500 font-mono">Entity</span>
              </div>
              <ul className="text-xs space-y-1 font-mono text-slate-300">
                <li className="text-amber-400 font-bold">🔑 id: VARCHAR (PK)</li>
                <li>name: VARCHAR(120)</li>
                <li>email: VARCHAR(255)</li>
                <li className="text-sky-300">role: ENUM ('user','rider','admin')</li>
                <li className="text-emerald-400">current_lat: NUMERIC(10,7)</li>
                <li className="text-emerald-400">current_lng: NUMERIC(10,7)</li>
                <li>is_online: BOOLEAN</li>
                <li>vehicle_type: VARCHAR</li>
              </ul>
            </div>

            {/* Orders Node */}
            <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-emerald-400 font-mono">2. ORDERS</h4>
                <span className="text-[10px] text-slate-500 font-mono">Entity</span>
              </div>
              <ul className="text-xs space-y-1 font-mono text-slate-300">
                <li className="text-amber-400 font-bold">🔑 order_id: VARCHAR (PK)</li>
                <li className="text-sky-400">🔗 user_id: FK → users.id</li>
                <li className="text-sky-400">🔗 rider_id: FK → users.id (NULLABLE)</li>
                <li>pickup_address: TEXT</li>
                <li>pickup_lat/lng: NUMERIC</li>
                <li>dropoff_address: TEXT</li>
                <li>dropoff_lat/lng: NUMERIC</li>
                <li>package_details: JSONB</li>
                <li className="text-emerald-300">status: ENUM ('Pending', 'Picked Up', 'In Transit', 'Delivered')</li>
                <li>fare_amount: NUMERIC(10,2)</li>
              </ul>
            </div>

            {/* Messages Node */}
            <div className="p-4 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-indigo-400 font-mono">3. MESSAGES</h4>
                <span className="text-[10px] text-slate-500 font-mono">Entity</span>
              </div>
              <ul className="text-xs space-y-1 font-mono text-slate-300">
                <li className="text-amber-400 font-bold">🔑 message_id: VARCHAR (PK)</li>
                <li className="text-emerald-400">🔗 order_id: FK → orders.order_id</li>
                <li className="text-sky-400">🔗 sender_id: FK → users.id</li>
                <li>text: TEXT</li>
                <li>timestamp: TIMESTAMPTZ</li>
                <li>is_read: BOOLEAN</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-2">
            <h5 className="font-semibold text-white">State Topology Relationships:</h5>
            <p className="text-slate-400">
              • <strong>One-to-Many (Users → Orders):</strong> A User can create many Orders. A Rider can be assigned to multiple Orders sequentially or concurrently.
            </p>
            <p className="text-slate-400">
              • <strong>One-to-Many (Orders → Messages):</strong> Each Order has a scoped real-time chat channel between the requesting customer and assigned rider.
            </p>
            <p className="text-slate-400">
              • <strong>Real-time Telemetry:</strong> Rider coordinates stream into <code className="text-sky-300">users.current_coordinates</code>, automatically updating pickup ETA and live map polylines across all dashboards.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
