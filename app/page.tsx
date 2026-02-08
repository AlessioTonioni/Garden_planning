'use client';

import { useState } from 'react';
import MapWrapper from '@/components/Map/MapWrapper';
import Navigation from '@/components/Navigation';
import SeedbedView from '@/components/Seedbed/SeedbedView';

export default function Home() {
    const [activeView, setActiveView] = useState<'planner' | 'seedbed' | 'setup'>('planner');

    return (
        <main className="w-full h-full relative overflow-hidden bg-slate-50">
            <Navigation activeView={activeView} onViewChange={setActiveView} />

            <div className="w-full h-full transition-all duration-700 ease-in-out">
                {activeView === 'planner' ? (
                    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                        <MapWrapper initialView="schematic" />
                    </div>
                ) : activeView === 'seedbed' ? (
                    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-y-auto pt-24">
                        <SeedbedView />
                    </div>
                ) : (
                    <div className="w-full h-full animate-in fade-in duration-500">
                        <MapWrapper initialView="map" />
                    </div>
                )}
            </div>
        </main>
    );
}
