
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, onBack }) => {
  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500/30">
      <header className="glass sticky top-0 z-50 px-4 py-3 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2.5 hover:bg-black/5 rounded-xl transition-all active:scale-95"
              >
                <svg className="w-5 h-5 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-600">Testing Operations</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/50 rounded-2xl border border-white/20">
             <div className="relative">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
               <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
             </div>
             <span className="text-xs font-bold text-slate-700">Sync Active</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 pb-12">
        {children}
      </main>

      <footer className="py-8 text-center opacity-60">
        <p className="text-sm font-medium">Test Manager Pro <span className="text-indigo-400 mx-2">•</span> 2024</p>
      </footer>
    </div>
  );
};

export default Layout;
