/**
 * LogiPulse - Core Type Definitions
 * Shared types for Users, Orders, and Messages across all role dashboards.
 */

export type UserRole = 'user' | 'rider' | 'admin';

export type OrderStatus = 'Pending' | 'Picked Up' | 'In Transit' | 'Delivered';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PackageDetails {
  title: string;
  category: 'Document' | 'Electronics' | 'Food' | 'Fragile' | 'Parcel';
  weightKg: number;
  notes?: string;
  isFragile?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar: string;
  password?: string;
  cityArea?: string;
  // Rider specific verification & fleet fields
  isApproved?: boolean; // true for customers/admins; true for approved riders, false for pending riders
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  cnicNumber?: string;
  vehicleNumber?: string;
  registeredAt?: string;
  // Lat/Lng for riders (can be updated dynamically as rider travels)
  current_coordinates?: Coordinates;
  isOnline?: boolean;
  vehicleType?: 'Bicycle' | 'Motorcycle' | 'Electric Scooter' | 'Van';
  rating?: number;
  completedDeliveries?: number;
}

export interface Order {
  order_id: string;
  user_id: string;
  rider_id: string | null;
  pickup_address: string;
  pickup_coords: Coordinates;
  dropoff_address: string;
  dropoff_coords: Coordinates;
  package_details: PackageDetails;
  status: OrderStatus;
  fare_amount: number;
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
  picked_up_at?: string;
  delivered_at?: string;
}

export interface Message {
  message_id: string;
  order_id: string;
  sender_id: string;
  text: string;
  timestamp: string;
  is_read?: boolean;
}

export type ViewMode = 'split' | 'user' | 'rider' | 'admin' | 'schema';
