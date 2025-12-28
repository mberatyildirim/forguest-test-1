
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Hotel, Plus, Trash2, Settings, X, 
  Loader2, ShieldCheck, Home, Activity, CheckCircle, Clock, ShoppingBag, Bell, User, FileText, CheckCircle2,
  Mail, Phone, MoreHorizontal, Globe, ExternalLink, Filter, Search, Wallet, TrendingUp, ChevronLeft, Download, Calendar, Upload, Package, BellRing, Eye, Check, Ban, Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Hotel as HotelType, PanelState, HotelApplication } from '../types';

interface AdminPanelProps {
  onNavigate: (mode: PanelState, path: string, hId?: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [globalFeed, setGlobalFeed] = useState<any[]>([]);
  const [applications, setApplications] = useState<HotelApplication[]>([]);
  const [view, setView] = useState<'dashboard' | 'hotels' | 'feed' | 'applications' | 'global-market' | 'global-services'>('dashboard');

  const [globalMarket, setGlobalMarket] = useState<any[]>([]);
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  
  // Modals for Manual Add
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [marketForm, setMarketForm] = useState({ name: '', description: '', price: '', category: '', image: '' });
  const [serviceForm, setServiceForm] = useState({ name_key: '', category: '' });

  const [filterHotel, setFilterHotel] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleAdminLogin = () => {
    if (loginForm.user === 'admin' && loginForm.pass === 'admin123') setIsAuthenticated(true);
    else alert("Erişim yetkisi doğrulanamadı!");
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHotels();
      fetchGlobalFeed();
      fetchApplications();
      fetchGlobalData();
    }
  }, [isAuthenticated]);

  const fetchHotels = async () => {
    const { data } = await supabase.from('hotels').select('*').order('created_at', { ascending: false });
    if (data) setHotels(data);
  };

  const fetchApplications = async () => {
    const { data } = await supabase.from('hotel_applications').select('*').order('created_at', { ascending: false });
    if (data) setApplications(data);
  };

  const fetchGlobalData = async () => {
    const { data: market } = await supabase.from('global_market_items').select('*');
    const { data: services } = await supabase.from('global_services').select('*');
    setGlobalMarket(market || []);
    setGlobalServices(services || []);
  };

  const fetchGlobalFeed = async () => {
    const { data: orders } = await supabase.from('orders').select('*, hotels(name)').order('created_at', { ascending: false });
    const { data: services } = await supabase.from('service_requests').select('*, hotels(name)').order('created_at', { ascending: false });
    const combined = [
      ...(orders || []).map(o => ({ ...o, feedType: 'Sipariş', amount: o.total_amount })),
      ...(services || []).map(s => ({ ...s, feedType: 'Hizmet', amount: 0 }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setGlobalFeed(combined);
  };

  const handleUpdateAppStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('hotel_applications').update({ status }).eq('id', id);
    if (!error) fetchApplications();
  };

  const handleDeleteHotel = async (id: string) => {
    if (!confirm('Bu oteli ve tüm verilerini silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('hotels').delete().eq('id', id);
    if (!error) fetchHotels();
  };

  const handleManualAddMarket = async () => {
    const { error } = await supabase.from('global_market_items').insert({
      ...marketForm,
      price: parseFloat(marketForm.price) || 0
    });
    if (!error) {
      setIsMarketModalOpen(false);
      setMarketForm({ name: '', description: '', price: '', category: '', image: '' });
      fetchGlobalData();
    }
  };

  const handleManualAddService = async () => {
    const { error } = await supabase.from('global_services').insert(serviceForm);
    if (!error) {
      setIsServiceModalOpen(false);
      setServiceForm({ name_key: '', category: '' });
      fetchGlobalData();
    }
  };

  const handleCSVImport = async (type: 'market' | 'services', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingCSV(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const dataToInsert = lines.slice(1).map(line => {
        const parts = line.split(',');
        if (type === 'market') {
          return {
            name: parts[0]?.trim(),
            description: parts[1]?.trim(),
            price: parseFloat(parts[2]?.trim()) || 0,
            category: parts[3]?.trim(),
            image: parts[4]?.trim()
          };
        } else {
          return {
            name_key: parts[0]?.trim(),
            category: parts[1]?.trim()
          };
        }
      });

      const tableName = type === 'market' ? 'global_market_items' : 'global_services';
      const { error } = await supabase.from(tableName).insert(dataToInsert);
      if (error) alert("Yükleme hatası: " + error.message);
      else {
        alert("Başarıyla içe aktarıldı!");
        fetchGlobalData();
      }
      setIsUploadingCSV(false);
    };
    reader.readAsText(file);
  };

  const filteredFeed = globalFeed.filter(item => {
    const hotelMatch = filterHotel === 'all' || item.hotel_id === filterHotel;
    const itemDate = new Date(item.created_at);
    const startMatch = !startDate || itemDate >= new Date(startDate);
    const endMatch = !endDate || itemDate <= new Date(endDate + 'T23:59:59');
    return hotelMatch && startMatch && endMatch;
  });

  const totalRevenue = filteredFeed.reduce((sum, item) => sum + (item.amount || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="bg-[#0f172a] w-full max-w-sm p-10 rounded-[2.5rem] shadow-2xl border border-white/5 text-center">
          <button onClick={() => onNavigate('landing', '/')} className="absolute top-6 left-6 text-slate-500 hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase"><ChevronLeft size={16} /> Geri</button>
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><ShieldCheck size={32} className="text-white"/></div>
          <h2 className="text-xl font-black text-white mb-6 uppercase">Master Console</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Admin ID" className="w-full bg-[#1e293b] border border-white/5 text-white rounded-xl py-3 px-4 outline-none focus:border-orange-500 font-bold" value={loginForm.user} onChange={e => setLoginForm({...loginForm, user: e.target.value})} />
            <input type="password" placeholder="Secret Key" className="w-full bg-[#1e293b] border border-white/5 text-white rounded-xl py-3 px-4 outline-none focus:border-orange-500 font-bold" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} />
            <button onClick={handleAdminLogin} className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-black text-xs uppercase shadow-lg">Giriş Yap</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex font-inter text-[13px]">
      <aside className="w-60 bg-[#0f172a] flex flex-col sticky top-0 h-screen border-r border-white/5">
        <div className="p-6 flex items-center gap-2 border-b border-white/5 bg-black/20">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-black italic shadow-lg">m</div>
          <span className="font-bold text-white tracking-tight uppercase text-xs">Master <span className="text-orange-500">Suite</span></span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${view === 'dashboard' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><LayoutDashboard size={16}/> Dashboard</button>
          <button onClick={() => setView('hotels')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${view === 'hotels' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Hotel size={16}/> Oteller</button>
          <button onClick={() => setView('global-market')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${view === 'global-market' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Package size={16}/> Global Market</button>
          <button onClick={() => setView('global-services')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${view === 'global-services' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><BellRing size={16}/> Global Hizmetler</button>
          <button onClick={() => setView('feed')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${view === 'feed' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><Activity size={16}/> Global Akış</button>
          <button onClick={() => setView('applications')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${view === 'applications' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}><FileText size={16}/> Başvurular</button>
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={() => onNavigate('landing', '/')} className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px]"><Home size={14}/> Siteye Dön</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto no-scrollbar p-8">
        <header className="h-14 bg-[#0f172a] border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-40 mb-8 rounded-2xl">
          <div className="text-slate-500 font-semibold uppercase text-[10px]">Master / <span className="text-white capitalize">{view.replace('-', ' ')}</span></div>
        </header>

        {view === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-2xl">
                <div className="flex justify-between items-start mb-4"><div className="w-10 h-10 bg-orange-600/10 text-orange-600 rounded-xl flex items-center justify-center"><Wallet size={20}/></div><TrendingUp size={16} className="text-emerald-500"/></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Toplam Gelir</p>
                <h3 className="text-2xl font-black text-white">₺{totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-2xl">
                <div className="flex justify-between items-start mb-4"><div className="w-10 h-10 bg-blue-600/10 text-blue-600 rounded-xl flex items-center justify-center"><Hotel size={20}/></div></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kayıtlı Otel</p>
                <h3 className="text-2xl font-black text-white">{hotels.length}</h3>
              </div>
              <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-2xl">
                <div className="flex justify-between items-start mb-4"><div className="w-10 h-10 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center"><ShoppingBag size={20}/></div></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Aktif Siparişler</p>
                <h3 className="text-2xl font-black text-white">{globalFeed.filter(f => f.feedType === 'Sipariş' && f.status === 'pending').length}</h3>
              </div>
              <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-2xl">
                <div className="flex justify-between items-start mb-4"><div className="w-10 h-10 bg-purple-600/10 text-purple-600 rounded-xl flex items-center justify-center"><FileText size={20}/></div></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Bekleyen Başvuru</p>
                <h3 className="text-2xl font-black text-white">{applications.filter(a => a.status === 'pending').length}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Son Otel Kayıtları</h3>
                <div className="space-y-4">
                  {hotels.slice(0, 5).map(h => (
                    <div key={h.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center font-bold text-xs uppercase">{h.name[0]}</div><div><p className="font-bold text-xs">{h.name}</p><p className="text-[9px] text-slate-500">{new Date(h.created_at || '').toLocaleDateString()}</p></div></div>
                      <ExternalLink size={14} className="text-slate-500 cursor-pointer hover:text-white"/>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Son Başvurular</h3>
                <div className="space-y-4">
                  {applications.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div><p className="font-bold text-xs">{a.hotel_name}</p><p className="text-[9px] text-slate-500">{a.email}</p></div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${a.status === 'pending' ? 'bg-orange-500/20 text-orange-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'hotels' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-black uppercase tracking-tight">Otel Yönetimi</h2><button className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"><Plus size={14}/> Yeni Otel Tanımla</button></div>
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/20 border-b border-white/5 text-slate-500 font-black uppercase tracking-widest">
                  <tr><th className="px-6 py-4">Otel Adı</th><th className="px-6 py-4">Admin Kullanıcı</th><th className="px-6 py-4">Admin Şifre</th><th className="px-6 py-4">Kayıt Tarihi</th><th className="px-6 py-4 text-right">İşlem</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {hotels.map(h => (
                    <tr key={h.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-bold text-white uppercase tracking-tight">{h.name}</td>
                      <td className="px-6 py-4 font-mono text-blue-400">{h.username}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">••••••••</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(h.created_at || '').toLocaleDateString('tr-TR')}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-3"><button className="text-slate-500 hover:text-white"><Eye size={14}/></button><button onClick={() => handleDeleteHotel(h.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'feed' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-black uppercase tracking-tight">Global Aktivite Akışı</h2><div className="flex gap-3"><select className="bg-[#1e293b] border border-white/5 rounded-xl px-4 py-2 text-xs text-white" value={filterHotel} onChange={e => setFilterHotel(e.target.value)}><option value="all">Tüm Oteller</option>{hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div></div>
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/20 border-b border-white/5 text-slate-500 font-black uppercase tracking-widest">
                  <tr><th className="px-6 py-4">Tarih/Saat</th><th className="px-6 py-4">Otel</th><th className="px-6 py-4">Oda</th><th className="px-6 py-4">Tip</th><th className="px-6 py-4">Tutar</th><th className="px-6 py-4 text-right">Durum</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredFeed.map(f => (
                    <tr key={f.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 text-slate-500 font-mono">{new Date(f.created_at).toLocaleString('tr-TR', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' })}</td>
                      <td className="px-6 py-4 font-bold text-white uppercase">{f.hotels?.name}</td>
                      <td className="px-6 py-4 font-black">ODA {f.room_number}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded font-black text-[8px] uppercase ${f.feedType === 'Sipariş' ? 'bg-blue-600/20 text-blue-500' : 'bg-purple-600/20 text-purple-500'}`}>{f.feedType}</span></td>
                      <td className="px-6 py-4 font-black">{f.amount > 0 ? `₺${f.amount}` : '-'}</td>
                      <td className="px-6 py-4 text-right"><span className="text-orange-500 font-black uppercase text-[10px]">{f.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'applications' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black uppercase tracking-tight">Yeni Tesis Başvuruları</h2>
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/20 border-b border-white/5 text-slate-500 font-black uppercase tracking-widest">
                  <tr><th className="px-6 py-4">Tesis Adı</th><th className="px-6 py-4">Yetkili / İletişim</th><th className="px-6 py-4">E-Posta</th><th className="px-6 py-4">Tarih</th><th className="px-6 py-4">Durum</th><th className="px-6 py-4 text-right">Aksiyon</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {applications.map(a => (
                    <tr key={a.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-black text-white uppercase">{a.hotel_name}</td>
                      <td className="px-6 py-4"><div><p className="font-bold">{a.contact_name}</p><p className="text-slate-500">{a.phone}</p></div></td>
                      <td className="px-6 py-4 text-blue-400">{a.email}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${a.status === 'pending' ? 'bg-orange-500/20 text-orange-500' : a.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20 text-slate-400'}`}>{a.status}</span></td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => handleUpdateAppStatus(a.id, 'approved')} className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all"><Check size={14}/></button>
                            <button onClick={() => handleUpdateAppStatus(a.id, 'rejected')} className="w-8 h-8 rounded-lg bg-rose-600/10 text-rose-500 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"><Ban size={14}/></button>
                          </>
                        )}
                        <button className="w-8 h-8 rounded-lg bg-white/5 text-slate-400 flex items-center justify-center hover:text-white"><Eye size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'global-market' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Global Market Kataloğu</h2>
                <div className="mt-2 flex items-center gap-2 bg-blue-900/20 border border-blue-800/30 px-3 py-2 rounded-lg text-[10px] text-blue-400 font-bold uppercase">
                  <Info size={14}/> 
                  CSV Formatı: <span className="text-white font-mono lowercase">name,description,price,category,image</span>
                </div>
              </div>
              <div className="flex gap-3">
                <label className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black cursor-pointer hover:bg-orange-600 hover:text-white transition-all flex items-center gap-2 shadow-lg">
                  <Upload size={14} /> CSV YÜKLE
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => handleCSVImport('market', e)} />
                </label>
                <button onClick={() => setIsMarketModalOpen(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"><Plus size={14}/> Manuel Ekle</button>
              </div>
            </div>
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/20 border-b border-white/5 text-slate-500 font-black uppercase tracking-widest">
                  <tr><th className="px-6 py-4">Ürün</th><th className="px-6 py-4">Fiyat</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4 text-right">Aksiyon</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {globalMarket.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 flex items-center gap-3 font-bold text-white"><img src={item.image} className="w-8 h-8 rounded-lg object-cover" /> {item.name}</td>
                      <td className="px-6 py-4 font-black">₺{item.price}</td>
                      <td className="px-6 py-4 uppercase font-bold text-orange-500">{item.category}</td>
                      <td className="px-6 py-4 text-right"><button onClick={async () => { await supabase.from('global_market_items').delete().eq('id', item.id); fetchGlobalData(); }} className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'global-services' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Global Hizmet Tanımları</h2>
                <div className="mt-2 flex items-center gap-2 bg-blue-900/20 border border-blue-800/30 px-3 py-2 rounded-lg text-[10px] text-blue-400 font-bold uppercase">
                  <Info size={14}/> 
                  CSV Formatı: <span className="text-white font-mono lowercase">name_key,category</span>
                </div>
              </div>
              <div className="flex gap-3">
                <label className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black cursor-pointer hover:bg-orange-600 hover:text-white transition-all flex items-center gap-2 shadow-lg">
                  <Upload size={14} /> CSV YÜKLE
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => handleCSVImport('services', e)} />
                </label>
                <button onClick={() => setIsServiceModalOpen(true)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg"><Plus size={14}/> Manuel Ekle</button>
              </div>
            </div>
            <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/20 border-b border-white/5 text-slate-500 font-black uppercase tracking-widest">
                  <tr><th className="px-6 py-4">Hizmet Anahtarı</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4 text-right">Aksiyon</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {globalServices.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-black text-white">{item.name_key}</td>
                      <td className="px-6 py-4 uppercase font-bold text-blue-500">{item.category}</td>
                      <td className="px-6 py-4 text-right"><button onClick={async () => { await supabase.from('global_services').delete().eq('id', item.id); fetchGlobalData(); }} className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Manual Market Modal */}
      {isMarketModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] p-10 border border-white/10 shadow-3xl animate-fade-in">
            <h3 className="text-xl font-black text-white mb-8 uppercase italic tracking-tight">Yeni Market Ürünü</h3>
            <div className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Ürün Adı</label><input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-xl" value={marketForm.name} onChange={e => setMarketForm({...marketForm, name: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Açıklama</label><input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-xl" value={marketForm.description} onChange={e => setMarketForm({...marketForm, description: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Fiyat (₺)</label><input type="number" className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-xl" value={marketForm.price} onChange={e => setMarketForm({...marketForm, price: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Kategori</label><input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-xl" value={marketForm.category} onChange={e => setMarketForm({...marketForm, category: e.target.value})} /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Görsel URL</label><input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-xl" value={marketForm.image} onChange={e => setMarketForm({...marketForm, image: e.target.value})} /></div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsMarketModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px]">İptal</button>
                <button onClick={handleManualAddMarket} className="flex-1 py-4 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase shadow-2xl">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] p-10 border border-white/10 shadow-3xl animate-fade-in">
            <h3 className="text-xl font-black text-white mb-8 uppercase italic tracking-tight">Yeni Global Hizmet</h3>
            <div className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Hizmet Anahtarı (name_key)</label><input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-xl" placeholder="örn: towel, pillow, clean" value={serviceForm.name_key} onChange={e => setServiceForm({...serviceForm, name_key: e.target.value})} /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-2">Kategori</label><input className="w-full p-4 bg-[#1e293b] border border-white/5 text-white rounded-xl" placeholder="örn: housekeeping, tech" value={serviceForm.category} onChange={e => setServiceForm({...serviceForm, category: e.target.value})} /></div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsServiceModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px]">İptal</button>
                <button onClick={handleManualAddService} className="flex-1 py-4 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase shadow-2xl">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
