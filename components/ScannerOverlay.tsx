import React from 'react';
import { CardData } from '../types';
import { Plus } from 'lucide-react';

interface ScannerOverlayProps {
  detectedCard: CardData | null;
  isScanning: boolean;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ detectedCard, isScanning }) => {
  if (!detectedCard) return null;

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-auto pointer-events-none z-20">
      <div className="animate-bounce-in bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-white drop-shadow-md leading-tight">
          {detectedCard.name}
        </h2>
        <p className="text-xs text-gray-200 mb-2">
          {detectedCard.set} #{detectedCard.number}
        </p>
        
        <div className="text-4xl font-black text-green-400 drop-shadow-lg my-1 font-mono">
          ${detectedCard.estimatedPrice.toFixed(2)}
        </div>
      </div>
    </div>
  );
};