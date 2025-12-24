
import React from 'react';
import { 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Globe,
  Utensils,
  BellRing,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { PanelState } from '../types';

interface LandingPageProps {
  onNavigate: (mode: PanelState, path: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-inter selection:bg-orange-200 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing', '/')}>
          <span className="font-bold text-2xl tracking-tight uppercase italic">for<span className="text-orange-600">Guest</span></span>
        </div>
        <div className="hidden md:flex gap-8 items-center text-xs font-bold uppercase tracking-widest text-slate-500">
          <a href="#features" className="hover:text-orange-600 transition-colors">Özellikler</a>
          <a href="#about" className="hover:text-orange-600 transition-colors">Tesisler</a>
          <a href="#contact" className="hover:text-orange-600 transition-colors">İletişim</a>
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

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-orange-600 text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-2xl shadow-orange-200 active:scale-95">
                Ücretsiz Dene
              </button>
              <button className="bg-white text-slate-900 border border-slate-200 px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                Demoyu İzle <ArrowRight size={18} />
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
                className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" 
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

      {/* Minimal Footer */}
      <footer className="py-20 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-2">
              <span className="font-bold text-3xl tracking-tight uppercase italic">for<span className="text-orange-600">Guest</span></span>
           </div>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">© 2025 forGuest Global. Tüm hakları saklıdır.</p>
           <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
