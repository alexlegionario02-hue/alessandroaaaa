import React from 'react';
import { CardData } from '../types';
import { Trash2, TrendingUp } from 'lucide-react';

interface CardHistoryProps {
  cards: CardData[];
  totalValue: number;
  onClear: () => void;
}

export const CardHistory: React.FC<CardHistoryProps> = ({ cards, totalValue, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white rounded-t-3xl overflow-hidden shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      {/* Header / Total */}
      <div className="bg-neutral-800 p-6 border-b border-neutral-700 flex justify-between items-center z-10 sticky top-0">
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Total Value</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-500 w-6 h-6" />
            <span className="text-3xl font-bold text-white">${totalValue.toFixed(2)}</span>
          </div>
        </div>
        {cards.length > 0 && (
          <button 
            onClick={onClear}
            className="p-2 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-24">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center">
            <p>No cards scanned yet.</p>
            <p className="text-xs mt-1">Point your camera at a card!</p>
          </div>
        ) : (
          cards.slice().reverse().map((card) => (
            <div key={card.id} className="flex items-center gap-4 bg-neutral-800/50 p-3 rounded-xl border border-neutral-700 animate-fade-in">
              <div className="w-16 h-20 bg-gray-700 rounded-lg overflow-hidden shrink-0 relative">
                 {card.imageUrl ? (
                    <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No img</div>
                 )}
                 <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-bold px-1 rounded-bl">
                   1
                 </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate text-lg">{card.name}</h3>
                <p className="text-xs text-gray-400 truncate">{card.set} • #{card.number}</p>
              </div>

              <div className="text-right">
                <span className="text-xl font-bold text-green-400 font-mono block">
                  ${card.estimatedPrice.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};