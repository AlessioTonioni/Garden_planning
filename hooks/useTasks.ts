import { useState, useEffect, useCallback } from 'react';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: string;
    dueDate: string | null;
    zoneId: string | null;
    zoneName: string | null;
    placementId: string | null;
    placementLabel: string | null;
    recurrence: string | null;
    lastCompletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskData {
    title: string;
    description?: string;
    dueDate?: string;
    zoneId?: string;
    placementId?: string;
    placementLabel?: string;
    recurrence?: string;
}

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);

    const loadTasks = useCallback(async () => {
        const res = await fetch('/api/tasks');
        if (res.ok) setTasks(await res.json());
    }, []);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    const createTask = async (data: CreateTaskData) => {
        await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        loadTasks();
    };

    const updateTask = async (id: string, data: Partial<CreateTaskData> & { status?: string }) => {
        await fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        loadTasks();
    };

    const completeTask = async (id: string) => {
        await fetch(`/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'complete' }),
        });
        loadTasks();
    };

    const deleteTask = async (id: string) => {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        loadTasks();
    };

    const overdueCount = tasks.filter(
        t => t.status === 'open' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    return { tasks, loadTasks, createTask, updateTask, completeTask, deleteTask, overdueCount };
}
