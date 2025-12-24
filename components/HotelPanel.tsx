
import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, Package, QrCode, Settings, Plus, Trash2, 
  X, Loader2, Save, Download, Edit3, Image as ImageIcon,
  Search, MoreVertical, CheckCircle, Layers, Home, Upload, ChevronRight
} from 'lucide-react';
import { supabase, uploadFile, uploadBlob } from '../lib/supabase';
import { MenuItem, Order, Room, Hotel, ServiceRequest, PanelState } from '../types';

interface HotelPanelProps {
  onNavigate: (mode: PanelState, path: string) => void;
  hotelIdProp: string;
}

const HotelPanel: React.FC<HotelPanelProps> = ({ onNavigate, hotelIdProp }) => {
  const [view, setView] = useState<'orders' | 'menu' | 'rooms' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'food' | 'market'>('all');
  
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ 
    name: '', description: '', price: 0, type: 'food', popular: false, is_available: true, image: '', category: 'mains'
  });

  const hotelLogoRef = useRef<HTMLInputElement>(null);
  const menuImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hotelIdProp) {
      loadAllData(hotelIdProp);
      const channel = supabase.channel(`hotel-${hotelIdProp}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `hotel_id=eq.${hotelIdProp}` }, () => fetchOrders(hotelIdProp))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `hotel_id=eq.${hotelIdProp}` }, () => fetchServiceRequests(hotelIdProp))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [hotelIdProp]);

  const loadAllData = async (hId: string) => {
    setIsLoadingData(true);
    const { data: hotelData } = await supabase.from('hotels').select('*').eq('id', hId).single();
    if (hotelData) setHotel(hotelData);
    await Promise.all([fetchOrders(hId), fetchServiceRequests(hId), fetchMenu(hId), fetchRooms(hId)]);
    setIsLoadingData(false);
  };

  const fetchOrders = async (hId: string) => {
    const { data } = await supabase.from('orders').select('*').eq('hotel_id', hId).order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchServiceRequests = async (hId: string) => {
    const { data } = await supabase.from('service_requests').select('*').eq('hotel_id', hId).order('created_at', { ascending: false });
    if (data) setServiceRequests(data);
  };

  const fetchMenu = async (hId: string) => {
    const { data } = await supabase.from('menu_items').select('*').eq('hotel_id', hId).order('created_at', { ascending: false });
    if (data) setMenuItems(data);
  };

  const fetchRooms = async (hId: string) => {
    const { data } = await supabase.from('rooms').select('*').eq('hotel_id', hId).order('room_number', { ascending: true });
    setRooms(data || []);
  };

  const handleUpdateHotel = async () => {
    if (!hotel) return;
    setIsUploading(true);
    const { error } = await supabase.from('hotels').update({
      name: hotel.name,
      wifi_name: hotel.wifi_name,
      wifi_pass: hotel.wifi_pass,
      whatsapp_number: hotel.whatsapp_number,
      checkout_time: hotel.checkout_time,
      logo_url: hotel.logo_url,
      banner_url: hotel.banner_url
    }).eq('id', hotel.id);
    
    if (!error) alert("Ayarlar başarıyla güncellendi!");
    else alert("Güncelleme hatası!");
    setIsUploading(false);
  };

  const saveMenuItem = async () => {
    if (!newItem.name || !hotelIdProp) return;
    setIsUploading(true);
    const { error } = await supabase.from('menu_items').upsert({ ...newItem, hotel_id: hotelIdProp });
    if (!error) {
      setIsEditingMenu(false);
      fetchMenu(hotelIdProp);
    }
    setIsUploading(false);
  };

  const handleDownloadQR = async (room: Room) => {
    if (!room.qr_url) return;
    const res = await fetch(room.qr_url);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `room-${room.room_number}-qr.png`;
    link.click();
  };

  const updateStatus = async (id: string, table: 'orders' | 'service_requests', status: string) => {
    await supabase.from(table).update({ status }).eq('id', id);
    table === 'orders' ? fetchOrders(hotelIdProp) : fetchServiceRequests(hotelIdProp);
  };

  const filteredMenu = menuItems.filter(item => inventoryFilter === 'all' || item.type === inventoryFilter);

  const combinedOrders = [
    ...orders.map(o => ({ ...o, entryType: 'order' })),
    ...serviceRequests.map(s => ({ ...s, entryType: 'service' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (isLoadingData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-[13px] text-slate-700">
      {/* Sidebar - Pro SaaS Compact */}
      <aside className="w-56 bg-slate-900 flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-5 flex items-center gap-2 border-b border-white/5 bg-slate-950/50">
          <div className="w-7 h-7 bg-orange-600 rounded flex items-center justify-center text-white font-bold">f</div>
          <span className="font-bold text-white tracking-tight">forGuest <span className="text-orange-500">Admin</span></span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => setView('orders')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all font-medium ${view === 'orders' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><ClipboardList size={16}/> Siparişler</button>
          <button onClick={() => setView('menu')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all font-medium ${view === 'menu' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><Package size={16}/> Envanter</button>
          <button onClick={() => setView('rooms')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all font-medium ${view === 'rooms' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><QrCode size={16}/> Terminaller</button>
          <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all font-medium ${view === 'settings' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}><Settings size={16}/> Ayarlar</button>
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={() => onNavigate('landing', '/')} className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-white"><Home size={14}/> Siteye Dön</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="font-semibold text-slate-400">Yönetim / <span className="text-slate-900 capitalize font-bold">{view}</span></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
               <span className="font-bold text-[10px] text-slate-600 uppercase tracking-wider">{hotel?.name}</span>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {view === 'orders' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold tracking-tight">Canlı Operasyon Akışı</h2>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Ünite</th>
                      <th className="px-5 py-3">Kategori</th>
                      <th className="px-5 py-3">İçerik Detayı</th>
                      <th className="px-5 py-3 text-right">Tutar</th>
                      <th className="px-5 py-3">Zaman</th>
                      <th className="px-5 py-3 text-center">Durum</th>
                      <th className="px-5 py-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {combinedOrders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 group">
                        <td className="px-5 py-3 font-bold text-slate-900">{o.room_number}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${o.entryType === 'order' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                            {o.entryType === 'order' ? 'Mutfak' : 'Servis'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500 max-w-xs truncate">
                          {o.entryType === 'order' ? o.items.map((i:any)=>`${i.name} x${i.quantity}`).join(', ') : o.service_type}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900">{o.entryType === 'order' ? `₺${o.total_amount}` : '-'}</td>
                        <td className="px-5 py-3 text-slate-400 text-xs font-medium">{new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${o.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {o.status === 'pending' && <button onClick={() => updateStatus(o.id, o.entryType === 'order' ? 'orders' : 'service_requests', 'preparing')} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"><CheckCircle size={14}/></button>}
                            <button className="p-1.5 hover:bg-slate-100 text-slate-400 rounded"><MoreVertical size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'menu' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <div className="flex bg-slate-200/50 p-1 rounded-lg">
                    {['all', 'food', 'market'].map(f => (
                      <button key={f} onClick={() => setInventoryFilter(f as any)} className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${inventoryFilter === f ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500'}`}>
                        {f === 'all' ? 'Tümü' : f === 'food' ? 'Mutfak' : 'Market'}
                      </button>
                    ))}
                 </div>
                 <button onClick={() => { setNewItem({ name: '', description: '', price: 0, type: 'food', popular: false, is_available: true, image: '', category: 'mains' }); setIsEditingMenu(true); }} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/10"><Plus size={14}/> Yeni Ürün</button>
               </div>
               <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Ürün</th>
                        <th className="px-5 py-3">Mod</th>
                        <th className="px-5 py-3">Kategori</th>
                        <th className="px-5 py-3 text-right">Birim Fiyat</th>
                        <th className="px-5 py-3 text-center">Stok</th>
                        <th className="px-5 py-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMenu.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 group">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <img src={item.image} className="w-8 h-8 rounded-md object-cover border border-slate-200 shadow-sm" />
                              <div className="font-bold text-slate-900">{item.name}</div>
                            </div>
                          </td>
                          <td className="px-5 py-3"><span className="text-[10px] font-bold text-slate-400 uppercase">{item.type}</span></td>
                          <td className="px-5 py-3 text-slate-500 uppercase font-bold text-[10px]">{item.category}</td>
                          <td className="px-5 py-3 text-right font-black text-slate-900">₺{item.price}</td>
                          <td className="px-5 py-3 text-center">
                             <div className={`w-2 h-2 rounded-full mx-auto ${item.is_available ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`}></div>
                          </td>
                          <td className="px-5 py-3 text-right">
                             <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setNewItem(item); setIsEditingMenu(true); }} className="p-1.5 hover:bg-slate-100 text-slate-400 rounded"><Edit3 size={14}/></button>
                                <button onClick={async () => { if(confirm('Ürünü sil?')) { await supabase.from('menu_items').delete().eq('id', item.id); fetchMenu(hotelIdProp); } }} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded"><Trash2 size={14}/></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {view === 'settings' && hotel && (
            <div className="max-w-3xl space-y-6 animate-fade-in">
               <div className="bg-white p-10 rounded-xl border border-slate-200 shadow-sm space-y-10">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                    <div>
                       <h2 className="text-xl font-bold tracking-tight">Otel Profili & Konfigürasyon</h2>
                       <p className="text-slate-400 text-[11px] mt-1">Misafirlere görünecek tüm teknik ve görsel detaylar.</p>
                    </div>
                    <button onClick={handleUpdateHotel} disabled={isUploading} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10">
                      {isUploading ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Güncelle
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1.5 col-span-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">İşletme Adı</label>
                       <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-bold text-sm" value={hotel.name} onChange={e => setHotel({...hotel, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WiFi SSID</label>
                       <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-bold text-sm" value={hotel.wifi_name || ''} onChange={e => setHotel({...hotel, wifi_name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WiFi Şifresi</label>
                       <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-bold text-sm" value={hotel.wifi_pass || ''} onChange={e => setHotel({...hotel, wifi_pass: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp Destek Hattı</label>
                       <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-bold text-sm" value={hotel.whatsapp_number || ''} onChange={e => setHotel({...hotel, whatsapp_number: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Check-out Saati</label>
                       <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-bold text-sm" value={hotel.checkout_time || ''} onChange={e => setHotel({...hotel, checkout_time: e.target.value})} />
                    </div>
                    
                    <div className="col-span-2 pt-6 border-t border-slate-100 grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kurumsal Logo</label>
                          <div className="h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer group hover:border-orange-500 transition-all overflow-hidden relative">
                             {hotel.logo_url ? <img src={hotel.logo_url} className="w-full h-full object-contain p-6" /> : <ImageIcon className="text-slate-300" size={32} />}
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Banner Görseli (Geniş)</label>
                          <div className="h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer group hover:border-orange-500 transition-all overflow-hidden relative">
                             {hotel.banner_url ? <img src={hotel.banner_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={32} />}
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === 'rooms' && (
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <h2 className="text-lg font-bold tracking-tight">QR Terminalleri</h2>
                 <div className="flex gap-2">
                    <button onClick={() => setIsBulkAdding(true)} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md font-bold text-[11px] flex items-center gap-2 border border-slate-200 hover:bg-slate-200 transition-all"><Layers size={14}/> Toplu Oluştur</button>
                    <button onClick={() => setIsAddingRoom(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-md font-bold text-[11px] flex items-center gap-2 hover:bg-orange-600 transition-all"><Plus size={14}/> Yeni Oda</button>
                 </div>
               </div>
               <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {rooms.map(room => (
                    <div key={room.id} className="bg-white p-3 rounded-lg border border-slate-200 text-center space-y-2 hover:shadow-md transition-all group relative">
                       <p className="font-bold text-slate-900 text-sm">{room.room_number}</p>
                       <div className="aspect-square bg-slate-50 rounded border border-slate-100 p-1">
                          <img src={room.qr_url} className="w-full h-full object-contain" />
                       </div>
                       <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDownloadQR(room)} className="text-slate-400 hover:text-orange-600 transition-colors"><Download size={12}/></button>
                          <button onClick={async () => { if(confirm('Sil?')) { await supabase.from('rooms').delete().eq('id', room.id); fetchRooms(hotelIdProp); } }} className="text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={12}/></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Ürün Ekle/Düzenle - SaaS Minimal Modal */}
      {isEditingMenu && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 space-y-5 animate-fade-in border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="font-bold text-sm uppercase tracking-tight text-slate-900">{newItem.id ? 'Ürünü Düzenle' : 'Kataloğa Ürün Ekle'}</h3>
                <button onClick={() => setIsEditingMenu(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
              </div>
              <div className="space-y-3">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Ürün Adı</label>
                    <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-bold" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Fiyat</label>
                       <input type="number" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-black" value={newItem.price || 0} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Departman</label>
                       <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-bold" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as any})}>
                          <option value="food">Mutfak</option>
                          <option value="market">Market</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Kategori</label>
                    <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-bold" value={newItem.category || ''} onChange={e => setNewItem({...newItem, category: e.target.value})} placeholder="Örn: Tatlılar" />
                 </div>
                 <div className="flex gap-2 pt-2">
                    <button onClick={saveMenuItem} disabled={isUploading} className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-orange-600 transition-all text-xs uppercase tracking-widest">
                       {isUploading ? <Loader2 className="animate-spin mx-auto" size={14}/> : 'Kaydet'}
                    </button>
                    <button onClick={() => setIsEditingMenu(false)} className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-lg font-bold text-xs uppercase">İptal</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HotelPanel;
