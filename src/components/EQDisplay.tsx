import React from 'react';
import { EQBand } from '../types';
import { Sliders, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface EQDisplayProps {
  bands: EQBand[];
  analysis: string;
}

export const EQDisplay: React.FC<EQDisplayProps> = ({ bands, analysis }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = bands
      .map(b => `${b.frequency}Hz: ${b.gain > 0 ? '+' : ''}${b.gain}dB (Q: ${b.q})`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="hardware-card p-6 border-l-4 border-[#FF4444]">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4 text-[#FF4444]" />
          <h3 className="mono-text text-xs uppercase tracking-widest">AI Mastering Analysis</h3>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed italic">
          "{analysis}"
        </p>
      </div>

      <div className="hardware-card p-6">
        <div className="flex justify-between items-center mb-8">
          <h3 className="mono-text text-xs uppercase tracking-widest text-[#8E9299]">Parametric EQ Bands</h3>
          <button 
            id="copy-eq-button"
            onClick={copyToClipboard}
            className="flex items-center gap-2 text-[10px] mono-text uppercase bg-[#2a2d33] hover:bg-[#32363d] px-3 py-1.5 rounded transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy Config'}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
          {bands.map((band, idx) => (
            <div key={idx} className="flex flex-col items-center gap-4">
              <div className="h-32 w-1 bg-[#1a1c20] rounded-full relative flex flex-col justify-end">
                {/* Visual indicator for the slider track */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-4 bg-[#FF4444] rounded-sm shadow-[0_0_10px_rgba(255,68,68,0.3)] transition-all duration-300"
                  style={{ 
                    height: '8px', 
                    bottom: `${((band.gain + 12) / 24) * 100}%` 
                  }}
                />
              </div>
              <div className="text-center">
                <div className="mono-text text-[10px] text-[#8E9299] mb-1">{band.frequency}{band.frequency >= 1000 ? 'Hz' : 'Hz'}</div>
                <div className="mono-text text-xs font-bold text-white">
                  {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)}
                  <span className="text-[10px] opacity-40 ml-0.5">dB</span>
                </div>
                <div className="text-[9px] mono-text opacity-40 mt-1 uppercase">Q {band.q}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
