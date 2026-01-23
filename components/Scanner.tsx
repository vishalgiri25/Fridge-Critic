
import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Camera, Upload, ScanLine } from 'lucide-react';

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
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative group cursor-pointer" onClick={() => !isAnalyzing && fileInputRef.current?.click()}>
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-magenta-500 to-lime-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative glass rounded-3xl p-12 flex flex-col items-center justify-center border border-white/10 overflow-hidden min-h-[400px]">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
          
          <div className="flex flex-col items-center space-y-6 text-center z-20">
            <div className="p-6 bg-white/5 rounded-full border border-white/10 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-500">
              <Camera className="w-16 h-16 text-cyan-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-3xl font-black font-orbitron tracking-tight text-white">OPEN YOUR FRIDGE</h3>
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                Capture the chaos. Let the AI judge your nutritional sins and rescue your leftovers.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold text-gray-300">
                <ScanLine className="w-4 h-4 text-lime-400" /> REAL-TIME VISION
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold text-gray-300">
                <Upload className="w-4 h-4 text-cyan-400" /> JPEG / PNG
              </div>
            </div>
          </div>

          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Scanner;
