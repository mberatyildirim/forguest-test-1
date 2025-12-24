
import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight,
  Globe,
  Utensils,
  BellRing,
  ShieldCheck,
  Smartphone,
  X,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { PanelState } from '../types';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onNavigate: (mode: PanelState, path: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<'privacy' | 'terms' | 'contact' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [form, setForm] = useState({
    hotel_name: '',
    contact_name: '',
    email: '',
    phone: ''
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('hotel_applications').insert([form]);
      if (error) throw error;
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsApplyModalOpen(false);
        setForm({ hotel_name: '', contact_name: '', email: '', phone: '' });
      }, 3000);
    } catch (err) {
      alert("Başvuru sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-inter selection:bg-orange-200 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing', '/')}>
          <span className="font-bold text-2xl tracking-tight uppercase italic">for<span className="text-orange-600">Guest</span></span>
        </div>
        <div className="hidden md:flex gap-8 items-center text-xs font-bold uppercase tracking-widest text-slate-500">
          <button onClick={() => scrollToSection('features')} className="hover:text-orange-600 transition-colors">Özellikler</button>
          <button onClick={() => scrollToSection('stats')} className="hover:text-orange-600 transition-colors">Tesisler</button>
          <button onClick={() => setIsLegalModalOpen('contact')} className="hover:text-orange-600 transition-colors">İletişim</button>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('hotel_login', '/otel-login')}
            className="px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-all border border-slate-200"
          >
            Otel Girişi
          </button>
          <button 
            onClick={() => onNavigate('admin_dashboard', '/super-admin')}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-orange-600 transition-all shadow-xl active:scale-95"
          >
            Master Admin
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase text-orange-600 border border-orange-200">
              <Sparkles size={14} /> Yeni Nesil Misafir Deneyimi
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-900">
              Tesisinizi <span className="text-orange-600">Dijitalle</span> <br/>
              Yeniden Tanımlayın.
            </h1>
            
            <p className="max-w-lg text-lg text-slate-500 font-medium leading-relaxed">
              Misafirleriniz uygulama indirmek zorunda kalmadan, sadece QR kodu okutarak tüm oda servislerine, concierge hizmetlerine ve AI asistanınıza anında erişsin.
            </p>

            <div className="flex flex-col sm:row gap-4">
              <button 
                onClick={() => setIsApplyModalOpen(true)}
                className="bg-orange-600 text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-2xl shadow-orange-200 active:scale-95 flex items-center justify-center gap-3"
              >
                Hemen Otelini Başvur <ArrowRight size={18} />
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
               <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" alt="User" />
                 ))}
               </div>
               <p className="text-xs font-bold text-slate-400">
                 <span className="text-slate-900">500+</span> konaklama tesisi bizi tercih ediyor.
               </p>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-4 bg-orange-600/10 rounded-[3rem] blur-3xl group-hover:bg-orange-600/20 transition-all"></div>
            <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-3xl border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                alt="Premium Hotel Room"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-10">
                 <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 w-full text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Aktif Tesis</p>
                    <p className="text-xl font-bold italic">"forGuest ile sipariş hızımız %40 arttı."</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-white px-6" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
             <p className="text-orange-600 font-black text-[10px] uppercase tracking-[0.4em]">Neler Sunuyoruz?</p>
             <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Operasyonel Kusursuzluk</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { icon: <Utensils className="text-orange-600" />, title: "In-Room Dining", desc: "Digital menü ile saniyeler içinde odaya yemek siparişi." },
               { icon: <BellRing className="text-blue-600" />, title: "Concierge Services", desc: "Havludan taksiye, tüm talepler tek bir dokunuşla ekranda." },
               { icon: <Smartphone className="text-emerald-600" />, title: "Zero App Needed", desc: "İndirme yok, kayıt yok. Sadece tara ve kullanmaya başla." },
               { icon: <ShieldCheck className="text-indigo-600" />, title: "Master Admin", desc: "Tüm tesisleri tek bir merkezden izleyin ve yönetin." },
               { icon: <Globe className="text-rose-600" />, title: "Multilingual", desc: "Global misafirleriniz için 50+ dilde otomatik çeviri." },
               { icon: <Sparkles className="text-amber-600" />, title: "AI Assistant", desc: "Gemini destekli asistan ile 7/24 misafir desteği." }
             ].map((feature, i) => (
               <div key={i} className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-orange-200 transition-all group">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">{feature.icon}</div>
                  <h4 className="text-xl font-bold mb-4">{feature.title}</h4>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          <div>
            <p className="text-4xl font-black text-orange-600 mb-2">500+</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aktif Tesis</p>
          </div>
          <div>
            <p className="text-4xl font-black text-orange-600 mb-2">1M+</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aylık İşlem</p>
          </div>
          <div>
            <p className="text-4xl font-black text-orange-600 mb-2">98%</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Memnuniyet</p>
          </div>
          <div>
            <p className="text-4xl font-black text-orange-600 mb-2">24/7</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Destek</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-2">
              <span className="font-bold text-3xl tracking-tight uppercase italic">for<span className="text-orange-600">Guest</span></span>
           </div>
           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">© 2025 forGuest Global. Tüm hakları saklıdır.</p>
           <div className="flex gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <button onClick={() => setIsLegalModalOpen('privacy')} className="hover:text-white transition-colors">Privacy</button>
              <button onClick={() => setIsLegalModalOpen('terms')} className="hover:text-white transition-colors">Terms</button>
              <button onClick={() => setIsLegalModalOpen('contact')} className="hover:text-white transition-colors">Contact</button>
           </div>
        </div>
      </footer>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 relative shadow-3xl animate-fade-in">
            <button onClick={() => setIsApplyModalOpen(false)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X size={20}/></button>
            
            {isSuccess ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-3xl font-black mb-4">Başvurunuz Alındı!</h3>
                <p className="text-slate-500 font-medium">Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <h3 className="text-3xl font-black tracking-tighter">Otelini Kaydet.</h3>
                  <p className="text-slate-500 font-medium mt-2">forGuest dünyasına katılmak için formu doldurun.</p>
                </div>
                <form onSubmit={handleApply} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Otel Adı</label>
                      <input required type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 font-bold" value={form.hotel_name} onChange={e => setForm({...form, hotel_name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Yetkili Kişi</label>
                      <input required type="text" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 font-bold" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-Posta</label>
                    <input required type="email" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 font-bold" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefon</label>
                    <input required type="tel" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-500 font-bold" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl mt-6 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Başvuruyu Gönder'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info Modals */}
      {isLegalModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 relative shadow-3xl animate-fade-in overflow-y-auto max-h-[80vh]">
            <button onClick={() => setIsLegalModalOpen(null)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X size={20}/></button>
            
            {isLegalModalOpen === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-black">Gizlilik Politikası</h3>
                <div className="text-slate-600 font-medium leading-relaxed space-y-4">
                  <p>forGuest platformu olarak misafirlerimizin ve otel partnerlerimizin verilerini korumak en öncelikli görevimizdir.</p>
                  <p>Topladığımız veriler sadece hizmet kalitesini artırmak ve operasyonel verimlilik sağlamak amacıyla kullanılmaktadır.</p>
                  <p>Verileriniz KVKK standartlarına uygun olarak şifrelenmiş sunucularımızda saklanmaktadır.</p>
                </div>
              </div>
            )}
            
            {isLegalModalOpen === 'terms' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-black">Kullanım Koşulları</h3>
                <div className="text-slate-600 font-medium leading-relaxed space-y-4">
                  <p>forGuest platformunu kullanarak, platformun sunduğu dijital oda servisi ve concierge hizmetlerini yasal çerçeveler dahilinde kullanmayı kabul etmiş sayılırsınız.</p>
                  <p>Tesis sahipleri, sisteme girilen menü ve içeriklerin doğruluğundan sorumludur.</p>
                </div>
              </div>
            )}

            {isLegalModalOpen === 'contact' && (
              <div className="space-y-10">
                <h3 className="text-3xl font-black">Bize Ulaşın</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center"><Phone size={28}/></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destek Hattı</p><p className="font-black text-xl">+90 (212) 555 00 00</p></div>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><Mail size={28}/></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">E-Posta</p><p className="font-black text-xl">hello@forguest.net</p></div>
                  </div>
                  <div className="col-span-1 md:col-span-2 bg-slate-900 text-white p-10 rounded-[2.5rem] flex items-center gap-8">
                    <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center"><Building size={32}/></div>
                    <div>
                      <h4 className="text-2xl font-black mb-2">Merkez Ofis</h4>
                      <p className="text-slate-400 font-medium">Levent Plaza, No: 42, Kat: 12<br/>Beşiktaş / İstanbul</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
