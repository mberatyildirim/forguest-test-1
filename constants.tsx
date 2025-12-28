
import React from 'react';
import { MenuItem, ServiceItem } from './types';
import { 
  BedDouble, Shirt, Car, Bath, Wind, Pill, Luggage, Bell, Ban, Wrench, SprayCan
} from 'lucide-react';

export const ROOM_NUMBER = "6";
export const GUEST_NAME = "Sayın Misafirimiz";

export const TRANSLATIONS = {
  tr: {
    welcome: "Hoşgeldiniz",
    room: "Oda",
    wifi: "WİFİ AĞI",
    checkout: "ÇIKIŞ SAATİ",
    food: "Yemek",
    foodDesc: "Odaya servis lezzetler",
    foodHours: "08:30 - 01:30",
    market: "Market",
    marketDesc: "Atıştırmalık & İçecek",
    marketHours: "08:30 - 03:30",
    services: "Hizmetler",
    servicesDesc: "Housekeeping & Teknik",
    reception: "Resepsiyon",
    receptionDesc: "7/24 Canlı Destek",
    back: "Geri",
    rateUs: "BİZİ DEĞERLENDİRİN",
    added: "eklendi",
    serviceSent: "talebi iletildi",
    orderReceived: "Sipariş Alındı",
    total: "Toplam",
    emptyCart: "Sepetiniz boş",
    serviceNames: {
      towel: 'Ekstra Havlu',
      pillow: 'Yastık İsteği',
      soap: 'Banyo Seti',
      laundry: 'Kuru Temizleme',
      taxi: 'Taksi Çağır',
      ac: 'Klima Kontrolü',
      luggage: 'Bavul Taşıma',
      wakeup: 'Uyandırma Servisi',
      dnd: 'Rahatsız Etmeyin',
      tech: 'Teknik Destek',
      clean: 'Oda Temizliği'
    }
  },
  en: {
    welcome: "Welcome",
    room: "Room",
    wifi: "WIFI NETWORK",
    checkout: "CHECK-OUT TIME",
    food: "Dining",
    foodDesc: "In-room dining",
    foodHours: "08:30 - 01:30",
    market: "Market",
    marketDesc: "Snacks & Drinks",
    marketHours: "08:30 - 03:30",
    services: "Services",
    servicesDesc: "Housekeeping & Tech",
    reception: "Reception",
    receptionDesc: "24/7 Live Support",
    back: "Back",
    rateUs: "RATE US",
    added: "added",
    serviceSent: "request sent",
    orderReceived: "Order Received",
    total: "Total",
    emptyCart: "Cart is empty",
    serviceNames: {
      towel: 'Extra Towel',
      pillow: 'Extra Pillow',
      soap: 'Bath Kit',
      laundry: 'Dry Cleaning',
      taxi: 'Call Taxi',
      ac: 'AC Control',
      luggage: 'Bellboy',
      wakeup: 'Wake-up Call',
      dnd: 'Do Not Disturb',
      tech: 'Tech Support',
      clean: 'Room Cleaning'
    }
  },
  ar: {
    welcome: "أهلاً بك",
    room: "غرفة",
    wifi: "شبكة واي فاي",
    checkout: "الدفع",
    food: "طعام",
    foodDesc: "خدمة الغرف",
    foodHours: "08:30 - 01:30",
    market: "السوق",
    marketDesc: "وجبات خفيفة ومشروبات",
    marketHours: "08:30 - 03:30",
    services: "خدمات",
    servicesDesc: "تدبير منزلي وتقنية",
    reception: "استقبال",
    receptionDesc: "دعم مباشر 24/7",
    back: "رجوع",
    rateUs: "قيمنا",
    added: "تمت الإضافة",
    serviceSent: "تم إرسال الطلب",
    orderReceived: "تم استلام الطلب",
    total: "الإجمالي",
    emptyCart: "سلتك فارغة",
    serviceNames: {
      towel: 'منشفة إضافية',
      pillow: 'وسادة إضافية',
      soap: 'مجموعة الحمام',
      laundry: 'تنين جاف',
      taxi: 'طلب تاكسi',
      ac: 'تكييف',
      luggage: 'حمال حقائب',
      wakeup: 'مكالمة إيقاظ',
      dnd: 'لا تزعج',
      tech: 'دعم فني',
      clean: 'تنظيف الغرفة'
    }
  }
};

export const SERVICE_ICONS: Record<string, any> = {
  clean: <SprayCan size={24}/>, towel: <Bath size={24}/>, pillow: <BedDouble size={24}/>, soap: <Pill size={24}/>,
  laundry: <Shirt size={24}/>, luggage: <Luggage size={24}/>, taxi: <Car size={24}/>, ac: <Wind size={24}/>,
  tech: <Wrench size={24}/>, wakeup: <Bell size={24}/>, dnd: <Ban size={24}/>
};
