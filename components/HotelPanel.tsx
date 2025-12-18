
import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, 
  ChefHat, 
  QrCode, 
  Settings, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Package, 
  Bell,
  Clock,
  Save,
  Download,
  Plus,
  Trash2,
  Image as ImageIcon,
  MoreVertical,
  LogOut,
  X,
  Loader2,
  Upload,
  HandPlatter,
  WashingMachine,
  Building,
  Wifi,
  Phone,
  MessageCircle,
  HelpCircle,
  DollarSign
} from 'lucide-react';
import { supabase, uploadFile, uploadBlob } from '../lib/supabase';
import { MenuItem, Order, Room, Hotel, ServiceRequest } from '../types';
import { TRANSLATIONS } from '../constants';

const HotelPanel: React.FC = () => {
  const [view, setView] = useState<'orders' | 'menu' | 'rooms' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ 
    name: '', 
    description: '', 
    price: 0, 
    type: 'food', 
    popular: false, 
    is_available: true,
    image: '',
    category: 'mains'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hotelLogoRef = useRef<HTMLInputElement>(null);
  const hotelBannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const pathParts = window.location.pathname.split('/').filter(p => p);
      const params = new URLSearchParams(window.location.search);
      
      let hId = '59ffd86b-6ade-4782-8ec1-4d4fa78aefda';

      // URL'den ID çekme (/otel-admin/ID)
      if (pathParts[0] === 'otel-admin' && pathParts[1]) {
        hId = pathParts[1];
      } else {
        hId = params.get('h') || hId;
      }

      setHotelId(hId);
      if (hId) {
        const { data: hotelData } = await supabase.from('hotels').select('*').eq('id', hId).single();
        if (hotelData) setHotel(hotelData);
        fetchData(hId);
      }
    };
    init();

    const channel = supabase
      .channel('hotel-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (hotelId) fetchOrders(hotelId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        if (hotelId) fetchServiceRequests(hotelId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hotelId]);

  const fetchData = (hId: string) => {
    fetchOrders(hId);
    fetchServiceRequests(hId);
    fetchMenu(hId);
    fetchRooms(hId);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'menu' | 'hotelLogo' | 'hotelBanner') => {
    const file = e.target.files?.[0];
    if (!file || !hotelId) return;
    try {
      setIsUploading(true);
      const subFolder = target === 'menu' ? 'products' : 'brand';
      const fileName = `${hotelId}/${subFolder}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const publicUrl = await uploadFile('resimler', file, fileName);
      
      if (target === 'menu') {
        setNewItem(prev => ({ ...prev, image: publicUrl }));
      } else if (target === 'hotelLogo') {
        setHotel(prev => prev ? ({ ...prev, logo_url: publicUrl }) : null);
      } else if (target === 'hotelBanner') {
        setHotel(prev => prev ? ({ ...prev, banner_url: publicUrl }) : null);
      }
    } catch (err) { alert("Resim yüklenemedi."); }
    finally { setIsUploading(false); }
  };

  const saveHotelSettings = async () => {
    if (!hotel) return;
    setIsUploading(true);
    const { error } = await supabase.from('hotels').update(hotel).eq('id', hotel.id);
    if (!error) alert("Tesis bilgileri güncellendi.");
    else alert("Hata: " + error.message);
    setIsUploading(false);
  };

  const saveMenuItem = async () => {
    if (!hotelId || !newItem.name || !newItem.image) {
      alert("İsim ve resim zorunludur.");
      return;
    }
    try {
      setIsUploading(true);
      const payload = { ...newItem, hotel_id: hotelId, price: Number(newItem.price) || 0 };
      const { error } = await supabase.from('menu_items').upsert(payload);
      if (!error) {
        setIsEditingMenu(false);
        setNewItem({ name: '', description: '', price: 0, type: 'food', popular: false, is_available: true, image: '', category: 'mains' });
        fetchMenu(hotelId);
      }
    } catch (err: any) { alert("Menü hatası: " + err.message); }
    finally { setIsUploading(false); }
  };

  const deleteMenuItem = async (id: string) => {
    if (window.confirm("Bu ürün silinsin mi?")) {
      await supabase.from('menu_items').delete().eq('id', id);
      if (hotelId) fetchMenu(hotelId);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomNumber || !hotelId) return;
    try {
      setIsUploading(true);
      const baseUrl = window.location.origin;
      const qrContent = `${baseUrl}/${hotelId}/${newRoomNumber}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrContent)}`;
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const qrFileName = `${hotelId}/qr/room-${newRoomNumber}.png`;
      const qrPublicUrl = await uploadBlob('qr', blob, qrFileName);
      
      await supabase.from('rooms').insert({ hotel_id: hotelId, room_number: newRoomNumber, qr_url: qrPublicUrl });
      setIsAddingRoom(false);
      setNewRoomNumber('');
      fetchRooms(hotelId);
    } catch (err: any) { alert("Oda hatası."); }
    finally { setIsUploading(false); }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    if (hotelId) fetchOrders(hotelId);
  };

  const combinedOrders = [
    ...orders.map(o => ({ ...o, entryType: 'order' })),
    ...serviceRequests.map(s => ({ ...s, entryType: 'service' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-inter">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col gap-10 shadow-sm z-50 sticky top-0 h-screen">
        <div className="flex items-center gap-4 px-2">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><ChefHat size={28} /></div>
           <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black truncate">{hotel?.name || 'Yönetim'}</h1>
              <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Aktif</span>
           </div>
        </div>
        
        <nav className="space-y-1.5">
          <button onClick={() => setView('orders')} className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'orders' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <div className="flex items-center gap-3"><ClipboardList size={20} /> Siparişler</div>
          </button>
          <button onClick={() => setView('menu')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'menu' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><Package size={20} /> Menü Yönetimi</button>
          <button onClick={() => setView('rooms')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'rooms' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><QrCode size={20} /> Odalar & QR</button>
          <button onClick={() => setView('settings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${view === 'settings' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><Settings size={20} /> Tesis Ayarları</button>
        </nav>

        <button onClick={() => window.location.reload()} className="flex items-center gap-3 px-6 py-2 text-slate-400 font-bold hover:text-slate-900 transition-colors text-sm">
          <LogOut size={18} /> Çıkış Yap
        </button>
      </div>

      <div className="flex-1 p-12 overflow-y-auto no-scrollbar">
        {view === 'orders' && (
          <div className="animate-fade-in space-y-10">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">Canlı Akış</h2>
            <div className="space-y-4">
              {combinedOrders.map((entry: any) => (
                <div key={entry.id} className={`bg-white border-2 rounded-[3rem] p-8 shadow-sm flex items-center justify-between ${entry.status === 'pending' ? 'border-orange-500' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-10">
                     <div className="w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center bg-slate-50 border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-black uppercase">ODA</span>
                        <span className="text-3xl font-black text-slate-900">{entry.room_number}</span>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="bg-orange-600 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">{entry.entryType === 'service' ? 'HİZMET' : 'SİPARİŞ'}</span>
                        </div>
                        <p className="text-xl font-black text-slate-900 leading-tight">
                          {entry.entryType === 'service' ? entry.service_type : entry.items.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
                          {new Date(entry.created_at).toLocaleTimeString('tr-TR')}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-8">
                     <p className="text-3xl font-black text-slate-900">₺{entry.total_amount?.toLocaleString() || 0}</p>
                     <div className="flex gap-2">
                        {entry.status === 'pending' && (
                          <button onClick={() => updateOrderStatus(entry.id, 'preparing')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[11px] shadow-xl hover:bg-orange-600 transition-all uppercase tracking-widest active:scale-95">İŞLEME AL</button>
                        )}
                        {entry.status === 'preparing' && (
                          <button onClick={() => updateOrderStatus(entry.id, 'delivered')} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest active:scale-95">TESLİM ET</button>
                        )}
                        {entry.status === 'delivered' && <CheckCircle size={24} className="text-emerald-500" />}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'settings' && hotel && (
          <div className="animate-fade-in space-y-12 max-w-5xl">
             <header className="flex justify-between items-end">
                <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-3">Tesis Ayarları</h2>
                <button onClick={saveHotelSettings} disabled={isUploading} className="bg-orange-600 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-orange-500 transition-all active:scale-95">
                   {isUploading ? <Loader2 className="animate-spin" /> : <Save size={24} />} Değişiklikleri Kaydet
                </button>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-8">
                   <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                      <h4 className="font-black text-slate-900 uppercase tracking-widest text-[11px] border-b pb-4">Görseller</h4>
                      <div className="space-y-4">
                         <div onClick={() => hotelLogoRef.current?.click()} className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center cursor-pointer overflow-hidden">
                            {hotel.logo_url ? <img src={hotel.logo_url} className="w-full h-full object-contain p-4" /> : <Upload className="text-slate-300"/>}
                         </div>
                         <input type="file" ref={hotelLogoRef} className="hidden" onChange={e => handleImageUpload(e, 'hotelLogo')} />
                         <div onClick={() => hotelBannerRef.current?.click()} className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center cursor-pointer overflow-hidden">
                            {hotel.banner_url ? <img src={hotel.banner_url} className="w-full h-full object-cover" /> : <Upload className="text-slate-300"/>}
                         </div>
                         <input type="file" ref={hotelBannerRef} className="hidden" onChange={e => handleImageUpload(e, 'hotelBanner')} />
                      </div>
                   </div>
                </div>
                <div className="md:col-span-2 space-y-10">
                   <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Tesis Adı</label>
                            <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg" value={hotel.name} onChange={e => setHotel({...hotel, name: e.target.value})} />
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">WhatsApp</label>
                            <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={hotel.whatsapp_number} onChange={e => setHotel({...hotel, whatsapp_number: e.target.value})} />
                         </div>
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">WiFi Şifre</label>
                            <input type="text" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={hotel.wifi_pass} onChange={e => setHotel({...hotel, wifi_pass: e.target.value})} />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelPanel;
