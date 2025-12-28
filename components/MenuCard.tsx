
import React from 'react';
import { Plus } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  onView: (item: MenuItem) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, onAdd, onView }) => {
  return (
    <div className="group bg-[#0f172a] rounded-[2rem] p-3 border border-white/5 hover:border-orange-500/50 transition-all duration-500 animate-fade-in flex flex-col h-full shadow-2xl hover:shadow-orange-500/5">
      
      {/* Image Container */}
      <div 
        className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-4 cursor-pointer bg-[#1e293b]"
        onClick={() => onView(item)}
      >
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
          loading="lazy"
        />
        {item.popular && (
          <span className="absolute top-3 left-3 bg-orange-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-2xl tracking-widest uppercase border border-orange-500/20">
            POPÜLER
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="flex flex-col flex-1 px-2 pb-2">
        <h3 className="font-black text-sm text-white leading-tight mb-2 line-clamp-2 min-h-[2.5em] uppercase tracking-tight">
          {item.name}
        </h3>
        
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5">
          <span className="font-black text-orange-500 text-lg tracking-tighter">
            ₺{item.price.toFixed(0)}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-orange-500 border border-white/5 hover:bg-orange-600 hover:text-white transition-all active:scale-90 shadow-lg group-hover:border-orange-500/50"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
