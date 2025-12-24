
import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, ChefHat, QrCode, Settings, CheckCircle, Package, Save, Plus, Trash2, 
  LogOut, X, Loader2, Upload, Home, Info, ShoppingBasket, ExternalLink
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
  
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ 
    name: '', description: '', price: 0, type: 'food', popular: false, is_available: true, image: '', category: 'mains'
  });

  const hotelLogoRef = useRef<HTMLInputElement>(null);
  const hotelBannerRef = useRef<HTMLInputElement>(null);
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
    await Promise.all([
      fetchOrders(hId),
      fetchServiceRequests(hId),
      fetchMenu(hId),
      fetchRooms(hId)
    ]);
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
    if (data) setRooms(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'menu' | 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !hotelIdProp) return;
    try {
      setIsUploading(true);
      const fileName = `${hotelIdProp}/${target}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const url = await uploadFile('resimler', file, fileName);
      if (target === 'menu') setNewItem(prev => ({ ...prev, image: url }));
      else if (target === 'logo') setHotel(prev => prev ? ({ ...prev, logo_url: url }) : null);
      else if (target === 'banner') setHotel(prev => prev ? ({ ...prev, banner_url: url }) : null);
    } catch (err) { alert("Resim yükleme hatası!"); }
    finally { setIsUploading(false); }
  };

  const saveHotelSettings = async () => {
    if (!hotel) return;
    setIsUploading(true);
    const { error } = await supabase.from('hotels').update({
      name: hotel.name,
      logo_url: hotel.logo_url,
      banner_url: hotel.banner_url,
      wifi_name: hotel.wifi_name,
      wifi_pass: hotel.wifi_pass,
      whatsapp_number: hotel.whatsapp_number,
      checkout_time: hotel.checkout_time
    }).eq('id', hotel.id);
    if (!error) alert("Ayarlar başarıyla kaydedildi!");
    else alert("Hata: " + error.message);
    setIsUploading(false);
  };

  const saveMenuItem = async () => {
    if (!hotelIdProp || !newItem.name || !newItem.image) return alert("Eksik bilgi!");
    setIsUploading(true);
    const { error } = await supabase.from('menu_items').upsert({ ...newItem, hotel_id: hotelIdProp });
    if (!error) {
      setIsEditingMenu(false);
      setNewItem({ name: '', description: '', price: 0, type: 'food', popular: false, is_available: true, image: '', category: 'mains' });
      fetchMenu(hotelIdProp);
    }
    setIsUploading(false);
  };

  const handleAddRoom = async () => {
    if (!newRoomNumber || !hotelIdProp) return;
    setIsUploading(true);
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/${hotelIdProp}/${newRoomNumber}`)}`;
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const publicUrl = await uploadBlob('qr', blob, `${hotelIdProp}/qr/${newRoomNumber}.png`);
      await supabase.from('rooms').insert({ hotel_id: hotelIdProp, room_number: newRoomNumber, qr_url: publicUrl });
      setIsAddingRoom(false);
      setNewRoomNumber('');
      fetchRooms(hotelIdProp);
    } catch (e) { alert("QR Hatası!"); }
    finally { setIsUploading(false); }
  };

  const updateStatus = async (id: string, table: 'orders' | 'service_requests', status: string) => {
    await supabase.from(table).update({ status }).eq('id', id);
    if (hotelIdProp) table === 'orders' ? fetchOrders(hotelIdProp) : fetchServiceRequests(hotelIdProp);
  };

  const combinedOrders = [
    ...orders.map(o => ({ ...o, entryType: 'order' })),
    ...serviceRequests.map(s => ({ ...s, entryType: 'service' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12">
        <Loader2 className="animate-spin text-orange-600 mb-6" size={48} />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Veriler Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col gap-10 sticky top-0 h-screen">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><ChefHat size={28}/></div>
          <div className="flex-1 min-w-0"><h1 className="text-xl font-black truncate">{hotel?.name}</h1><p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Otel Paneli</p></div>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setView('orders')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'orders' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-500 hover:bg-slate-50'}`}><ClipboardList size={20}/> Siparişler</button>
          <button onClick={() => setView('menu')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'menu' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-500 hover:bg-slate-50'}`}><Package size={20}/> Menü Yönetimi</button>
          <button onClick={() => setView('rooms')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'rooms' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-500 hover:bg-slate-50'}`}><QrCode size={20}/> Odalar & QR</button>
          <button onClick={() => setView('settings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'settings' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-500 hover:bg-slate-50'}`}><Settings size={20}/> Tesis Ayarları</button>
        </nav>
        <div className="pt-6 border-t border-slate-100 space-y-2">
          <button onClick={() => onNavigate('landing', '/')} className="w-full flex items-center gap-3 px-6 py-3 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all text-xs"><Home size={18}/> Ana Sayfa</button>
          <button onClick={() => window.location.reload()} className="w-full flex items-center gap-3 px-6 py-3 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 transition-all text-xs"><LogOut size={18}/> Çıkış Yap</button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-12 overflow-y-auto no-scrollbar">
        {view === 'orders' && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-4xl font-black text-slate-900">Canlı Siparişler</h2>
            <div className="grid gap-4">
              {combinedOrders.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
                  <Info className="mx-auto text-slate-300 mb-4" size={48}/>
                  <p className="text-slate-400 font-bold">Henüz sipariş veya talep yok.</p>
                </div>
              ) : combinedOrders.map((o: any) => (
                <div key={o.id} className={`bg-white p-8 rounded-[2.5rem] border-2 flex items-center justify-between shadow-sm transition-all ${o.status === 'pending' ? 'border-orange-500 bg-orange-50/10' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-slate-400">ODA</span>
                      <span className="text-2xl font-black">{o.room_number}</span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${o.entryType === 'order' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{o.entryType === 'order' ? 'SİPARİŞ' : 'HİZMET'}</span>
                      <h4 className="text-lg font-black mt-1">{o.entryType === 'order' ? o.items.map((i:any)=>`${i.name} x${i.quantity}`).join(', ') : o.service_type}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">{new Date(o.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {o.entryType === 'order' && <span className="text-2xl font-black text-slate-900">₺{o.total_amount}</span>}
                    <div className="flex gap-2">
                       {o.status === 'pending' ? (
                        <button onClick={() => updateStatus(o.id, o.entryType === 'order' ? 'orders' : 'service_requests', 'preparing')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-orange-600 transition-all shadow-lg active:scale-95">İŞLEME AL</button>
                      ) : o.status === 'preparing' ? (
                        <button onClick={() => updateStatus(o.id, o.entryType === 'order' ? 'orders' : 'service_requests', 'delivered')} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-xs shadow-lg active:scale-95">TAMAMLA</button>
                      ) : <CheckCircle className="text-emerald-500" size={32}/>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
               <h2 className="text-4xl font-black text-slate-900">Menü Yönetimi</h2>
               <button onClick={() => setIsEditingMenu(true)} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Plus size={20}/> Ürün Ekle</button>
            </div>
            {menuItems.length === 0 ? (
               <div className="bg-white rounded-[3rem] p-32 text-center border-2 border-dashed border-slate-200">
                  <Package className="mx-auto text-slate-200 mb-6" size={64}/>
                  <h3 className="text-2xl font-black text-slate-400 mb-8">Henüz ürün eklenmemiş</h3>
                  <button onClick={() => setIsEditingMenu(true)} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black">İlk Ürünü Ekle</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {menuItems.map(item => (
                   <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col group hover:shadow-xl transition-all">
                     <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 bg-slate-100">
                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                     </div>
                     <h4 className="text-xl font-black mb-2">{item.name}</h4>
                     <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-1">{item.description}</p>
                     <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="text-2xl font-black text-orange-600">₺{item.price}</span>
                        <div className="flex gap-2">
                           <button onClick={async () => { if(confirm('Bu ürün menüden silinsin mi?')) { await supabase.from('menu_items').delete().eq('id', item.id); fetchMenu(hotelIdProp); } }} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {view === 'rooms' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
               <h2 className="text-4xl font-black text-slate-900">Odalar & QR Kodlar</h2>
               <button onClick={() => setIsAddingRoom(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Plus size={20}/> Oda Tanımla</button>
            </div>
            {rooms.length === 0 ? (
               <div className="bg-white rounded-[3rem] p-32 text-center border-2 border-dashed border-slate-200">
                  <QrCode className="mx-auto text-slate-200 mb-6" size={64}/>
                  <h3 className="text-2xl font-black text-slate-400 mb-8">Oda tanımlaması yapılmamış</h3>
                  <button onClick={() => setIsAddingRoom(true)} className="bg-orange-600 text-white px-10 py-5 rounded-2xl font-black">QR Kod Oluştur</button>
               </div>
            ) : (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {rooms.map(room => (
                    <div key={room.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 text-center space-y-4 hover:shadow-xl transition-all group">
                       <div className="text-3xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">{room.room_number}</div>
                       <div className="aspect-square bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100">
                          <img src={room.qr_url} className="w-full h-full object-contain" />
                       </div>
                       <div className="flex flex-col gap-2">
                          <button onClick={() => window.open(room.qr_url, '_blank')} className="text-[10px] font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest flex items-center justify-center gap-1 mx-auto transition-colors"><ExternalLink size={12}/> İNDİR</button>
                          <button onClick={async () => { if(confirm('Oda kaydı silinsin mi?')) { await supabase.from('rooms').delete().eq('id', room.id); fetchRooms(hotelIdProp); } }} className="text-[10px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors">SİL</button>
                       </div>
                    </div>
                  ))}
               </div>
            )}
          </div>
        )}

        {view === 'settings' && hotel && (
          <div className="space-y-12 animate-fade-in max-w-4xl">
             <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black text-slate-900">Tesis Ayarları</h2>
                  <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Marka Kimliği & Bilgiler</p>
                </div>
                <button onClick={saveHotelSettings} disabled={isUploading} className="bg-orange-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-orange-500 transition-all active:scale-95">
                   {isUploading ? <Loader2 className="animate-spin"/> : <Save size={20}/>} Ayarları Kaydet
                </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                   <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Kurumsal Logo</p>
                        <div onClick={() => hotelLogoRef.current?.click()} className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden p-6 hover:border-orange-500 transition-all">
                          {hotel.logo_url ? <img src={hotel.logo_url} className="w-full h-full object-contain" /> : <><Upload className="text-slate-300 mb-2"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">YÜKLE</span></>}
                        </div>
                        <input type="file" ref={hotelLogoRef} className="hidden" onChange={e => handleImageUpload(e, 'logo')} />
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Banner Görseli</p>
                        <div onClick={() => hotelBannerRef.current?.click()} className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden p-6 hover:border-orange-500 transition-all">
                          {hotel.banner_url ? <img src={hotel.banner_url} className="w-full h-full object-cover rounded-2xl" /> : <><Upload className="text-slate-300 mb-2"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">YÜKLE</span></>}
                        </div>
                        <input type="file" ref={hotelBannerRef} className="hidden" onChange={e => handleImageUpload(e, 'banner')} />
                      </div>
                   </div>
                </div>

                <div className="md:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 space-y-10 shadow-sm">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="col-span-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block mb-2">Tesis Resmi Adı</label>
                         <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:outline-none focus:border-orange-500 transition-all" value={hotel.name} onChange={e => setHotel({...hotel, name: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block mb-2">WhatsApp Destek</label>
                         <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:outline-none focus:border-orange-500 transition-all" value={hotel.whatsapp_number} onChange={e => setHotel({...hotel, whatsapp_number: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block mb-2">Checkout Saati</label>
                         <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:outline-none focus:border-orange-500 transition-all" value={hotel.checkout_time} onChange={e => setHotel({...hotel, checkout_time: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block mb-2">WiFi Ağı Adı</label>
                         <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:outline-none focus:border-orange-500 transition-all" value={hotel.wifi_name} onChange={e => setHotel({...hotel, wifi_name: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block mb-2">WiFi Şifresi</label>
                         <input type="text" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:outline-none focus:border-orange-500 transition-all" value={hotel.wifi_pass} onChange={e => setHotel({...hotel, wifi_pass: e.target.value})} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {isEditingMenu && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[4rem] w-full max-w-xl shadow-2xl animate-fade-in">
            <div className="flex justify-between mb-8 items-center">
               <h3 className="text-3xl font-black">Yeni Ürün Ekle</h3>
               <button onClick={() => setIsEditingMenu(false)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X size={24}/></button>
            </div>
            <div className="space-y-6">
               <div onClick={() => menuImgRef.current?.click()} className="w-full h-56 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden p-2 group hover:border-orange-500 transition-all">
                  {newItem.image ? <img src={newItem.image} className="w-full h-full object-cover rounded-2xl" /> : <><Upload className="text-slate-300 mb-2"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RESİM YÜKLE</span></>}
               </div>
               <input type="file" ref={menuImgRef} className="hidden" onChange={e => handleImageUpload(e, 'menu')} />
               <input type="text" placeholder="Ürün Adı" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-orange-500 transition-all" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
               <textarea placeholder="Ürün Açıklaması (Misafire görünecek detaylar)" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold h-32 outline-none focus:border-orange-500 transition-all" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
               <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Fiyat (₺)" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-orange-500 transition-all" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
                  <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none focus:border-orange-500 transition-all" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as any})}>
                     <option value="food">Yemek & Mutfak</option>
                     <option value="market">Mini Market</option>
                  </select>
               </div>
               <button onClick={saveMenuItem} disabled={isUploading} className="w-full bg-orange-600 text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-orange-500 transition-all active:scale-95 flex items-center justify-center gap-3">
                 {isUploading ? <Loader2 className="animate-spin"/> : <Save size={24}/>} Ürünü Kaydet
               </button>
            </div>
          </div>
        </div>
      )}

      {isAddingRoom && (
         <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[4rem] w-full max-w-sm text-center shadow-2xl animate-fade-in">
               <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <QrCode size={40}/>
               </div>
               <h3 className="text-3xl font-black mb-2">Oda Tanımla</h3>
               <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-[10px]">Her oda için eşsiz QR kod üretilir.</p>
               <input type="text" placeholder="ODA NO" className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl font-black text-center text-4xl mb-8 outline-none focus:border-orange-500 transition-all" value={newRoomNumber} onChange={e => setNewRoomNumber(e.target.value)} />
               <button onClick={handleAddRoom} disabled={isUploading} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                 {isUploading ? <Loader2 className="animate-spin"/> : 'QR Kodu Üret'}
               </button>
               <button onClick={() => setIsAddingRoom(false)} className="mt-6 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors">Vazgeç</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default HotelPanel;
