'use client';

import React from 'react';
import { Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSeedbed } from '@/hooks/useSeedbed';
import { ActiveSeedlings } from './ActiveSeedlings';
import { SeedInventoryTable } from './SeedInventoryTable';
import { SeedFormModal } from './SeedFormModal';
import { SowFormModal } from './SowFormModal';
import { SeedlingFormModal } from './SeedlingFormModal';

interface SeedbedViewProps {
    selectedSeedIds?: string[];
    setSelectedSeedIds?: React.Dispatch<React.SetStateAction<string[]>>;
}

const SeedbedView = ({ selectedSeedIds = [], setSelectedSeedIds = () => { } }: SeedbedViewProps) => {
    const {
        seeds,
        allSeeds,
        seedlings,
        loading,
        activeTab,
        setActiveTab,
        isSeedModalOpen,
        setIsSeedModalOpen,
        isSowModalOpen,
        setIsSowModalOpen,
        isSeedlingModalOpen,
        setIsSeedlingModalOpen,
        editingSeed,
        setEditingSeed,
        editingSeedling,
        setEditingSeedling,
        selectedSeedForSowing,
        setSelectedSeedForSowing,
        isAnalyzing,
        fileInputRef,
        sortConfig,
        setSortConfig,
        showOnlySowable,
        setShowOnlySowable,
        searchQuery,
        setSearchQuery,
        currentMonth,
        handleSaveSeed,
        handleDeleteSeed,
        handlePhotoUpload,
        handleSowSeed,
        handleUpdateSeedling,
        handleDeleteSeedling
    } = useSeedbed();

    const toggleSeedSelection = (id: string) => {
        setSelectedSeedIds(prev =>
            prev.includes(id) ? prev.filter(seedId => seedId !== id) : [...prev, id]
        );
    };


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Gathering garden data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                            <Sprout size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Seedbed Manager</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Track your seeds from packet to soil.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                        {(['active', 'inventory'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 capitalize",
                                    activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {tab === 'active' ? 'Active Seedlings' : 'Seed Inventory'}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {activeTab === 'active' ? (
                <ActiveSeedlings
                    seedlings={seedlings}
                    seeds={allSeeds}
                    onSowFromInventory={() => setActiveTab('inventory')}
                    onEditSeedling={setEditingSeedling && ((s) => { setEditingSeedling(s); setIsSeedlingModalOpen(true); })}
                    onDeleteSeedling={handleDeleteSeedling}
                />
            ) : (
                <SeedInventoryTable
                    seeds={seeds}
                    selectedSeedIds={selectedSeedIds}
                    onToggleSeedSelection={toggleSeedSelection}
                    onAddSeed={() => { setEditingSeed({ species: '', packetQuantity: 10, acquiredAt: new Date().toISOString().split('T')[0] }); setIsSeedModalOpen(true); }}
                    onEditSeed={(seed) => { setEditingSeed(seed); setIsSeedModalOpen(true); }}
                    onDeleteSeed={handleDeleteSeed}
                    onSowSeed={(seed) => { setSelectedSeedForSowing(seed); setEditingSeedling({ quantity: 1, seededAt: new Date().toISOString().split('T')[0] }); setIsSowModalOpen(true); }}
                    onPhotoUpload={handlePhotoUpload}
                    isAnalyzing={isAnalyzing}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showOnlySowable={showOnlySowable}
                    setShowOnlySowable={setShowOnlySowable}
                    sortConfig={sortConfig}
                    onToggleSort={setSortConfig && ((key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' })))}
                />
            )}

            <SeedFormModal
                isOpen={isSeedModalOpen}
                onClose={() => setIsSeedModalOpen(false)}
                onSave={handleSaveSeed}
                editingSeed={editingSeed}
                setEditingSeed={setEditingSeed}
            />

            <SowFormModal
                isOpen={isSowModalOpen}
                onClose={() => setIsSowModalOpen(false)}
                onSow={handleSowSeed}
                seed={selectedSeedForSowing}
                editingSeedling={editingSeedling}
                setEditingSeedling={setEditingSeedling}
            />

            <SeedlingFormModal
                isOpen={isSeedlingModalOpen}
                onClose={() => setIsSeedlingModalOpen(false)}
                onUpdate={handleUpdateSeedling}
                editingSeedling={editingSeedling}
                setEditingSeedling={setEditingSeedling}
            />
        </div>
    );
};

export default SeedbedView;
