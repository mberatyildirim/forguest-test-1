
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClipboardList, Package, QrCode, Settings, Plus, Trash2, 
  X, Loader2, Save, Download, Edit3, Image as ImageIcon,
  CheckCircle, Layers, Home, MapPin, Star, ExternalLink, Printer, ShoppingBag, Bell, LogOut, Search, ToggleLeft, ToggleRight,
  Check, Play, Ban, CheckCircle2, Clock, Menu, User, Activity, Upload, Camera, AlertCircle
} from 'lucide-react';
import { supabase, uploadFile } from '../lib/supabase';
import { MenuItem, Order, Room, Hotel, ServiceRequest, PanelState } from '../types';

interface HotelPanelProps {
  onNavigate: (mode: PanelState, path: string) => void;
  hotelIdProp: string;
}

const HotelPanel: React.FC<HotelPanelProps> = ({ onNavigate, hotelIdProp }) => {
  const [view, setView] = useState<'orders' | 'menu' | 'rooms' | 'settings'>('orders');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [kitchenMenu, setKitchenMenu] = useState<MenuItem[]>([]);
  const [globalMarket, setGlobalMarket] = useState<any[]>([]);
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [activeMarketIds, setActiveMarketIds] = useState<string[]>([]);
  const [activeServiceIds, setActiveServiceIds] = useState<string[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [isSingleAdding, setIsSingleAdding] = useState(false);
  const [singleRoomNum, setSingleRoomNum] = useState('');
  const [bulkConfig, setBulkConfig] = useState({ start: 1, end: 10 });
  const [isUploading, setIsUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [inventorySubView, setInventorySubView] = useState<'kitchen' | 'market' | 'services'>('kitchen');
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const BASE_URL = window.location.origin;

  useEffect(() => {
    if (hotelIdProp) loadAllData(hotelIdProp);
  }, [hotelIdProp]);

  const loadAllData = async (hId: string) => {
    const { data: hData } = await supabase.from('hotels').select('*').eq('id', hId).single();
    if (hData) setHotel(hData);
    fetchRooms(hId);
    fetchOrders(hId);
    fetchServiceRequests(hId);
    fetchKitchenMenu(hId);
    fetchGlobalData();
  };

  const fetchGlobalData = async () => {
    const { data: market } = await supabase.from('global_market_items').select('*');
    const { data: services } = await supabase.from('global_services').select('*');
    const { data: mSettings } = await supabase.from('hotel_market_settings').select('item_id').eq('hotel_id', hotelIdProp).eq('is_active', true);
    const { data: sSettings } = await supabase.from('hotel_service_settings').select('service_id').eq('hotel_id', hotelIdProp).eq('is_active', true);
    
    setGlobalMarket(market || []);
    setGlobalServices(services || []);
    setActiveMarketIds(mSettings?.map(s => s.item_id) || []);
    setActiveServiceIds(sSettings?.map(s => s.service_id) || []);
  };

  const fetchRooms = async (hId: string) => {
    const { data } = await supabase.from('rooms').select('*').eq('hotel_id', hId);
    if (data) {
      const sorted = [...data].sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, {numeric: true}));
      setRooms(sorted);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !hotel) return;

    setIsBannerUploading(true);
    try {
      // Correct bucket name: "resimler"
      const path = `${hotel.id}/banner_${Date.now()}`;
      const publicUrl = await uploadFile('resimler', file, path);
      
      setHotel({ ...hotel, banner_url: publicUrl });
      alert("Görsel yüklendi. 'Ayarları Uygula' butonuna basarak kaydedin.");
    } catch (error: any) {
      console.error("Yükleme hatası:", error);
      alert(`Görsel yüklenirken hata oluştu: ${error.message || "Bilinmeyen hata"}.`);
    } finally {
      setIsBannerUploading(false);
    }
  };

  const toggleGlobalItem = async (type: 'market' | 'service', itemId: string) => {
    const table = type === 'market' ? 'hotel_market_settings' : 'hotel_service_settings';
    const idKey = type === 'market' ? 'item_id' : 'service_id';
    
    if (type === 'market') {
      const isCurrentlyActive = activeMarketIds.includes(itemId);
      setActiveMarketIds(prev => isCurrentlyActive ? prev.filter(id => id !== itemId) : [...prev, itemId]);
      
      if (isCurrentlyActive) {
        await supabase.from(table).delete().eq('hotel_id', hotelIdProp).eq(idKey, itemId);
      } else {
        await supabase.from(table).upsert({ hotel_id: hotelIdProp, [idKey]: itemId, is_active: true });
      }
    } else {
      const isCurrentlyActive = activeServiceIds.includes(itemId);
      setActiveServiceIds(prev => isCurrentlyActive ? prev.filter(id => id !== itemId) : [...prev, itemId]);

      if (isCurrentlyActive) {
        await supabase.from(table).delete().eq('hotel_id', hotelIdProp).eq(idKey, itemId);
      } else {
        await supabase.from(table).upsert({ hotel_id: hotelIdProp, [idKey]: itemId, is_active: true });
      }
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (!error) fetchOrders(hotelIdProp);
  };

  const updateServiceStatus = async (requestId: string, status: string) => {
    const { error } = await supabase.from('service_requests').update({ status }).eq('id', requestId);
    if (!error) fetchServiceRequests(hotelIdProp);
  };

  const handlePrintAllQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>QR Listesi - ${hotel?.name}</title>
      <style>
        body { font-family: sans-serif; display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; padding: 40px; }
        .qr-card { border: 2px solid #000; padding: 20px; text-align: center; border-radius: 15px; }
        img { width: 100%; max-width: 180px; }
        h3 { margin-bottom: 5px; font-size: 24px; }
      </style></head><body>
      ${rooms.map(r => `
        <div class="qr-card">
          <h3>ODA ${r.room_number}</h3>
          <img src="${r.qr_url}" />
          <p>${hotel?.name}</p>
        </div>
      `).join('')}
      <script>window.print();</script></body></html>
    `);
    printWindow.document.close();
  };

  const handleSingleAdd = async () => {
    if (!singleRoomNum) return;
    setIsUploading(true);
    // Updated path format: domain.com/hotelId/roomNum
    const guestUrl = `${BASE_URL}/${hotelIdProp}/${singleRoomNum}`;
    const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(guestUrl)}`;
    const { error } = await supabase.from('rooms').insert({ hotel_id: hotelIdProp, room_number: singleRoomNum, qr_url });
    if (!error) { setIsSingleAdding(false); setSingleRoomNum(''); fetchRooms(hotelIdProp); }
    setIsUploading(false);
  };

  const handleBulkAdd = async () => {
    if (bulkConfig.start >= bulkConfig.end) return alert("Hatalı aralık!");
    setIsUploading(true);
    const newRooms = [];
    for (let i = bulkConfig.start; i <= bulkConfig.end; i++) {
      const roomNum = i.toString();
      // Updated path format: domain.com/hotelId/roomNum
      const guestUrl = `${BASE_URL}/${hotelIdProp}/${roomNum}`;
      const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(guestUrl)}`;
      newRooms.push({ hotel_id: hotelIdProp, room_number: roomNum, qr_url });
    }
    await supabase.from('rooms').insert(newRooms);
    setIsBulkAdding(false);
    fetchRooms(hotelIdProp);
    setIsUploading(false);
  };

  const handleUpdateHotel = async () => {
    if (!hotel) return;
    setIsUploading(true);
    const { error } = await supabase
      .from('hotels')
      .update({
        name: hotel.name,
        wifi_name: hotel.wifi_name,
        wifi_pass: hotel.wifi_pass,
        checkout_time: hotel.checkout_time,
        reception_phone: hotel.reception_phone,
        whatsapp_number: hotel.whatsapp_number,
        banner_url: hotel.banner_url,
        google_maps_url: hotel.google_maps_url,
        airbnb_url: hotel.airbnb_url,
        booking_url: hotel.booking_url,
      })
      .eq('id', hotel.id);
    
    if (error) alert("Hata: " + error.message);
    else alert("Ayarlar başarıyla kaydedildi.");
    setIsUploading(false);
  };

  const fetchOrders = async (hId: string) => {
    // Fixed column name from 'hId' to 'hotel_id'
    const { data } = await supabase.from('orders').select('*').eq('hotel_id', hId).order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const fetchServiceRequests = async (hId: string) => {
    const { data } = await supabase.from('service_requests').select('*').eq('hotel_id', hId).order('created_at', { ascending: false });
    setServiceRequests(data || []);
  };

  const fetchKitchenMenu = async (hId: string) => {
    const { data } = await supabase.from('menu_items').select('*').eq('hotel_id', hId).eq('type', 'food');
    setKitchenMenu(data || []);
  };

  const filteredGlobalItems = useMemo(() => {
    const list = inventorySubView === 'market' ? globalMarket : globalServices;
    if (!searchQuery) return list;
    return list.filter(item => (item.name || item.name_key || '').toLowerCase().includes(searchQuery.toLowerCase()));
  }, [inventorySubView, globalMarket, globalServices, searchQuery]);

  const combinedEntries = [
    ...orders.map(o => ({ ...o, entryType: 'Sipariş' })),
    ...serviceRequests.map(s => ({ ...s, entryType: 'Hizmet' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const SidebarContent = () => (
    <>
      <div className="p-5 flex items-center justify-between border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-black italic shadow-lg">f</div>
          <span className="font-bold text-white tracking-tight uppercase text-xs">forGuest <span className="text-orange-500">Admin</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500 hover:text-white"><X size={20}/></button>
      </div>
      <nav className="flex-1 p-3 space-y-1 mt-4">
        <button onClick={() => { setView('orders'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${view === 'orders' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><ClipboardList size={18}/> Hareketler</button>
        <button onClick={() => { setView('menu'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${view === 'menu' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Package size={18}/> Envanter</button>
        <button onClick={() => { setView('rooms'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${view === 'rooms' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><QrCode size={18}/> Odalar</button>
        <button onClick={() => { setView('settings'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${view === 'settings' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Settings size={18}/> Ayarlar</button>
      </nav>
      <div className="p-4 border-t border-white/5">
        <button onClick={() => onNavigate('landing', '/')} className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-500 font-bold uppercase tracking-widest text-[10px] transition-colors"><LogOut size={14}/> Çıkış Yap</button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex font-inter text-[13px] relative overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-60 bg-[#0f172a] border-r border-white/5 flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="absolute top-0 left-0 bottom-0 w-64 bg-[#0f172a] flex flex-col shadow-3xl border-r border-white/10 animate-fade-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 w-full max-w-full">
        {/* Mobile Header Bar */}
        <header className="h-14 bg-[#0f172a] border-b border-white/5 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 mb-6 md:mb-8 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors">
              <Menu size={20}/>
            </button>
            <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-widest">Otel / <span className="text-white capitalize italic">{view}</span></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-black text-[9px] text-slate-500 uppercase tracking-widest">{hotel?.name}</span>
            <div className="w-8 h-8 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-inner">
              <User size={14} />
            </div>
          </div>
        </header>

        {view === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-tight italic">Canlı Akış</h2>
              <button onClick={() => fetchOrders(hotelIdProp)} className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Activity size={18}/></button>
            </div>
            {combinedEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-600 bg-[#0f172a] rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6"><ClipboardList size={32} className="opacity-20" /></div>
                <p className="font-black uppercase tracking-widest text-xs">Henüz bir hareket bulunmuyor</p>
                <p className="text-[10px] mt-2 opacity-60">Odalar işlem yaptığında burada görünecektir.</p>
              </div>
            ) : (
              <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-x-auto shadow-2xl no-scrollbar">
                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead className="bg-black/20 border-b border-white/5 text-slate-500 font-black uppercase tracking-widest">
                    <tr><th className="px-6 py-4">Zaman</th><th className="px-6 py-4">Oda</th><th className="px-6 py-4">Tip</th><th className="px-6 py-4">Detay</th><th className="px-6 py-4 text-right">Durum / İşlem</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {combinedEntries.map((o: any) => (
                      <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">
                          {new Date(o.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-black text-white italic tracking-tighter text-sm">ODA {o.room_number}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-widest ${o.entryType === 'Sipariş' ? 'bg-blue-900/40 text-blue-400 border border-blue-400/20' : 'bg-purple-900/40 text-purple-400 border border-purple-400/20'}`}>
                            {o.entryType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-medium truncate max-w-[200px]">
                          {o.entryType === 'Sipariş' ? (o.items || []).map((i:any)=>`${i.name} (x${i.quantity})`).join(', ') : o.service_type}
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {o.status === 'delivered' || o.status === 'completed' ? (
                            <span className="flex items-center gap-1.5 text-emerald-500 font-black uppercase text-[10px] tracking-widest"><CheckCircle2 size={14}/> TAMAMLANDI</span>
                          ) : o.status === 'cancelled' ? (
                            <span className="flex items-center gap-1.5 text-slate-500 font-black uppercase text-[10px] tracking-widest"><Ban size={14}/> İPTAL</span>
                          ) : (
                            <>
                              {o.entryType === 'Sipariş' ? (
                                <>
                                  {o.status === 'pending' && (
                                    <button onClick={() => updateOrderStatus(o.id, 'preparing')} className="bg-blue-600/10 text-blue-400 border border-blue-600/20 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] flex items-center gap-1.5 hover:bg-blue-600 hover:text-white transition-all shadow-lg"><Play size={10}/> Hazırla</button>
                                  )}
                                  {o.status === 'preparing' && (
                                    <button onClick={() => updateOrderStatus(o.id, 'delivered')} className="bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] flex items-center gap-1.5 hover:bg-emerald-600 hover:text-white transition-all shadow-lg"><Check size={10}/> Teslim Et</button>
                                  )}
                                  <button onClick={() => updateOrderStatus(o.id, 'cancelled')} className="bg-rose-600/10 text-rose-400 border border-rose-600/20 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] flex items-center gap-1.5 hover:bg-rose-600 hover:text-white transition-all"><X size={10}/> İptal</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => updateServiceStatus(o.id, 'completed')} className="bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] flex items-center gap-1.5 hover:bg-emerald-600 hover:text-white transition-all shadow-lg"><Check size={10}/> Tamamla</button>
                                  <button onClick={() => updateServiceStatus(o.id, 'cancelled')} className="bg-rose-600/10 text-rose-400 border border-rose-600/20 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] flex items-center gap-1.5 hover:bg-rose-600 hover:text-white transition-all"><X size={10}/> İptal</button>
                                </>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view === 'menu' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#0f172a] p-3 rounded-[2rem] border border-white/5 shadow-2xl gap-4">
               <div className="flex bg-black/20 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <button onClick={() => setInventorySubView('kitchen')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${inventorySubView === 'kitchen' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Mutfak</button>
                  <button onClick={() => setInventorySubView('market')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${inventorySubView === 'market' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Market</button>
                  <button onClick={() => setInventorySubView('services')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${inventorySubView === 'services' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>Hizmetler</button>
               </div>
               {inventorySubView !== 'kitchen' && (
                 <div className="relative w-full sm:w-64">
                   <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/>
                   <input type="text" placeholder="Katalogda ara..." className="w-full bg-black/20 border border-white/5 text-white rounded-2xl py-2.5 pl-10 pr-4 outline-none focus:border-orange-500/50 text-xs font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                 </div>
               )}
            </div>

            {inventorySubView === 'kitchen' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center"><h3 className="text-xl font-black uppercase italic tracking-tight">Mutfak Menüsü</h3><button className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-xl hover:bg-orange-500 transition-all uppercase tracking-widest"><Plus size={14}/> Yemek Ekle</button></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {kitchenMenu.map(item => (
                    <div key={item.id} className="bg-[#0f172a] p-4 rounded-[2.5rem] border border-white/5 flex gap-5 items-center shadow-2xl group hover:border-orange-500/30 transition-all">
                      <img src={item.image} className="w-20 h-20 rounded-2xl object-cover bg-black/40 shadow-lg group-hover:scale-105 transition-transform" />
                      <div>
                        <p className="font-black text-white uppercase text-xs tracking-tight leading-tight mb-1">{item.name}</p>
                        <p className="text-orange-500 font-black text-sm tracking-tighter">₺{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(inventorySubView === 'market' || inventorySubView === 'services') && (
              <div className="bg-[#0f172a] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {filteredGlobalItems.map(item => {
                    const isActive = inventorySubView === 'market' ? activeMarketIds.includes(item.id) : activeServiceIds.includes(item.id);
                    return (
                      <div key={item.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                        <div className="flex items-center gap-4">
                           {inventorySubView === 'market' && <img src={item.image} className="w-12 h-12 rounded-xl object-cover bg-black/40 shadow-lg"/>}
                           <div>
                              <p className={`font-black uppercase text-xs tracking-tight ${isActive ? 'text-white' : 'text-slate-500'}`}>{item.name || item.name_key}</p>
                              <p className="text-[9px] font-black text-orange-500/60 uppercase mt-0.5 tracking-widest">{item.category} {item.price ? `• ₺${item.price}` : ''}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => toggleGlobalItem(inventorySubView as any, item.id)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all font-black text-[9px] uppercase tracking-widest shadow-xl ${isActive ? 'bg-orange-600 border-orange-500 text-white shadow-orange-900/20' : 'bg-black/20 border-white/5 text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                          {isActive ? <ToggleRight size={20}/> : <ToggleLeft size={20}/>}
                          {isActive ? 'Aktif' : 'Pasif'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'rooms' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Oda Yönetimi & QR</h2>
              <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto">
                <button onClick={handlePrintAllQR} className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-white/10 transition-all uppercase tracking-widest"><Printer size={14}/> Yazdır</button>
                <button onClick={() => setIsSingleAdding(true)} className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-white/10 transition-all uppercase tracking-widest"><Plus size={14}/> Ekle</button>
                <button onClick={() => setIsBulkAdding(true)} className="col-span-2 sm:col-span-1 bg-orange-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-orange-500 shadow-xl uppercase tracking-widest"><Layers size={14}/> Toplu Oluştur</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {rooms.map(room => (
                <div key={room.id} className="bg-[#0f172a] p-5 rounded-[2.5rem] border border-white/5 text-center space-y-4 group hover:border-orange-500/50 transition-all shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <p className="font-black text-white text-lg italic tracking-tighter">ODA {room.room_number}</p>
                  <div className="aspect-square bg-white rounded-2xl p-2.5 shadow-inner border border-white/10">
                    <img src={room.qr_url} className="w-full h-full object-contain" alt="QR" />
                  </div>
                  <div className="flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <button onClick={() => window.open(room.qr_url, '_blank')} className="text-slate-500 hover:text-white bg-white/5 p-2 rounded-lg"><Download size={18}/></button>
                    <button onClick={async () => { if(confirm('Silsin mi?')) { await supabase.from('rooms').delete().eq('id', room.id); fetchRooms(hotelIdProp); } }} className="text-slate-500 hover:text-red-500 bg-white/5 p-2 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'settings' && hotel && (
          <div className="max-w-4xl space-y-8 animate-fade-in pb-20">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-black uppercase tracking-tight italic">Tesis Yapılandırma</h2>
                <button onClick={handleUpdateHotel} disabled={isUploading} className="w-full sm:w-auto bg-orange-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-2xl hover:bg-orange-500 transition-all flex items-center justify-center gap-3 tracking-widest active:scale-95">
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Ayarları Uygula
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-[#0f172a] p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5 pb-4">Genel Bilgiler</h3>
                   <div className="space-y-5">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Tesis Adı</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500 font-bold transition-all" value={hotel.name || ''} onChange={e => setHotel({...hotel, name: e.target.value})} />
                      </div>
                      
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center justify-between">
                            Tesis / Oda Görseli
                            <span className="text-[8px] opacity-60">Önerilen: 1920x1080</span>
                         </label>
                         <div 
                           onClick={() => !isBannerUploading && fileInputRef.current?.click()}
                           className={`relative w-full h-48 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3 bg-black/40 group ${hotel.banner_url ? 'border-orange-500/30' : 'border-white/10 hover:border-orange-500/50'}`}
                         >
                            {hotel.banner_url ? (
                              <>
                                <img src={hotel.banner_url} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                                   <div className={`bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shadow-2xl transition-transform ${isBannerUploading ? '' : 'group-hover:scale-110'}`}>
                                      {isBannerUploading ? <Loader2 size={24} className="animate-spin text-orange-500" /> : <Camera size={24} className="text-white" />}
                                   </div>
                                   {!isBannerUploading && <span className="text-[10px] font-black text-white uppercase mt-3 tracking-widest drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">Görseli Değiştir</span>}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-orange-600/10 transition-colors">
                                  {isBannerUploading ? <Loader2 size={24} className="animate-spin text-orange-500" /> : <Upload size={24} className="text-slate-500 group-hover:text-orange-500" />}
                                </div>
                                <div className="text-center px-4">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Bir dosya seçin veya sürükleyin</p>
                                   <p className="text-[8px] text-slate-600 mt-1 uppercase">Max: 5MB • JPG, PNG, WEBP</p>
                                </div>
                              </>
                            )}
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handleBannerUpload} 
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">WiFi SSID</label>
                            <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500 font-bold transition-all" value={hotel.wifi_name || ''} onChange={e => setHotel({...hotel, wifi_name: e.target.value})} />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">WiFi Şifre</label>
                            <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500 font-bold transition-all" value={hotel.wifi_pass || ''} onChange={e => setHotel({...hotel, wifi_pass: e.target.value})} />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Çıkış Saati</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500 font-bold transition-all" value={hotel.checkout_time || ''} onChange={e => setHotel({...hotel, checkout_time: e.target.value})} />
                      </div>
                   </div>
                </div>

                <div className="bg-[#0f172a] p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5 pb-4">Concierge & Linkler</h3>
                   <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Resepsiyon Tel</label>
                            <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500 font-bold transition-all" value={hotel.reception_phone || ''} onChange={e => setHotel({...hotel, reception_phone: e.target.value})} />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">WhatsApp No</label>
                            <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500 font-bold transition-all" value={hotel.whatsapp_number || ''} onChange={e => setHotel({...hotel, whatsapp_number: e.target.value})} />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2"><MapPin size={10} className="text-blue-500"/> Google Maps URL</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500 transition-all text-[11px]" value={hotel.google_maps_url || ''} onChange={e => setHotel({...hotel, google_maps_url: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2"><Home size={10} className="text-rose-500"/> Airbnb Link</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500 transition-all text-[11px]" value={hotel.airbnb_url || ''} onChange={e => setHotel({...hotel, airbnb_url: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2"><Star size={10} className="text-emerald-500"/> Booking Link</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500 transition-all text-[11px]" value={hotel.booking_url || ''} onChange={e => setHotel({...hotel, booking_url: e.target.value})} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Oda Ekle Modalları */}
        {isSingleAdding && (
          <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-[#0f172a] w-full max-sm rounded-[3rem] p-10 border border-white/10 text-center animate-fade-in shadow-3xl">
              <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tight italic">Yeni Oda Kaydı</h3>
              <input type="text" placeholder="00" className="w-full p-6 bg-[#1e293b] border-2 border-white/5 text-white rounded-3xl outline-none font-black text-center text-5xl mb-8 shadow-inner focus:border-orange-500 transition-all tracking-tighter" value={singleRoomNum} onChange={e => setSingleRoomNum(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={() => setIsSingleAdding(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] hover:text-white transition-colors">İptal</button>
                <button onClick={handleSingleAdd} disabled={isUploading} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase shadow-2xl hover:bg-orange-500 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Oluştur'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isBulkAdding && (
          <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-[#0f172a] w-full max-w-sm rounded-[3rem] p-10 border border-white/10 text-center animate-fade-in shadow-3xl">
              <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tight italic">Toplu QR Üret</h3>
              <div className="grid grid-cols-2 gap-5 mb-10 text-left">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Başlangıç</label><input type="number" className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl text-center font-black outline-none focus:border-orange-500 transition-all shadow-inner" value={bulkConfig.start} onChange={e => setBulkConfig({...bulkConfig, start: parseInt(e.target.value) || 1})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Bitiş</label><input type="number" className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl text-center font-black outline-none focus:border-orange-500 transition-all shadow-inner" value={bulkConfig.end} onChange={e => setBulkConfig({...bulkConfig, end: parseInt(e.target.value) || 1})} /></div>
              </div>
              <button onClick={handleBulkAdd} disabled={isUploading} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase shadow-2xl mb-6 hover:bg-orange-500 active:scale-95 transition-all flex items-center justify-center gap-3 tracking-widest">
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
                İşlemi Başlat
              </button>
              <button onClick={() => setIsBulkAdding(false)} className="text-slate-500 font-black uppercase text-[10px] hover:text-white transition-colors tracking-[0.2em]">Vazgeç</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HotelPanel;
