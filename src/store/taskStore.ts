import { create } from "zustand";
import type { Task } from "../types/task";

// Define the shape of our application state
interface TaskStore {
  // All the tasks in our project
  tasks: Task[];

  // Which view is currently active (kanban board, list, or timeline)
  currentView: 'kanban' | 'list' | 'timeline';

  // Current filter settings
  filters: {
    status: string[];      // Which statuses to show
    priority: string[];    // Which priorities to show
    assignee: string[];    // Which assignees to show
    dueDateFrom: string;   // Earliest due date
    dueDateTo: string;     // Latest due date
  };

  // How to sort the list view
  sortBy: 'title' | 'priority' | 'dueDate';
  sortDirection: 'asc' | 'desc';

  // Actions to update the state
  setTasks: (tasks: Task[]) => void;
  setCurrentView: (view: 'kanban' | 'list' | 'timeline') => void;
  setFilters: (filters: Partial<TaskStore['filters']>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setSort: (sortBy: 'title' | 'priority' | 'dueDate', direction: 'asc' | 'desc') => void;
}

// Create the Zustand store with initial state and actions
export const useTaskStore = create<TaskStore>((set) => ({
  // Initial state
  tasks: [],
  currentView: 'kanban',
  filters: {
    status: [],
    priority: [],
    assignee: [],
    dueDateFrom: '',
    dueDateTo: '',
  },
  sortBy: 'title',
  sortDirection: 'asc',

  // Action implementations
  setTasks: (tasks) => set({ tasks }),

  setCurrentView: (view) => set({ currentView: view }),

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    )
  })),

  setSort: (sortBy, sortDirection) => set({ sortBy, sortDirection }),
}));