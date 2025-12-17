
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
    <div className="group bg-white rounded-2xl p-2.5 border border-slate-200 hover:border-orange-300 transition-all duration-300 animate-fade-in flex flex-col h-full shadow-md hover:shadow-xl">
      
      {/* Image Container */}
      <div 
        className="relative aspect-square rounded-xl overflow-hidden mb-3 cursor-pointer bg-slate-100"
        onClick={() => onView(item)}
      >
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        {item.popular && (
          <span className="absolute top-2 left-2 bg-orange-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg tracking-wide uppercase">
            POPÜLER
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="flex flex-col flex-1 px-1">
        <h3 className="font-bold text-sm text-slate-900 leading-tight mb-2 line-clamp-2 min-h-[2.5em]">
          {item.name}
        </h3>
        
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-black text-orange-600 text-base tracking-tight">
            ₺{item.price.toFixed(0)}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200 hover:shadow-orange-400 transition-all active:scale-90"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
