'use client';

import { useState } from 'react';
import MapWrapper from '@/components/Map/MapWrapper';
import Navigation from '@/components/Navigation';
import SeedbedView from '@/components/Seedbed/SeedbedView';
import TasksView from '@/components/Tasks/TasksView';
import { AIChat } from '@/components/AI/AIChat';
import { useTasks } from '@/hooks/useTasks';

export default function Home() {
    const [activeView, setActiveView] = useState<'planner' | 'seedbed' | 'tasks' | 'setup'>('planner');
    const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [selectedSeedIds, setSelectedSeedIds] = useState<string[]>([]);
    const [tasksZoneFilter, setTasksZoneFilter] = useState('all');

    const { tasks, loadTasks, createTask, updateTask, completeTask, deleteTask, overdueCount } = useTasks();

    return (
        <main className="w-full h-full relative overflow-hidden bg-slate-50">
            <Navigation activeView={activeView} onViewChange={setActiveView} taskOverdueCount={overdueCount} />

            <div className="w-full h-full transition-all duration-700 ease-in-out">
                {activeView === 'planner' ? (
                    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                        <MapWrapper
                            initialView="schematic"
                            selectedZoneIds={selectedZoneIds}
                            setSelectedZoneIds={setSelectedZoneIds}
                            selectedItemIds={selectedItemIds}
                            setSelectedItemIds={setSelectedItemIds}
                            tasks={tasks}
                            onNavigateToTasks={(zoneId: string) => { setTasksZoneFilter(zoneId); setActiveView('tasks'); }}
                        />
                    </div>
                ) : activeView === 'seedbed' ? (
                    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-y-auto pt-24">
                        <SeedbedView
                            selectedSeedIds={selectedSeedIds}
                            setSelectedSeedIds={setSelectedSeedIds}
                        />
                    </div>
                ) : activeView === 'tasks' ? (
                    <div className="w-full h-full animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-y-auto pt-24">
                        <TasksView
                            tasks={tasks}
                            createTask={createTask}
                            updateTask={updateTask}
                            completeTask={completeTask}
                            deleteTask={deleteTask}
                            onNavigateToZone={(zoneId) => {
                                setSelectedZoneIds([zoneId]);
                                setActiveView('planner');
                            }}
                            zoneFilter={tasksZoneFilter}
                            onZoneFilterChange={setTasksZoneFilter}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full animate-in fade-in duration-500">
                        <MapWrapper
                            initialView="map"
                            selectedZoneIds={selectedZoneIds}
                            setSelectedZoneIds={setSelectedZoneIds}
                            selectedItemIds={selectedItemIds}
                            setSelectedItemIds={setSelectedItemIds}
                        />
                    </div>
                )}
            </div>

            <AIChat
                selectedZoneIds={selectedZoneIds}
                selectedItemIds={selectedItemIds}
                selectedSeedIds={selectedSeedIds}
                onTasksMutated={loadTasks}
            />
        </main>
    );
}
