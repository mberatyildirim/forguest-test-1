
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, Package, QrCode, Settings, Plus, Trash2, 
  X, Loader2, Save, Download, Edit3, Image as ImageIcon,
  CheckCircle, Layers, Home, MapPin, Star, ExternalLink, Printer, ShoppingBag, Bell, LogOut, Search, ToggleLeft, ToggleRight,
  Check, Play, Ban, CheckCircle2, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MenuItem, Order, Room, Hotel, ServiceRequest, PanelState } from '../types';

interface HotelPanelProps {
  onNavigate: (mode: PanelState, path: string) => void;
  hotelIdProp: string;
}

const HotelPanel: React.FC<HotelPanelProps> = ({ onNavigate, hotelIdProp }) => {
  const [view, setView] = useState<'orders' | 'menu' | 'rooms' | 'settings'>('orders');
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
  const [inventorySubView, setInventorySubView] = useState<'kitchen' | 'market' | 'services'>('kitchen');
  const [searchQuery, setSearchQuery] = useState('');

  const BASE_URL = "https://forguest-test-1.vercel.app";

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
    const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${BASE_URL}/${hotelIdProp}/${singleRoomNum}`;
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
      const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${BASE_URL}/${hotelIdProp}/${roomNum}`;
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex font-inter text-[13px]">
      <aside className="w-56 bg-[#0f172a] border-r border-white/5 flex flex-col sticky top-0 h-screen">
        <div className="p-5 flex items-center gap-2 border-b border-white/5 bg-black/20">
          <div className="w-7 h-7 bg-orange-600 rounded flex items-center justify-center text-white font-bold">f</div>
          <span className="font-bold text-white tracking-tight uppercase text-xs">forGuest <span className="text-orange-500">Admin</span></span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => setView('orders')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${view === 'orders' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><ClipboardList size={16}/> Hareketler</button>
          <button onClick={() => setView('menu')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${view === 'menu' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Package size={16}/> Envanter</button>
          <button onClick={() => setView('rooms')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${view === 'rooms' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><QrCode size={16}/> Odalar</button>
          <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${view === 'settings' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Settings size={16}/> Ayarlar</button>
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={() => onNavigate('landing', '/')} className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-500 font-bold uppercase tracking-widest text-[10px] transition-colors"><LogOut size={14}/> Çıkış Yap</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto no-scrollbar p-8">
        {view === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black uppercase tracking-tight">Canlı Akış</h2>
            {combinedEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-600 bg-[#0f172a] rounded-3xl border border-white/5 shadow-2xl">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6"><ClipboardList size={32} className="opacity-20" /></div>
                <p className="font-black uppercase tracking-widest text-xs">Henüz bir sipariş veya hizmet talebi bulunmuyor</p>
                <p className="text-[10px] mt-2 opacity-60">Odalar QR kodu taradığında burada görünecektir.</p>
              </div>
            ) : (
              <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/20 border-b border-white/5 text-slate-500 font-black uppercase tracking-widest">
                    <tr><th className="px-6 py-4">Tarih</th><th className="px-6 py-4">Oda</th><th className="px-6 py-4">Tip</th><th className="px-6 py-4">Detay</th><th className="px-6 py-4 text-right">Durum / İşlem</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {combinedEntries.map((o: any) => (
                      <tr key={o.id} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">
                          {new Date(o.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-black text-white italic">ODA {o.room_number}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${o.entryType === 'Sipariş' ? 'bg-blue-900/40 text-blue-400' : 'bg-purple-900/40 text-purple-400'}`}>
                            {o.entryType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {o.entryType === 'Sipariş' ? (o.items || []).map((i:any)=>`${i.name} (x${i.quantity})`).join(', ') : o.service_type}
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {o.status === 'delivered' || o.status === 'completed' ? (
                            <span className="flex items-center gap-1 text-emerald-500 font-black uppercase text-[10px]"><CheckCircle2 size={12}/> TAMAMLANDI</span>
                          ) : o.status === 'cancelled' ? (
                            <span className="flex items-center gap-1 text-slate-500 font-black uppercase text-[10px]"><Ban size={12}/> İPTAL EDİLDİ</span>
                          ) : (
                            <>
                              {o.entryType === 'Sipariş' ? (
                                <>
                                  {o.status === 'pending' && (
                                    <button onClick={() => updateOrderStatus(o.id, 'preparing')} className="bg-blue-600/10 text-blue-400 border border-blue-600/20 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] flex items-center gap-1.5 hover:bg-blue-600 hover:text-white transition-all"><Play size={10}/> Hazırla</button>
                                  )}
                                  {o.status === 'preparing' && (
                                    <button onClick={() => updateOrderStatus(o.id, 'delivered')} className="bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] flex items-center gap-1.5 hover:bg-emerald-600 hover:text-white transition-all"><Check size={10}/> Teslim Et</button>
                                  )}
                                  <button onClick={() => updateOrderStatus(o.id, 'cancelled')} className="bg-rose-600/10 text-rose-400 border border-rose-600/20 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] flex items-center gap-1.5 hover:bg-rose-600 hover:text-white transition-all"><X size={10}/> İptal</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => updateServiceStatus(o.id, 'completed')} className="bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 px-3 py-1.5 rounded-lg font-black uppercase text-[9px] flex items-center gap-1.5 hover:bg-emerald-600 hover:text-white transition-all"><Check size={10}/> Tamamla</button>
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
            <div className="flex justify-between items-center bg-[#0f172a] p-3 rounded-2xl border border-white/5 shadow-xl">
               <div className="flex bg-black/20 p-1 rounded-xl">
                  <button onClick={() => setInventorySubView('kitchen')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventorySubView === 'kitchen' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Mutfak</button>
                  <button onClick={() => setInventorySubView('market')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventorySubView === 'market' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Market</button>
                  <button onClick={() => setInventorySubView('services')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${inventorySubView === 'services' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Hizmetler</button>
               </div>
               {inventorySubView !== 'kitchen' && (
                 <div className="relative w-64">
                   <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/>
                   <input type="text" placeholder="Global katalogda ara..." className="w-full bg-black/20 border border-white/5 text-white rounded-xl py-2 pl-10 pr-4 outline-none focus:border-orange-500/50 text-xs font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                 </div>
               )}
            </div>

            {inventorySubView === 'kitchen' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h3 className="text-xl font-black uppercase">Mutfak Menüsü</h3><button className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"><Plus size={14}/> Yemek Ekle</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {kitchenMenu.map(item => (
                    <div key={item.id} className="bg-[#0f172a] p-4 rounded-[2rem] border border-white/5 flex gap-4 items-center shadow-xl">
                      <img src={item.image} className="w-20 h-20 rounded-2xl object-cover" />
                      <div><p className="font-black text-white uppercase">{item.name}</p><p className="text-orange-500 font-black text-xs">₺{item.price}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(inventorySubView === 'market' || inventorySubView === 'services') && (
              <div className="bg-[#0f172a] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {filteredGlobalItems.map(item => {
                    const isActive = inventorySubView === 'market' ? activeMarketIds.includes(item.id) : activeServiceIds.includes(item.id);
                    return (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                           {inventorySubView === 'market' && <img src={item.image} className="w-10 h-10 rounded-lg object-cover bg-black/40"/>}
                           <div>
                              <p className={`font-black uppercase text-xs ${isActive ? 'text-white' : 'text-slate-500'}`}>{item.name || item.name_key}</p>
                              <p className="text-[9px] font-black text-orange-500/60 uppercase">{item.category} {item.price ? `• ₺${item.price}` : ''}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => toggleGlobalItem(inventorySubView as any, item.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-black text-[9px] uppercase tracking-wider ${isActive ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-500 hover:text-white'}`}
                        >
                          {isActive ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
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
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-black text-white uppercase tracking-tight">Oda Listesi & QR</h2>
              <div className="flex gap-3">
                <button onClick={handlePrintAllQR} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white/10 transition-all"><Printer size={14}/> Hepsini Yazdır</button>
                <button onClick={() => setIsSingleAdding(true)} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white/10 transition-all"><Plus size={14}/> Oda Ekle</button>
                <button onClick={() => setIsBulkAdding(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-orange-500 shadow-lg"><Layers size={14}/> Toplu Oluştur</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {rooms.map(room => (
                <div key={room.id} className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 text-center space-y-4 group hover:border-orange-500/50 transition-all shadow-2xl">
                  <p className="font-black text-white text-lg italic">ODA {room.room_number}</p>
                  <div className="aspect-square bg-white rounded-2xl p-2 shadow-inner"><img src={room.qr_url} className="w-full h-full object-contain" /></div>
                  <div className="flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => window.open(room.qr_url, '_blank')} className="text-slate-500 hover:text-white"><Download size={18}/></button>
                    <button onClick={async () => { if(confirm('Silsin mi?')) { await supabase.from('rooms').delete().eq('id', room.id); fetchRooms(hotelIdProp); } }} className="text-slate-500 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'settings' && hotel && (
          <div className="max-w-3xl space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase tracking-tight">Tesis Ayarları</h2>
                <button onClick={handleUpdateHotel} disabled={isUploading} className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-orange-500 transition-all flex items-center gap-2">
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Kaydet
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Genel Bilgiler</h3>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tesis Adı</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500" value={hotel.name || ''} onChange={e => setHotel({...hotel, name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Banner Görsel URL</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500" value={hotel.banner_url || ''} onChange={e => setHotel({...hotel, banner_url: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">WiFi SSID</label>
                            <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500" value={hotel.wifi_name || ''} onChange={e => setHotel({...hotel, wifi_name: e.target.value})} />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">WiFi Şifre</label>
                            <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500" value={hotel.wifi_pass || ''} onChange={e => setHotel({...hotel, wifi_pass: e.target.value})} />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Checkout Saati</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500" value={hotel.checkout_time || ''} onChange={e => setHotel({...hotel, checkout_time: e.target.value})} />
                      </div>
                   </div>
                </div>

                <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">İletişim & Linkler</h3>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Resepsiyon Tel</label>
                            <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500" value={hotel.reception_phone || ''} onChange={e => setHotel({...hotel, reception_phone: e.target.value})} />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">WhatsApp</label>
                            <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500" value={hotel.whatsapp_number || ''} onChange={e => setHotel({...hotel, whatsapp_number: e.target.value})} />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><MapPin size={10}/> Google Maps URL</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500" value={hotel.google_maps_url || ''} onChange={e => setHotel({...hotel, google_maps_url: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Home size={10}/> Airbnb URL</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500" value={hotel.airbnb_url || ''} onChange={e => setHotel({...hotel, airbnb_url: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Star size={10}/> Booking URL</label>
                         <input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none focus:border-orange-500" value={hotel.booking_url || ''} onChange={e => setHotel({...hotel, booking_url: e.target.value})} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Oda Ekle Modalları */}
        {isSingleAdding && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-[#0f172a] w-full max-sm rounded-[3rem] p-10 border border-white/10 text-center animate-fade-in shadow-3xl">
              <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tight italic">Yeni Oda</h3>
              <input type="text" placeholder="No" className="w-full p-5 bg-[#1e293b] border border-white/5 text-white rounded-2xl outline-none font-black text-center text-4xl mb-8 shadow-inner focus:border-orange-500 transition-all" value={singleRoomNum} onChange={e => setSingleRoomNum(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={() => setIsSingleAdding(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px]">İptal</button>
                <button onClick={handleSingleAdd} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-orange-500 active:scale-95 transition-all">Oluştur</button>
              </div>
            </div>
          </div>
        )}

        {isBulkAdding && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-[#0f172a] w-full max-w-sm rounded-[3rem] p-10 border border-white/10 text-center animate-fade-in shadow-3xl">
              <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tight italic">Toplu Oluştur</h3>
              <div className="grid grid-cols-2 gap-4 mb-10 text-left">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Başlangıç</label><input type="number" className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl text-center font-black" value={bulkConfig.start} onChange={e => setBulkConfig({...bulkConfig, start: parseInt(e.target.value) || 1})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Bitiş</label><input type="number" className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl text-center font-black" value={bulkConfig.end} onChange={e => setBulkConfig({...bulkConfig, end: parseInt(e.target.value) || 1})} /></div>
              </div>
              <button onClick={handleBulkAdd} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase shadow-2xl mb-4 hover:bg-orange-500 active:scale-95 transition-all">Başlat</button>
              <button onClick={() => setIsBulkAdding(false)} className="text-slate-500 font-black uppercase text-[10px]">Vazgeç</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HotelPanel;
