/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { FrequencyChart } from './components/FrequencyChart';
import { EQDisplay } from './components/EQDisplay';
import { IEM, FrequencyResponsePoint, EQBand } from './types';
import { fetchIEMData, fetchAllIemModels } from './services/iemService';
import { generateEQForSong } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Headphones, Sparkles, AudioLines } from 'lucide-react';

export default function App() {
  const [selectedIem, setSelectedIem] = useState<IEM | null>(null);
  const [allIems, setAllIems] = useState<IEM[]>([]);
  const [ytmUrl, setYtmUrl] = useState('');
  const [chartData, setChartData] = useState<FrequencyResponsePoint[]>([]);
  const [eqProfile, setEqProfile] = useState<{ bands: EQBand[]; analysis: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Load all IEM models on mount
  useEffect(() => {
    fetchAllIemModels().then(setAllIems);
  }, []);

  // Load IEM characteristic data when selected
  useEffect(() => {
    if (selectedIem) {
      const loadData = async () => {
        setIsDataLoading(true);
        const data = await fetchIEMData(selectedIem);
        setChartData(data);
        setIsDataLoading(false);
        // Reset EQ if new IEM is picked
        setEqProfile(null);
      };
      loadData();
    }
  }, [selectedIem]);

  const onSelectIem = (iem: IEM) => {
    setSelectedIem(iem);
  };

  const handleTune = async () => {
    if (!selectedIem || !ytmUrl) return;

    setIsLoading(true);
    try {
      const dataSample = chartData
        .filter((_, i) => i % 20 === 0)
        .map(p => `${p.frequency}:${p.raw.toFixed(1)}`)
        .join(",");

      const result = await generateEQForSong(ytmUrl, selectedIem.name, dataSample);
      
      setEqProfile(result);

      // Simple visualization: modify chartData to show "Equalized" response
      setChartData(prev => prev.map(point => {
        if (!result.bands || result.bands.length === 0) return point;

        // Apply a simplified Gaussian influence for each band
        let totalEffect = 0;
        result.bands.forEach(band => {
          const distance = Math.abs(Math.log10(point.frequency / band.frequency));
          // Q factor also affects the width (higher Q = narrower)
          const qFactor = band.q || 1.4;
          const influence = Math.exp(-Math.pow(distance * qFactor * 2, 2));
          totalEffect += band.gain * influence;
        });

        return {
          ...point,
          equalized: point.raw + totalEffect
        };
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#E6E6E6] font-sans text-gray-900">
      <Sidebar
        selectedIem={selectedIem}
        onSelectIem={onSelectIem}
        ytmUrl={ytmUrl}
        onYtmUrlChange={setYtmUrl}
        onTune={handleTune}
        isLoading={isLoading}
        iems={allIems}
      />

      <main className="flex-1 overflow-y-auto p-12">
        <AnimatePresence mode="wait">
          {!selectedIem ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto"
            >
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8">
                <Headphones className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Ready for high-fidelity?</h2>
              <p className="text-gray-500 leading-relaxed">
                Select your IEM from the sidebar and provide a YouTube Music link. 
                Our AI will analyze your track's vibe and engineer a custom EQ profile specifically for your hardware.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-5xl mx-auto space-y-12"
            >
              <header className="flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8E9299] mb-2">
                    <AudioLines className="w-4 h-4" /> Selected Profile
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">{selectedIem.name}</h2>
                  <p className="text-gray-500">{selectedIem.manufacturer} • In-Ear Monitor</p>
                </div>
                {eqProfile && (
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                    <Sparkles className="w-4 h-4 text-orange-500 fill-current" />
                    <span className="text-sm font-semibold">Vibe Tuned for Track</span>
                  </div>
                )}
              </header>

              {isDataLoading ? (
                <div className="h-[400px] flex items-center justify-center flex-col gap-4">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                  <p className="text-xs mono-text text-gray-500 uppercase tracking-widest">Fetching Frequency Data...</p>
                </div>
              ) : (
                <FrequencyChart data={chartData} iemName={selectedIem.name} />
              )}

              {eqProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <EQDisplay bands={eqProfile.bands} analysis={eqProfile.analysis} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
