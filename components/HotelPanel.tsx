
import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, ChefHat, QrCode, Settings, CheckCircle, Package, Save, Plus, Trash2, 
  X, Loader2, Upload, Home, Info, ExternalLink, Layers, Download, Edit3, Image as ImageIcon
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
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [bulkRange, setBulkRange] = useState({ start: 1, end: 10 });
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
    const { data } = await supabase.from('rooms').select('*').eq('hotel_id', hId).order('room_number', { ascending: true }, );
    const sorted = (data || []).sort((a, b) => {
      const numA = parseInt(a.room_number.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.room_number.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    setRooms(sorted);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'menu' | 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !hotelIdProp) return;
    try {
      if (target === 'logo') setUploadingLogo(true);
      else if (target === 'banner') setUploadingBanner(true);
      else setIsUploading(true);

      const fileName = `${hotelIdProp}/${target}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const url = await uploadFile('resimler', file, fileName);
      if (target === 'menu') setNewItem(prev => ({ ...prev, image: url }));
      else if (target === 'logo') setHotel(prev => prev ? ({ ...prev, logo_url: url }) : null);
      else if (target === 'banner') setHotel(prev => prev ? ({ ...prev, banner_url: url }) : null);
    } catch (err) { alert("Resim yükleme hatası!"); }
    finally { setUploadingLogo(false); setUploadingBanner(false); setIsUploading(false); }
  };

  const createAndUploadQR = async (roomNo: string): Promise<string> => {
    const appBaseUrl = window.location.origin;
    const qrContent = `${appBaseUrl}/${hotelIdProp}/${roomNo}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrContent)}`;
    
    const res = await fetch(qrApiUrl);
    if (!res.ok) throw new Error("QR API error");
    const blob = await res.blob();
    
    const publicUrl = await uploadBlob('qr', blob, `${hotelIdProp}/qr/${roomNo}.png`);
    return publicUrl;
  };

  const handleAddSingleRoom = async () => {
    if (!newRoomNumber || !hotelIdProp) return;
    setIsUploading(true);
    try {
      const qrUrl = await createAndUploadQR(newRoomNumber);
      const { error } = await supabase.from('rooms').insert({
        hotel_id: hotelIdProp,
        room_number: newRoomNumber,
        qr_url: qrUrl
      });
      if (error) throw error;
      
      setIsAddingRoom(false);
      setNewRoomNumber('');
      fetchRooms(hotelIdProp);
    } catch (e) {
      console.error(e);
      alert("Oda oluşturulurken hata!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (bulkRange.start > bulkRange.end) return alert("Başlangıç değeri bitişten büyük olamaz!");
    const count = bulkRange.end - bulkRange.start + 1;
    if (count > 200) return alert("Tek seferde en fazla 200 oda oluşturulabilir.");

    setIsUploading(true);
    const roomBatch: any[] = [];
    
    try {
      for (let i = bulkRange.start; i <= bulkRange.end; i++) {
        const roomNo = i.toString();
        if (rooms.some(r => r.room_number === roomNo)) continue;
        
        const qrUrl = await createAndUploadQR(roomNo);
        roomBatch.push({
          hotel_id: hotelIdProp,
          room_number: roomNo,
          qr_url: qrUrl
        });
      }

      if (roomBatch.length > 0) {
        const { error } = await supabase.from('rooms').insert(roomBatch);
        if (error) throw error;
      }

      setIsBulkAdding(false);
      alert(`${roomBatch.length} oda başarıyla oluşturuldu.`);
      fetchRooms(hotelIdProp);
    } catch (e) {
      console.error("Bulk Error:", e);
      alert("Toplu oluşturma sırasında hata! Lütfen tekrar deneyin.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadQR = async (room: Room) => {
    if (!room.qr_url) return;
    try {
      const response = await fetch(room.qr_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `oda-${room.room_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("İndirme başarısız!");
    }
  };

  const saveHotelSettings = async () => {
    if (!hotel || !hotelIdProp) return;
    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('hotels')
        .update({
          name: hotel.name,
          logo_url: hotel.logo_url,
          banner_url: hotel.banner_url,
          wifi_name: hotel.wifi_name,
          wifi_pass: hotel.wifi_pass,
          checkout_time: hotel.checkout_time,
          whatsapp_number: hotel.whatsapp_number,
        })
        .eq('id', hotelIdProp);

      if (error) throw error;
      alert("Ayarlar başarıyla kaydedildi!");
    } catch (err) {
      console.error(err);
      alert("Ayarlar kaydedilirken bir hata oluştu!");
    } finally {
      setIsUploading(false);
    }
  };

  const saveMenuItem = async () => {
    if (!newItem.name || !hotelIdProp) return alert("Ürün adı gereklidir!");
    setIsUploading(true);
    try {
      const itemToSave = { ...newItem, hotel_id: hotelIdProp };
      const { error } = await supabase.from('menu_items').upsert(itemToSave);
      if (error) throw error;
      
      setIsEditingMenu(false);
      setNewItem({ 
        name: '', description: '', price: 0, type: 'food', popular: false, is_available: true, image: '', category: 'mains'
      });
      fetchMenu(hotelIdProp);
    } catch (e) {
      console.error(e);
      alert("Ürün kaydedilirken hata!");
    } finally {
      setIsUploading(false);
    }
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
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Syncing Hotel Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex font-inter text-slate-900">
      <aside className="w-80 bg-white border-r border-slate-200 p-10 flex flex-col gap-12 sticky top-0 h-screen shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
            <ChefHat size={26}/>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate tracking-tighter uppercase italic">for<span className="text-orange-600">Guest</span></h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Management Suite</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setView('orders')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${view === 'orders' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30' : 'text-slate-400 hover:bg-slate-50'}`}><ClipboardList size={18}/> Orders</button>
          <button onClick={() => setView('menu')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${view === 'menu' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30' : 'text-slate-400 hover:bg-slate-50'}`}><Package size={18}/> Inventory</button>
          <button onClick={() => setView('rooms')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${view === 'rooms' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30' : 'text-slate-400 hover:bg-slate-50'}`}><QrCode size={18}/> Terminal QR</button>
          <button onClick={() => setView('settings')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${view === 'settings' ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30' : 'text-slate-400 hover:bg-slate-50'}`}><Settings size={18}/> Configuration</button>
        </nav>
        
        <button onClick={() => onNavigate('landing', '/')} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] text-slate-400 border border-slate-100 hover:bg-slate-50 transition-all uppercase tracking-widest"><Home size={16}/> Go Public</button>
      </aside>

      <main className="flex-1 p-16 overflow-y-auto no-scrollbar">
        {view === 'orders' && (
          <div className="space-y-12 animate-fade-in">
            <h2 className="text-6xl font-black tracking-tighter">Current Orders.</h2>
            <div className="grid gap-4 max-w-5xl">
              {combinedOrders.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-32 text-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active transactions found.</p>
                </div>
              ) : combinedOrders.map((o: any) => (
                <div key={o.id} className={`bg-white p-10 rounded-[3rem] border flex items-center justify-between shadow-sm group hover:shadow-xl transition-all ${o.status === 'pending' ? 'border-orange-500' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-10">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit</span>
                      <span className="text-2xl font-black">{o.room_number}</span>
                    </div>
                    <div>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest mb-2 inline-block ${o.entryType === 'order' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{o.entryType === 'order' ? 'Gastronomy' : 'Concierge'}</span>
                      <h4 className="text-2xl font-black tracking-tight">{o.entryType === 'order' ? o.items.map((i:any)=>`${i.name} x${i.quantity}`).join(', ') : o.service_type}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="flex flex-col items-end">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(o.created_at).toLocaleTimeString()}</p>
                       {o.entryType === 'order' && <span className="text-3xl font-black">₺{o.total_amount}</span>}
                    </div>
                    <div className="flex gap-2">
                       {o.status === 'pending' ? (
                        <button onClick={() => updateStatus(o.id, o.entryType === 'order' ? 'orders' : 'service_requests', 'preparing')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 shadow-xl transition-all">Process</button>
                      ) : o.status === 'preparing' ? (
                        <button onClick={() => updateStatus(o.id, o.entryType === 'order' ? 'orders' : 'service_requests', 'delivered')} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all">Complete</button>
                      ) : <CheckCircle className="text-emerald-500" size={32}/>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div className="space-y-12 animate-fade-in">
            <div className="flex justify-between items-end">
               <h2 className="text-6xl font-black tracking-tighter">Inventory.</h2>
               <button onClick={() => { setNewItem({ name: '', description: '', price: 0, type: 'food', popular: false, is_available: true, image: '', category: 'mains' }); setIsEditingMenu(true); }} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 shadow-2xl hover:bg-orange-600 transition-all text-xs uppercase tracking-widest"><Plus size={20}/> New Product</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {menuItems.map(item => (
                 <div key={item.id} className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm group hover:shadow-2xl transition-all flex flex-col">
                    <div className="relative aspect-video bg-slate-50 overflow-hidden">
                       <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.name} />
                       <div className="absolute top-4 right-4 flex gap-2">
                          <button onClick={() => { setNewItem(item); setIsEditingMenu(true); }} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-600 hover:text-orange-600 shadow-sm transition-all"><Edit3 size={18}/></button>
                          <button onClick={async () => { if(confirm('Ürünü silmek istediğinize emin misiniz?')) { await supabase.from('menu_items').delete().eq('id', item.id); fetchMenu(hotelIdProp); } }} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-600 hover:text-rose-600 shadow-sm transition-all"><Trash2 size={18}/></button>
                       </div>
                       {item.popular && <span className="absolute top-4 left-4 bg-orange-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">Popüler</span>}
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                       <div className="flex justify-between items-start mb-4">
                          <h4 className="text-xl font-black tracking-tight">{item.name}</h4>
                          <span className="text-2xl font-black text-orange-600">₺{item.price}</span>
                       </div>
                       <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6 flex-1 line-clamp-2">{item.description}</p>
                       <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${item.type === 'food' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>{item.type}</span>
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${item.is_available ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.is_available ? 'Mevcut' : 'Tükendi'}</span>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
            {menuItems.length === 0 && (
              <div className="py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-200 text-center">
                 <Package size={48} className="text-slate-200 mx-auto mb-6" />
                 <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Menü henüz boş. İlk ürününüzü ekleyin.</p>
              </div>
            )}
          </div>
        )}

        {view === 'rooms' && (
          <div className="space-y-12 animate-fade-in">
            <div className="flex justify-between items-end">
               <h2 className="text-6xl font-black tracking-tighter">Terminal QR.</h2>
               <div className="flex gap-4">
                  <button onClick={() => setIsBulkAdding(true)} className="bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"><Layers size={20}/> Bulk Generate</button>
                  <button onClick={() => setIsAddingRoom(true)} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:bg-slate-900 transition-all text-xs uppercase tracking-widest"><Plus size={20}/> New Unit</button>
               </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
               {rooms.map(room => (
                 <div key={room.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 text-center space-y-6 hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="text-4xl font-black group-hover:text-orange-600 transition-colors">{room.room_number}</div>
                    <div className="aspect-square bg-slate-50 rounded-3xl p-4 border border-slate-50 group-hover:scale-105 transition-transform duration-500">
                       <img src={room.qr_url} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                       <button onClick={() => handleDownloadQR(room)} className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest transition-colors"><Download size={12}/> Download</button>
                       <button onClick={async () => { if(confirm('Delete room record?')) { await supabase.from('rooms').delete().eq('id', room.id); fetchRooms(hotelIdProp); } }} className="text-[10px] font-black text-slate-200 hover:text-rose-500 uppercase tracking-widest transition-colors">Terminate</button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {view === 'settings' && hotel && (
          <div className="space-y-16 animate-fade-in max-w-5xl">
             <div className="flex justify-between items-end">
                <h2 className="text-6xl font-black tracking-tighter">Configuration.</h2>
                <button onClick={saveHotelSettings} disabled={isUploading} className="bg-orange-600 text-white px-14 py-5 rounded-[2rem] font-black flex items-center gap-3 shadow-2xl hover:bg-slate-900 transition-all uppercase tracking-widest text-xs">
                   {isUploading ? <Loader2 className="animate-spin"/> : <Save size={20}/>} Apply Changes
                </button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="space-y-6">
                   <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center">Brand Identity (Logo)</p>
                        <div onClick={() => !uploadingLogo && hotelLogoRef.current?.click()} className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex items-center justify-center cursor-pointer overflow-hidden group hover:border-orange-500 transition-all p-10">
                          {uploadingLogo && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-orange-600 mb-2"/><span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Uploading</span></div>}
                          {hotel.logo_url ? <img src={hotel.logo_url} className="w-full h-full object-contain group-hover:scale-105 transition-transform" /> : <Upload className="text-slate-300"/>}
                        </div>
                        <input type="file" ref={hotelLogoRef} className="hidden" onChange={e => handleImageUpload(e, 'logo')} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center">Hero Assets (Banner)</p>
                        <div onClick={() => !uploadingBanner && hotelBannerRef.current?.click()} className="relative aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex items-center justify-center cursor-pointer overflow-hidden group hover:border-orange-500 transition-all">
                          {uploadingBanner && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-orange-600 mb-2"/><span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Uploading</span></div>}
                          {hotel.banner_url ? <img src={hotel.banner_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <Upload className="text-slate-300"/>}
                        </div>
                        <input type="file" ref={hotelBannerRef} className="hidden" onChange={e => handleImageUpload(e, 'banner')} />
                      </div>
                   </div>
                </div>
                <div className="lg:col-span-2 bg-white p-16 rounded-[4rem] border border-slate-200 space-y-12">
                   <div className="grid grid-cols-2 gap-10">
                      <div className="col-span-2 space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Corporate Name</label>
                         <input type="text" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-xl focus:outline-none focus:border-orange-500 transition-all" value={hotel.name} onChange={e => setHotel({...hotel, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Support Hotline</label>
                         <input type="text" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-xl focus:outline-none focus:border-orange-500 transition-all" value={hotel.whatsapp_number} onChange={e => setHotel({...hotel, whatsapp_number: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Departure Limit</label>
                         <input type="text" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-xl focus:outline-none focus:border-orange-500 transition-all" value={hotel.checkout_time} onChange={e => setHotel({...hotel, checkout_time: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">WiFi Identifier</label>
                         <input type="text" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-xl focus:outline-none focus:border-orange-500 transition-all" value={hotel.wifi_name} onChange={e => setHotel({...hotel, wifi_name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Network Key</label>
                         <input type="text" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-xl focus:outline-none focus:border-orange-500 transition-all" value={hotel.wifi_pass} onChange={e => setHotel({...hotel, wifi_pass: e.target.value})} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Toplu QR Sihirbazı */}
      {isBulkAdding && (
         <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-3xl flex items-center justify-center p-6">
            <div className="bg-white p-16 rounded-[4rem] w-full max-w-lg text-center shadow-3xl animate-fade-in">
               <div className="w-24 h-24 bg-orange-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-orange-900/20"><Layers size={48}/></div>
               <h3 className="text-4xl font-black tracking-tighter mb-4 uppercase">Batch Generator.</h3>
               <p className="text-slate-400 font-bold mb-10 text-xs uppercase tracking-widest">Oluşturulacak oda aralığını belirleyin.</p>
               <div className="grid grid-cols-2 gap-6 mb-12">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Unit</label>
                    <input type="number" className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] font-black text-4xl text-center focus:border-orange-500 outline-none transition-all" value={bulkRange.start} onChange={e => setBulkRange({...bulkRange, start: parseInt(e.target.value) || 1})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Unit</label>
                    <input type="number" className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] font-black text-4xl text-center focus:border-orange-500 outline-none transition-all" value={bulkRange.end} onChange={e => setBulkRange({...bulkRange, end: parseInt(e.target.value) || 10})} />
                  </div>
               </div>
               <button onClick={handleBulkAdd} disabled={isUploading} className="w-full bg-slate-900 text-white py-8 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-4">
                 {isUploading ? <Loader2 className="animate-spin"/> : 'Generate Batch'}
               </button>
               <button onClick={() => setIsBulkAdding(false)} className="mt-8 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors">Discard Plan</button>
            </div>
         </div>
      )}

      {/* Ürün Ekle/Düzenle Modalı */}
      {isEditingMenu && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-3xl flex items-center justify-center p-6">
           <div className="bg-white p-12 rounded-[4rem] w-full max-w-2xl shadow-3xl animate-fade-in overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-3xl font-black tracking-tighter uppercase">{newItem.id ? 'Edit Product' : 'New Product'}</h3>
                 <button onClick={() => setIsEditingMenu(false)} className="p-4 bg-slate-50 rounded-full hover:bg-slate-100 transition-all"><X size={24}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Product Identity</label>
                       <input type="text" placeholder="Product Name" className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:border-orange-500 font-bold" value={newItem.name || ''} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Valuation (₺)</label>
                       <input type="number" placeholder="Price" className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:border-orange-500 font-black text-2xl" value={newItem.price || 0} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Catalog Section</label>
                       <select className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:border-orange-500 font-bold appearance-none" value={newItem.category || 'mains'} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                          <option value="starters">Starters</option>
                          <option value="mains">Main Courses</option>
                          <option value="desserts">Desserts</option>
                          <option value="snacks">Snacks</option>
                          <option value="drinks">Drinks</option>
                          <option value="personal">Personal Care</option>
                       </select>
                    </div>
                    <div className="flex gap-4">
                       <button onClick={() => setNewItem({...newItem, type: 'food'})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${newItem.type === 'food' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>Food</button>
                       <button onClick={() => setNewItem({...newItem, type: 'market'})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${newItem.type === 'market' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>Market</button>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Visual Asset</label>
                       <div onClick={() => !isUploading && menuImgRef.current?.click()} className="relative aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center cursor-pointer overflow-hidden group hover:border-orange-500 transition-all">
                          {isUploading && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center"><Loader2 className="animate-spin text-orange-600"/></div>}
                          {newItem.image ? <img src={newItem.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <ImageIcon className="text-slate-300" size={32}/>}
                       </div>
                       <input type="file" ref={menuImgRef} className="hidden" onChange={e => handleImageUpload(e, 'menu')} />
                    </div>
                    <div className="flex gap-4 pt-4">
                       <button onClick={() => setNewItem({...newItem, popular: !newItem.popular})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${newItem.popular ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-400 border-slate-100'}`}>Popular</button>
                       <button onClick={() => setNewItem({...newItem, is_available: !newItem.is_available})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${newItem.is_available ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-rose-100 text-rose-600 border-rose-100'}`}>{newItem.is_available ? 'In Stock' : 'Out of Stock'}</button>
                    </div>
                 </div>
              </div>

              <div className="mt-8 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Product Narration</label>
                 <textarea placeholder="Description" className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:border-orange-500 font-medium h-32 no-scrollbar" value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} />
              </div>

              <button onClick={saveMenuItem} disabled={isUploading} className="w-full bg-slate-900 text-white py-8 rounded-[2rem] font-black text-2xl shadow-2xl hover:bg-orange-600 transition-all mt-10 active:scale-95 flex items-center justify-center gap-4">
                 {isUploading ? <Loader2 className="animate-spin"/> : <Save size={24}/>} Confirm Changes
              </button>
           </div>
        </div>
      )}

      {/* Tekli Oda Ekleme Modalı */}
      {isAddingRoom && (
         <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-3xl flex items-center justify-center p-6">
            <div className="bg-white p-12 rounded-[3.5rem] w-full max-w-sm text-center shadow-3xl animate-fade-in">
               <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-orange-200"><QrCode size={40}/></div>
               <h3 className="text-3xl font-black tracking-tighter mb-2">New Unit.</h3>
               <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-[9px]">Generate a single terminal code.</p>
               <input type="text" placeholder="ODA NO" className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] font-black text-center text-4xl mb-8 outline-none focus:border-orange-500 transition-all" value={newRoomNumber} onChange={e => setNewRoomNumber(e.target.value)} />
               <button onClick={handleAddSingleRoom} disabled={isUploading} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                 {isUploading ? <Loader2 className="animate-spin"/> : 'Confirm Unit'}
               </button>
               <button onClick={() => setIsAddingRoom(false)} className="mt-6 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors">Cancel</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default HotelPanel;
