
"use client";

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Camera, PlusCircle } from 'lucide-react';

interface ScannerProps {
  onImageCapture: (base64: string) => void;
  isAnalyzing: boolean;
}

export interface ScannerHandle {
  triggerUpload: () => void;
}

const Scanner = forwardRef<ScannerHandle, ScannerProps>(({ onImageCapture, isAnalyzing }, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    triggerUpload: () => {
      if (!isAnalyzing) {
        fileInputRef.current?.click();
      }
    }
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div 
        className="relative group cursor-pointer" 
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-sky-500/5 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
        
        <div className="relative glass rounded-[3rem] p-16 md:p-24 flex flex-col items-center justify-center border border-white/10 overflow-hidden min-h-[450px] transition-all duration-500 group-hover:border-white/20 group-hover:shadow-2xl">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
          
          <div className="flex flex-col items-center space-y-8 text-center max-w-lg">
            <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-700">
              <Camera className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl md:text-4xl font-space font-extrabold text-white tracking-tight">Sync Your Inventory</h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Provide a clear view of your fridge. Our intelligence will evaluate the landscape and offer playful guidance.
              </p>
            </div>

            <div className="pt-4">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold text-sm rounded-2xl hover:scale-[1.02] active:scale-95 transition-all">
                <PlusCircle className="w-5 h-5" /> Select Image
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Scanner.displayName = 'Scanner';

export default Scanner;
