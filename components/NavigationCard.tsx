
import React from 'react';

interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  onClick: () => void;
  gradient: string;
  delayClass: string;
  isCompact?: boolean;
}

const NavigationCard: React.FC<NavigationCardProps> = ({ 
  title, 
  description, 
  icon, 
  onClick, 
  gradient, 
  delayClass,
  isCompact = false 
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col glass rounded-[1.5rem] md:rounded-[2rem] transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 text-left w-full opacity-0 animate-slide-up ${delayClass} 
      ${isCompact ? 'p-4.5 md:p-5' : 'p-7'}`}
    >
      <div className={`rounded-xl md:rounded-2xl bg-gradient-to-br ${gradient} w-fit shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 
      ${isCompact ? 'p-2.5 mb-3' : 'p-4 mb-5'}`}>
        {/* Fix: cast icon to any to allow injection of className via cloneElement */}
        {React.cloneElement(icon as React.ReactElement<any>, { 
          className: isCompact ? "w-5 h-5 text-white" : "w-6 h-6 text-white" 
        })}
      </div>
      <h3 className={`font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors tracking-tight
      ${isCompact ? 'text-base' : 'text-xl'}`}>{title}</h3>
      <p className={`text-slate-500 leading-tight font-medium
      ${isCompact ? 'text-[11px]' : 'text-sm'}`}>{description}</p>
      
      {!isCompact && (
        <div className="mt-6 flex items-center text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>ACCEDER AHORA</span>
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      )}
    </button>
  );
};

export default NavigationCard;
