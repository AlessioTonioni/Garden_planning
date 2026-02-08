'use client';

import React from 'react';
import { Map as MapIcon, Sprout, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this utility exists or I'll create it

import BackupControls from './Map/BackupControls';

interface NavigationProps {
    activeView: 'planner' | 'seedbed' | 'setup';
    onViewChange: (view: 'planner' | 'seedbed' | 'setup') => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-[101] px-6 py-4 flex items-center justify-between pointer-events-none">
            {/* Branding - Far Left */}
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl px-4 py-2 pointer-events-auto transition-all hover:scale-[1.02]">
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg flex items-center justify-center text-white shadow-lg">
                    <Sprout size={20} className="rotate-12" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 tracking-tighter leading-none">GARDEN</span>
                    <span className="text-[9px] font-extrabold text-green-600 uppercase tracking-widest">Planner Pro</span>
                </div>
            </div>

            {/* Controls - Centered */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
                {/* Backup Controls */}
                <div className="bg-white/60 backdrop-blur-lg border border-white/30 p-1 rounded-2xl shadow-lg">
                    <BackupControls onRestore={() => window.location.reload()} />
                </div>

                {/* Main Switcher */}
                <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-1 flex items-center gap-1">
                    <button
                        onClick={() => onViewChange('planner')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl transition-all duration-500 font-bold text-sm tracking-tight whitespace-nowrap",
                            activeView === 'planner'
                                ? "bg-green-600 text-white shadow-lg shadow-green-200 scale-105"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <LayoutDashboard size={18} className={cn("transition-transform duration-500", activeView === 'planner' && "rotate-12")} />
                        Planner
                    </button>
                    <button
                        onClick={() => onViewChange('seedbed')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl transition-all duration-500 font-bold text-sm tracking-tight whitespace-nowrap",
                            activeView === 'seedbed'
                                ? "bg-green-600 text-white shadow-lg shadow-green-200 scale-105"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <Sprout size={18} className={cn("transition-transform duration-500", activeView === 'seedbed' && "rotate-12")} />
                        Seedbed
                    </button>
                </div>

                {/* Site Setup */}
                <button
                    onClick={() => onViewChange('setup')}
                    className={cn(
                        "bg-white/60 backdrop-blur-lg border border-white/30 px-4 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-black tracking-wider uppercase transition-all duration-300 hover:bg-white/80 shadow-lg",
                        activeView === 'setup'
                            ? "text-blue-600 border-blue-200/50 bg-white/90"
                            : "text-slate-500"
                    )}
                >
                    <MapIcon size={14} />
                    Setup
                </button>
            </div>

            {/* Empty spacer for balance */}
            <div className="w-48 invisible" />
        </header>
    );
};

export default Navigation;
