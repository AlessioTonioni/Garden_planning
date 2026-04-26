'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, ChevronDown, ChevronUp, RefreshCw, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/UI/Modal';
import { Task, CreateTaskData } from '@/hooks/useTasks';

interface TasksViewProps {
    tasks: Task[];
    createTask: (data: CreateTaskData) => Promise<void>;
    updateTask: (id: string, data: Partial<CreateTaskData> & { status?: string }) => Promise<void>;
    completeTask: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    onNavigateToZone?: (zoneId: string) => void;
    zoneFilter: string;
    onZoneFilterChange: (id: string) => void;
}

type Filter = 'all' | 'open' | 'done' | 'overdue';

const RECURRENCE_LABELS: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
};

function formatDate(d: string | null): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(task: Task): boolean {
    return task.status === 'open' && !!task.dueDate && new Date(task.dueDate) < new Date();
}

// Recurring tasks with a future dueDate have already been completed for this cycle —
// hide them until the next due date. Non-recurring tasks are always shown regardless of due date.
function isDue(task: Task): boolean {
    if (task.status !== 'open') return false;
    if (task.recurrence && task.dueDate && new Date(task.dueDate) > new Date()) return false;
    return true;
}

const EMPTY_FORM: CreateTaskData = {
    title: '', description: '', dueDate: '', zoneId: '', placementLabel: '', recurrence: '',
};

export default function TasksView({ tasks, createTask, updateTask, completeTask, deleteTask, onNavigateToZone, zoneFilter, onZoneFilterChange }: TasksViewProps) {
    const [filter, setFilter] = useState<Filter>('open');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [form, setForm] = useState<CreateTaskData>(EMPTY_FORM);
    const [zones, setZones] = useState<{ id: string; name: string | null }[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [completing, setCompleting] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/zones').then(r => r.json()).then(data => setZones(data.map((z: any) => ({ id: z.id, name: z.name }))));
    }, []);

    const openNew = () => {
        setEditingTask(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    };

    const openEdit = (task: Task) => {
        setEditingTask(task);
        setForm({
            title: task.title,
            description: task.description || '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            zoneId: task.zoneId || '',
            placementLabel: task.placementLabel || '',
            recurrence: task.recurrence || '',
        });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) return;
        const payload: CreateTaskData = {
            title: form.title.trim(),
            description: form.description?.trim() || undefined,
            dueDate: form.dueDate || undefined,
            zoneId: form.zoneId || undefined,
            placementLabel: form.placementLabel?.trim() || undefined,
            recurrence: form.recurrence || undefined,
        };
        if (editingTask) {
            await updateTask(editingTask.id, payload);
        } else {
            await createTask(payload);
        }
        setShowForm(false);
    };

    const handleComplete = async (task: Task) => {
        setCompleting(task.id);
        await completeTask(task.id);
        setCompleting(null);
    };

    const uniqueZones = Array.from(
        new Map(tasks.filter(t => t.zoneId).map(t => [t.zoneId!, t.zoneName || t.zoneId!])).entries()
    );

    const filtered = tasks.filter(t => {
        if (zoneFilter !== 'all' && t.zoneId !== zoneFilter) return false;
        if (filter === 'open') { if (!isDue(t)) return false; }
        else if (filter === 'done') { if (t.status !== 'done') return false; }
        else if (filter === 'overdue') { if (!isOverdue(t)) return false; }
        if (search.trim()) {
            const q = search.toLowerCase();
            if (
                !t.title.toLowerCase().includes(q) &&
                !(t.description || '').toLowerCase().includes(q) &&
                !(t.placementLabel || '').toLowerCase().includes(q) &&
                !(t.zoneName || '').toLowerCase().includes(q)
            ) return false;
        }
        return true;
    });

    const overdueCount = tasks.filter(isOverdue).length;
    const activeCount = tasks.filter(isDue).length;

    return (
        <div className="max-w-2xl mx-auto px-4 pb-16">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tasks</h1>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        {activeCount} open
                        {overdueCount > 0 && <span className="text-red-500 ml-2">· {overdueCount} overdue</span>}
                    </p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95"
                >
                    <Plus size={14} />
                    Add Task
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-4 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={15} />
                <input
                    type="text"
                    placeholder="Search tasks…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                {(['open', 'overdue', 'all', 'done'] as Filter[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all',
                            filter === f
                                ? f === 'overdue'
                                    ? 'bg-red-100 border-red-400 text-red-700'
                                    : 'bg-green-100 border-green-400 text-green-700'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                        )}
                    >
                        {f}{f === 'overdue' && overdueCount > 0 ? ` (${overdueCount})` : ''}
                    </button>
                ))}

                {uniqueZones.length > 0 && (
                    <>
                        <div className="w-px h-4 bg-slate-200" />
                        <button
                            onClick={() => onZoneFilterChange('all')}
                            className={cn(
                                'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all',
                                zoneFilter === 'all'
                                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-400'
                            )}
                        >
                            All zones
                        </button>
                        {uniqueZones.map(([id, name]) => (
                            <button
                                key={id}
                                onClick={() => onZoneFilterChange(id)}
                                className={cn(
                                    'px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all',
                                    zoneFilter === id
                                        ? 'bg-blue-100 border-blue-400 text-blue-700'
                                        : 'bg-slate-50 border-slate-200 text-slate-400'
                                )}
                            >
                                {name}
                            </button>
                        ))}
                    </>
                )}
            </div>

            {/* Task list */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-slate-300">
                    <div className="text-5xl mb-3">✓</div>
                    <p className="text-sm font-black uppercase tracking-widest">No tasks here</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(task => {
                        const overdue = isOverdue(task);
                        const expanded = expandedId === task.id;
                        return (
                            <div
                                key={task.id}
                                className={cn(
                                    'rounded-2xl border p-4 transition-all',
                                    task.status === 'done'
                                        ? 'bg-slate-50 border-slate-100 opacity-60'
                                        : overdue
                                            ? 'bg-red-50 border-red-100'
                                            : 'bg-white border-slate-100 shadow-sm'
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Complete button */}
                                    {task.status === 'open' && (
                                        <button
                                            onClick={() => handleComplete(task)}
                                            disabled={completing === task.id}
                                            className={cn(
                                                'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                                                overdue
                                                    ? 'border-red-300 hover:bg-red-100'
                                                    : 'border-slate-300 hover:bg-green-50 hover:border-green-400',
                                                completing === task.id && 'opacity-50'
                                            )}
                                        >
                                            {completing === task.id && <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />}
                                        </button>
                                    )}
                                    {task.status === 'done' && (
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center shrink-0">
                                            <Check size={10} className="text-green-600" strokeWidth={3} />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={cn(
                                                'text-sm font-bold text-slate-800 leading-tight',
                                                task.status === 'done' && 'line-through text-slate-400'
                                            )}>
                                                {task.title}
                                            </span>
                                            {task.recurrence && (
                                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-violet-100 border border-violet-200 text-violet-700 flex items-center gap-1">
                                                    <RefreshCw size={8} />
                                                    {RECURRENCE_LABELS[task.recurrence] || task.recurrence}
                                                </span>
                                            )}
                                        </div>

                                        {/* Chips row */}
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            {task.dueDate && (
                                                <span className={cn(
                                                    'px-2 py-0.5 rounded-full text-[9px] font-black uppercase border',
                                                    overdue
                                                        ? 'bg-red-100 border-red-200 text-red-600'
                                                        : 'bg-slate-100 border-slate-200 text-slate-500'
                                                )}>
                                                    {overdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
                                                </span>
                                            )}
                                            {task.zoneName && (
                                                <button
                                                    onClick={() => task.zoneId && onNavigateToZone?.(task.zoneId)}
                                                    className={cn(
                                                        'px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 border border-blue-100 text-blue-600',
                                                        onNavigateToZone && task.zoneId && 'hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer'
                                                    )}
                                                >
                                                    {task.zoneName}
                                                </button>
                                            )}
                                            {task.placementLabel && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-50 border border-green-100 text-green-700">
                                                    🌱 {task.placementLabel}
                                                </span>
                                            )}
                                        </div>

                                        {/* Expandable description */}
                                        {task.description && (
                                            <button
                                                onClick={() => setExpandedId(expanded ? null : task.id)}
                                                className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                {expanded ? 'Hide' : 'Show'} note
                                            </button>
                                        )}
                                        {expanded && task.description && (
                                            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{task.description}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => openEdit(task)}
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all text-[10px] font-black"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit modal */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={editingTask ? 'Edit Task' : 'New Task'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Title *</label>
                        <input
                            autoFocus
                            type="text"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            placeholder="e.g. Water the tomatoes"
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Notes</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={2}
                            placeholder="Optional details…"
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Due date</label>
                            <input
                                type="date"
                                value={form.dueDate}
                                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Repeat</label>
                            <select
                                value={form.recurrence}
                                onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                <option value="">No repeat</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Linked zone</label>
                            <select
                                value={form.zoneId}
                                onChange={e => setForm(f => ({ ...f, zoneId: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                <option value="">None</option>
                                {zones.map(z => (
                                    <option key={z.id} value={z.id}>{z.name || 'Unnamed'}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Linked plant</label>
                            <input
                                type="text"
                                value={form.placementLabel}
                                onChange={e => setForm(f => ({ ...f, placementLabel: e.target.value }))}
                                placeholder="e.g. Rosemary"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!form.title.trim()}
                            className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-green-200 hover:bg-green-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {editingTask ? 'Save' : 'Create'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
