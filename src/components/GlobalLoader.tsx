import React from 'react';
import { useUIStore } from '../store/useUIStore';

interface GlobalLoaderProps {
  text?: string;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ text }) => {
  const isGlobalLoading = useUIStore((state) => state.isGlobalLoading);

  if (!isGlobalLoading && !text) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="flex flex-col items-center gap-4">
        {/* Можна замінити на фірмовий SVG-лоадер */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <span className="text-white font-medium tracking-wide">{text || "Синхронізація..."}</span>
      </div>
    </div>
  );
};
