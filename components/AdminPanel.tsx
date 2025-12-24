
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Hotel, Plus, Trash2, ExternalLink, Settings, X, 
  Loader2, ShieldCheck, Home, Activity, CheckCircle, Clock, ShoppingBag, Bell
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Hotel as HotelType, PanelState } from '../types';

interface AdminPanelProps {
  onNavigate: (mode: PanelState, path: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [globalFeed, setGlobalFeed] = useState<any[]>([]);
  const [editingHotel, setEditingHotel] = useState<Partial<HotelType> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [view, setView] = useState<'dashboard' | 'hotels' | 'feed'>('dashboard');

  const handleAdminLogin = () => {
    if (loginForm.user === 'admin' && loginForm.pass === 'admin123') setIsAuthenticated(true);
    else alert("Super Admin erişim yetkisi doğrulanamadı!");
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHotels();
      fetchGlobalFeed();
      
      const ordersSub = supabase.channel('global-admin')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchGlobalFeed())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => fetchGlobalFeed())
        .subscribe();

      return () => { supabase.removeChannel(ordersSub); };
    }
  }, [isAuthenticated]);

  const fetchHotels = async () => {
    const { data } = await supabase.from('hotels').select('*').order('created_at', { ascending: false });
    if (data) setHotels(data);
  };

  const fetchGlobalFeed = async () => {
    const { data: orders } = await supabase.from('orders').select('*, hotels(name)').order('created_at', { ascending: false });
    const { data: services } = await supabase.from('service_requests').select('*, hotels(name)').order('created_at', { ascending: false });
    
    const combined = [
      ...(orders || []).map(o => ({ ...o, entryType: 'order' })),
      ...(services || []).map(s => ({ ...s, entryType: 'service' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setGlobalFeed(combined);
  };

  const saveHotel = async () => {
    if (!editingHotel?.name || !editingHotel?.username) return alert("Zorunlu alanlar eksik!");
    setIsUploading(true);
    const { error } = await supabase.from('hotels').upsert(editingHotel);
    if (!error) { 
      setEditingHotel(null); 
      fetchHotels(); 
    } else {
      alert("Hata oluştu: " + error.message);
    }
    setIsUploading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-inter">
        <div className="bg-slate-900 w-full max-w-md p-12 rounded-[3.5rem] border border-white/5 text-center shadow-2xl">
          <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-orange-900/40">
            <ShieldCheck size={40} className="text-white"/>
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Master Login</h2>
          <p className="text-slate-500 font-bold mb-10 text-[10px] tracking-widest">GLOBAL ADMINISTRATION</p>
          <div className="space-y-4">
            <input type="text" placeholder="Master Username" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white outline-none focus:border-orange-500 font-bold" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            <input type="password" placeholder="Master Password" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white outline-none focus:border-orange-500 font-bold" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
            <button onClick={handleAdminLogin} className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-orange-500 transition-all shadow-xl mt-6 active:scale-95">Giriş Yap</button>
            <button onClick={() => onNavigate('landing', '/')} className="text-slate-500 font-bold text-sm mt-4 hover:text-white transition-colors">Ana Sayfaya Dön</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex font-inter">
      <aside className="w-80 bg-[#11141b] border-r border-white/5 p-10 flex flex-col gap-12 sticky top-0 h-screen">
        <h1 className="text-2xl font-black">for<span className="text-orange-500">Guest</span> Global</h1>
        <nav className="flex-1 space-y-4">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${view === 'dashboard' ? 'bg-orange-600' : 'text-slate-500 hover:bg-white/5'}`}><LayoutDashboard size={20}/> Platform Özeti</button>
          <button onClick={() => setView('feed')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${view === 'feed' ? 'bg-orange-600' : 'text-slate-500 hover:bg-white/5'}`}><Activity size={20}/> Canlı Global Akış</button>
          <button onClick={() => setView('hotels')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${view === 'hotels' ? 'bg-orange-600' : 'text-slate-500 hover:bg-white/5'}`}><Hotel size={20}/> Tesis Yönetimi</button>
        </nav>
        <button onClick={() => onNavigate('landing', '/')} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-slate-500 border border-white/5 hover:text-white transition-colors"><Home size={20}/> Ana Sayfa</button>
      </aside>

      <main className="flex-1 p-16 overflow-y-auto no-scrollbar">
        {view === 'dashboard' && (
          <div className="space-y-16 animate-fade-in">
            <h2 className="text-6xl font-black tracking-tight">Hoşgeldiniz, Master Admin</h2>
            <div className="grid grid-cols-3 gap-8">
               <div className="bg-[#11141b] p-12 rounded-[4rem] border border-white/5 group hover:border-orange-500/50 transition-all">
                  <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6"><Hotel size={24}/></div>
                  <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mb-4">Aktif Tesisler</p>
                  <p className="text-7xl font-black tracking-tighter">{hotels.length}</p>
               </div>
               <div className="bg-[#11141b] p-12 rounded-[4rem] border border-white/5 group hover:border-orange-500/50 transition-all">
                  <div className="w-12 h-12 bg-orange-600/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6"><Activity size={24}/></div>
                  <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mb-4">Toplam İşlem</p>
                  <p className="text-7xl font-black tracking-tighter">{globalFeed.length}</p>
               </div>
               <div className="bg-[#11141b] p-12 rounded-[4rem] border border-white/5 group hover:border-emerald-500/50 transition-all">
                  <div className="w-12 h-12 bg-emerald-600/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6"><CheckCircle size={24}/></div>
                  <p className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mb-4">Tamamlanan</p>
                  <p className="text-7xl font-black tracking-tighter">{globalFeed.filter(o => o.status === 'delivered' || o.status === 'completed').length}</p>
               </div>
            </div>
          </div>
        )}

        {view === 'feed' && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex justify-between items-center">
               <h2 className="text-5xl font-black tracking-tight">Canlı Global Akış</h2>
               <div className="flex gap-4">
                  <div className="bg-emerald-500/10 text-emerald-500 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> CANLI SİSTEM
                  </div>
                  <button onClick={fetchGlobalFeed} className="bg-white/5 px-6 py-2 rounded-full font-black text-[10px] hover:bg-white/10 transition-all uppercase tracking-widest border border-white/5">YENİLE</button>
               </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
               {globalFeed.length === 0 ? (
                 <div className="bg-[#11141b] rounded-[3rem] p-32 text-center border border-dashed border-white/10">
                    <Clock size={48} className="text-slate-700 mx-auto mb-6"/>
                    <p className="text-slate-500 font-bold">Henüz global bir işlem akışı bulunmuyor.</p>
                 </div>
               ) : globalFeed.map((o: any) => (
                 <div key={o.id} className="bg-[#11141b] p-10 rounded-[3rem] border border-white/5 flex items-center justify-between group hover:bg-[#161a23] transition-all">
                    <div className="flex items-center gap-10">
                       <div className="w-20 h-20 bg-white/5 rounded-[1.5rem] flex flex-col items-center justify-center border border-white/5">
                          <span className="text-[10px] font-black text-slate-500 uppercase">ODA</span>
                          <span className="text-3xl font-black">{o.room_number}</span>
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-1">
                             <span className="text-orange-500 text-[11px] font-black uppercase tracking-widest">{o.hotels?.name || 'Tesis'}</span>
                             <span className="text-slate-700 text-[10px]">•</span>
                             <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${o.entryType === 'order' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                               {o.entryType === 'order' ? <ShoppingBag size={10} className="inline mr-1"/> : <Bell size={10} className="inline mr-1"/>}
                               {o.entryType === 'order' ? 'SİPARİŞ' : 'HİZMET'}
                             </span>
                          </div>
                          <h4 className="text-2xl font-black mt-1">
                            {o.entryType === 'order' ? o.items.map((i:any)=>`${i.name} x${i.quantity}`).join(', ') : o.service_type}
                          </h4>
                          <p className="text-xs text-slate-500 mt-2 font-bold flex items-center gap-2">
                            <Clock size={12}/> {new Date(o.created_at).toLocaleString()}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-12 text-right">
                       {o.entryType === 'order' && (
                         <div>
                            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-1">TOPLAM</p>
                            <p className="text-4xl font-black text-white">₺{o.total_amount}</p>
                         </div>
                       )}
                       <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest ${o.status === 'pending' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                         {o.status === 'pending' ? 'BEKLEYEN' : o.status === 'preparing' ? 'HAZIRLANIYOR' : 'TAMAMLANDI'}
                       </span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {view === 'hotels' && (
          <div className="space-y-12 animate-fade-in">
            <div className="flex justify-between items-end">
               <div>
                 <h2 className="text-5xl font-black tracking-tight">Tesis Yönetimi</h2>
                 <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">PLATFORMDA KAYITLI TÜM OTELLER</p>
               </div>
               <button onClick={() => setEditingHotel({})} className="bg-orange-600 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-2 shadow-2xl shadow-orange-900/40 hover:scale-105 transition-all active:scale-95"><Plus size={24}/> Yeni Tesis Ekle</button>
            </div>
            <div className="grid grid-cols-1 gap-6">
               {hotels.length === 0 ? (
                 <div className="bg-[#11141b] rounded-[3rem] p-32 text-center border border-dashed border-white/10">
                    <Hotel size={48} className="text-slate-700 mx-auto mb-6"/>
                    <p className="text-slate-500 font-bold mb-8">Henüz kayıtlı bir tesis bulunmuyor.</p>
                    <button onClick={() => setEditingHotel({})} className="bg-white/10 px-8 py-4 rounded-2xl font-black">İlk Tesisi Oluştur</button>
                 </div>
               ) : hotels.map(h => (
                 <div key={h.id} className="bg-[#11141b] p-10 rounded-[4rem] border border-white/5 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                    <div className="flex items-center gap-10">
                       <div className="w-24 h-24 bg-white rounded-3xl p-4 shadow-2xl flex items-center justify-center border-4 border-white/5 overflow-hidden">
                          <img src={h.logo_url} className="w-full h-full object-contain" alt={h.name} />
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-2">
                             <h4 className="text-3xl font-black">{h.name}</h4>
                             <span className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">AKTİF</span>
                          </div>
                          <div className="flex items-center gap-6 text-slate-500 text-sm font-bold">
                             <p className="flex items-center gap-2 font-mono"><Settings size={14}/> ID: {h.id.slice(0,8)}...</p>
                             <span className="opacity-20">|</span>
                             <p className="flex items-center gap-2">@{h.username}</p>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <button onClick={() => window.open(`/otel-admin/${h.id}`, '_blank')} className="p-5 bg-white/5 rounded-3xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-xl" title="Admin Paneline Git"><ExternalLink size={24}/></button>
                       <button onClick={() => setEditingHotel(h)} className="p-5 bg-white/5 rounded-3xl text-slate-400 hover:text-orange-500 hover:bg-white/10 transition-all shadow-xl" title="Ayarlar"><Settings size={24}/></button>
                       <button onClick={async () => { if(confirm(`${h.name} tesisini ve tüm verilerini (siparişler, menü, odalar) kalıcı olarak silmek istediğinize emin misiniz?`)) { await supabase.from('hotels').delete().eq('id', h.id); fetchHotels(); } }} className="p-5 bg-white/5 rounded-3xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all shadow-xl" title="Sil"><Trash2 size={24}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </main>

      {/* Tesis Ekleme/Düzenleme Modal */}
      {editingHotel && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6">
           <div className="bg-[#11141b] p-12 rounded-[4rem] w-full max-w-xl border border-white/10 shadow-3xl animate-fade-in">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tight">{editingHotel.id ? 'Tesis Ayarlarını Düzenle' : 'Yeni Tesis Tanımla'}</h3>
                <button onClick={() => setEditingHotel(null)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"><X size={24}/></button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">GÖRÜNÜR İSİM</label>
                    <input type="text" placeholder="Örn: Grand forGuest Hotel" className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] outline-none focus:border-orange-500 transition-all font-bold text-lg" value={editingHotel.name || ''} onChange={e => setEditingHotel({...editingHotel, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">ADMİN KULLANICI ADI</label>
                       <input type="text" placeholder="username" className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] outline-none focus:border-orange-500 transition-all font-bold" value={editingHotel.username || ''} onChange={e => setEditingHotel({...editingHotel, username: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">ADMİN ŞİFRE</label>
                       <input type="text" placeholder="password" className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] outline-none focus:border-orange-500 transition-all font-bold" value={editingHotel.password || ''} onChange={e => setEditingHotel({...editingHotel, password: e.target.value})} />
                    </div>
                 </div>
                 
                 <div className="bg-orange-600/10 p-6 rounded-3xl border border-orange-500/20 space-y-2">
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">GÜVENLİK NOTU</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Bu bilgiler otel yönetiminin platforma erişimi için kullanılır. Logo ve diğer marka ayarları otel admini tarafından giriş yaptıktan sonra "Tesis Ayarları" kısmından güncellenebilir.</p>
                 </div>

                 <button 
                  onClick={saveHotel} 
                  disabled={isUploading} 
                  className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-orange-500 transition-all shadow-2xl shadow-orange-900/20 active:scale-95 flex items-center justify-center gap-3 mt-4"
                >
                  {isUploading ? <Loader2 className="animate-spin" /> : editingHotel.id ? 'Değişiklikleri Kaydet' : 'Sisteme Tesis Ekle'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
