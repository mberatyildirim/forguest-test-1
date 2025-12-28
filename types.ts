
import React from 'react';

export type UserRole = 'guest' | 'hotel_admin' | 'super_admin';

export interface Hotel {
  id: string;
  name: string;
  logo_url: string;
  banner_url?: string;
  wifi_name: string;
  wifi_pass: string;
  checkout_time: string;
  reception_phone: string;
  whatsapp_number: string;
  username?: string;
  password?: string;
  created_at?: string;
  airbnb_url?: string;
  google_maps_url?: string;
  booking_url?: string;
}

export interface HotelApplication {
  id: string;
  hotel_name: string;
  contact_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  created_at: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_number: string;
  qr_url?: string;
}

export interface MenuItem {
  id: string;
  hotel_id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  type: 'food' | 'market';
  image: string;
  popular?: boolean;
  is_available?: boolean;
}

export interface ServiceItem {
  id: string;
  nameKey: string;
  icon: React.ReactNode;
  category: string;
}

export interface Order {
  id: string;
  hotel_id: string;
  room_number: string;
  total_amount: number;
  status: 'pending' | 'preparing' | 'delivered' | 'cancelled';
  items: any[];
  created_at: string;
  hotels?: { name: string };
}

export interface ServiceRequest {
  id: string;
  hotel_id: string;
  room_number: string;
  service_type: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  hotels?: { name: string };
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type ViewState = 'home' | 'dining' | 'amenities' | 'cart' | 'info';
export type PanelState = 'guest' | 'hotel_dashboard' | 'admin_dashboard' | 'landing' | 'super_login' | 'hotel_login';
export type Language = 'tr' | 'en' | 'ar';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
