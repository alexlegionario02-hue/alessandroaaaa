import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Zap, X, Image as ImageIcon, ScanLine } from 'lucide-react';
import { identifyCard } from './services/geminiService';
import { CardData } from './types';
import { ScannerOverlay } from './components/ScannerOverlay';
import { CardHistory } from './components/CardHistory';

const AUTO_SCAN_INTERVAL_MS = 2500; // Scan every 2.5 seconds

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // App State
  const [isScanning, setIsScanning] = useState(false); // Toggle for auto-scan
  const [isProcessing, setIsProcessing] = useState(false); // API request in flight
  const [scannedCards, setScannedCards] = useState<CardData[]>([]);
  const [detectedCard, setDetectedCard] = useState<CardData | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Derived State
  const totalValue = scannedCards.reduce((acc, card) => acc + card.estimatedPrice, 0);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Camera permission denied or not available.");
      }
    };

    startCamera();

    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture frame function
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get base64 (remove prefix for API)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return dataUrl;
  }, []);

  // Handle Detection Logic
  const processFrame = useCallback(async () => {
    if (isProcessing) return; // Don't overlap requests
    
    const imageBase64Full = captureFrame();
    if (!imageBase64Full) return;
    
    setIsProcessing(true);
    
    // Split for API (remove data:image/jpeg;base64,)
    const base64Data = imageBase64Full.split(',')[1];

    try {
      const result = await identifyCard(base64Data);
      
      if (result.found && result.data) {
        const newCard = { ...result.data, imageUrl: imageBase64Full };
        setDetectedCard(newCard);
        
        // Add to history automatically (or could require a tap to confirm)
        // Here we do a simple check to prevent duplicates in rapid succession if it's the same card
        setScannedCards(prev => {
          const lastCard = prev[prev.length - 1];
          // Simple debounce: don't add if it's the exact same name and we scanned it < 5 seconds ago
          // For this demo, just add it if name is different or list is empty
          if (!lastCard || lastCard.name !== newCard.name) {
             return [...prev, newCard];
          }
          return prev;
        });

        // Clear detected overlay after 2 seconds
        setTimeout(() => setDetectedCard(null), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, captureFrame]);

  // Auto-scan Interval
  useEffect(() => {
    let intervalId: number | undefined;

    if (isScanning && isStreaming) {
      intervalId = window.setInterval(() => {
        processFrame();
      }, AUTO_SCAN_INTERVAL_MS);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning, isStreaming, processFrame]);


  if (error) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white p-4 text-center">
        <div>
          <Camera className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold mb-2">Camera Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-sans">
      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Viewport */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay UI Layer */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10 safe-area-padding">
        
        {/* Top Bar */}
        <div className="p-4 flex justify-between items-start pt-12 pointer-events-auto bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
             <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
             <span className="text-white font-bold tracking-wide text-sm drop-shadow-md">
               {isScanning ? 'SCANNING...' : 'PAUSED'}
             </span>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={() => setScannedCards([])}
               className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80 hover:bg-black/60 transition"
             >
                <X size={20} />
             </button>
          </div>
        </div>

        {/* Center Scanner Area - Visual Guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* The Box */}
            <div className={`w-72 h-96 border-2 rounded-3xl transition-all duration-300 relative ${isScanning ? 'border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.3)]' : 'border-white/30'}`}>
                {/* Corner Markers */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white -mt-1 -ml-1 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white -mt-1 -mr-1 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white -mb-1 -ml-1 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white -mb-1 -mr-1 rounded-br-xl" />

                {/* Scanning Laser Line */}
                {isScanning && !detectedCard && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-scan-line opacity-80" />
                )}

                {/* Processing Spinner */}
                {isProcessing && !detectedCard && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                  </div>
                )}
                
                {/* Visual Overlay Result */}
                <ScannerOverlay detectedCard={detectedCard} isScanning={isScanning} />
            </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-6 pointer-events-auto bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-10">
          
          <div className="flex items-center justify-between mb-4">
             {/* Total Pill */}
             <div 
               onClick={() => setShowHistory(true)}
               className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
             >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-black">
                  <span className="font-bold text-lg">{scannedCards.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-300 uppercase tracking-wider">Total</span>
                  <span className="text-xl font-bold text-white">${totalValue.toFixed(2)}</span>
                </div>
             </div>

             {/* Toggle Scan Button */}
             <button 
                onClick={() => setIsScanning(!isScanning)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-90 ${isScanning ? 'bg-red-500 hover:bg-red-600' : 'bg-white hover:bg-gray-100'}`}
             >
                {isScanning ? (
                  <div className="w-6 h-6 bg-white rounded-sm" /> // Stop Icon
                ) : (
                  <ScanLine size={32} className="text-black" /> // Scan Icon
                )}
             </button>
          </div>
          
          <p className="text-center text-white/50 text-xs font-medium">
             {isScanning ? 'Point camera at card to scan' : 'Tap button to start scanning'}
          </p>

        </div>
      </div>

      {/* History Sheet / Drawer */}
      <div 
        className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out transform ${showHistory ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowHistory(false)}
        />
        <div className="absolute bottom-0 left-0 right-0 h-[85vh] transform transition-transform duration-300">
           {/* Handle Bar */}
           <div 
             className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/50 rounded-full mb-2 cursor-pointer"
             onClick={() => setShowHistory(false)}
           />
           <CardHistory 
             cards={scannedCards} 
             totalValue={totalValue} 
             onClear={() => setScannedCards([])}
           />
           
           {/* Close Button within Sheet context (Mobile friendly) */}
           <button 
             onClick={() => setShowHistory(false)}
             className="absolute top-4 right-4 z-20 p-2 bg-neutral-700/50 rounded-full text-white/70"
           >
             <X size={20} />
           </button>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
        @keyframes bounce-in {
            0% { transform: scale(0.5); opacity: 0; }
            60% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); }
        }
        .animate-bounce-in {
            animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .safe-area-padding {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default App;