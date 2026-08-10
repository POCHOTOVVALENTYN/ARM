import { create } from 'zustand';
import { ControlPointNode } from '../types';
interface ControlPointStoreState {
  controlPoints: ControlPointNode[];
  // Actions for global control points
  setControlPoints: (points: ControlPointNode[]) => void;
  addControlPoint: (point: ControlPointNode) => void;
  updateControlPoint: (updatedPoint: ControlPointNode) => void;
  deleteControlPoint: (id: string) => void;
}

export const useControlPointStore = create<ControlPointStoreState>((set) => ({
  controlPoints: [], // Initialize empty
  
  setControlPoints: (points) => set({ controlPoints: points }),
  addControlPoint: (point) => set((state) => ({
    controlPoints: [...state.controlPoints, point]
  })),

  updateControlPoint: (updatedPoint) => set((state) => ({
    controlPoints: state.controlPoints.map(p => p.id === updatedPoint.id ? updatedPoint : p)
  })),

  deleteControlPoint: (id) => set((state) => ({
    controlPoints: state.controlPoints.filter(p => p.id !== id)
  })),
}));
