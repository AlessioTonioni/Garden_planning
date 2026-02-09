import React from 'react';

interface SchematicToolsProps {
    activeTool: string | null;
    setActiveTool: (tool: string | null) => void;
    visible: boolean;
}

export const SchematicTools: React.FC<SchematicToolsProps> = ({ activeTool, setActiveTool, visible }) => {
    if (!visible) return null;

    return (
        <div className="absolute top-24 left-8 z-[60] flex flex-col gap-2 bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-white/40 shadow-xl animate-in slide-in-from-left-8 duration-500">
            <div className="text-[9px] font-black uppercase text-center text-slate-400 tracking-widest pb-2 border-b border-slate-200/50 mb-1">
                Tools
            </div>
            {['plant', 'tree', 'pot', 'flower'].map(t => (
                <button
                    key={t}
                    onClick={() => setActiveTool(activeTool === t ? null : t)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-300 relative group
                        ${activeTool === t ? 'bg-green-600 text-white shadow-lg shadow-green-200 scale-110 z-10' : 'bg-white/50 text-slate-400 hover:bg-green-50 hover:text-green-600 hover:scale-105'}`}
                    title={`Place ${t}`}
                >
                    {t === 'tree' ? '🌳' : t === 'pot' ? '🪴' : t === 'flower' ? '🌸' : '🌱'}
                    {activeTool === t && (
                        <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                            {t.toUpperCase()}
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
};
