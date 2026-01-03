
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import NavigationCard from './components/NavigationCard';
import { TestStatus, FormState, TestEntry } from './types';
import { googleSheetsService, RegistryAnimal } from './services/googleSheetsService';
import { generateSmartObservation } from './services/geminiService';

interface NavigationAction {
  title: string;
  description: string;
  // Fixed: use React.ReactElement instead of JSX.Element to resolve "Cannot find namespace 'JSX'"
  icon: React.ReactElement;
  gradient: string;
  path?: string;
  onClick?: () => Promise<void> | void;
  delay: string;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const primaryActions: NavigationAction[] = [
    {
      title: 'Inicio Test',
      description: 'Registro con autocompletado predictivo desde Drive.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      gradient: 'from-indigo-500 to-blue-600',
      path: '/start',
      delay: 'stagger-1'
    },
    {
      title: 'Fin de Test',
      description: 'Cierre de ciclo, pesaje final y observaciones de salida.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      gradient: 'from-emerald-500 to-teal-600',
      path: '/end',
      delay: 'stagger-2'
    }
  ];

  const secondaryActions: NavigationAction[] = [
    {
      title: 'Base de Datos',
      description: 'Historial completo de animales y resultados.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zM9 12h6M9 16h6" /></svg>,
      gradient: 'from-violet-500 to-purple-600',
      path: '/database',
      delay: 'stagger-3'
    },
    {
      title: 'Exportar Master',
      description: 'Descargar toda la sábana de datos Excel/CSV.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
      gradient: 'from-slate-700 to-slate-900',
      delay: 'stagger-4',
      onClick: async () => {
        const data = await googleSheetsService.fetchAllData();
        googleSheetsService.exportToCSV(data, 'Master_DB');
      }
    },
    {
      title: 'Exportar T-Start',
      description: 'Reporte específico de ingresos y pesajes.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>,
      gradient: 'from-pink-500 to-rose-600',
      delay: 'stagger-5',
      onClick: async () => {
        const data = await googleSheetsService.fetchAllData();
        googleSheetsService.exportToCSV(data, 'T_Start_Log');
      }
    },
    {
      title: 'Exportar T-End',
      description: 'Reporte de salidas y eficiencia.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      gradient: 'from-amber-500 to-orange-600',
      delay: 'stagger-6',
      onClick: async () => {
        const data = await googleSheetsService.fetchAllData();
        googleSheetsService.exportToCSV(data.filter(d => d.status === TestStatus.COMPLETED), 'T_End_Log');
      }
    }
  ];

  return (
    <div className="space-y-8 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {primaryActions.map((action, idx) => (
          <NavigationCard
            key={`primary-${idx}`}
            title={action.title}
            description={action.description}
            icon={action.icon}
            gradient={action.gradient}
            delayClass={action.delay}
            onClick={action.path ? () => navigate(action.path!) : action.onClick!}
          />
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-start">
          <span className="pr-3 bg-transparent text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Gestión de Datos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryActions.map((action, idx) => (
          <NavigationCard
            key={`secondary-${idx}`}
            isCompact={true}
            title={action.title}
            description={action.description}
            icon={action.icon}
            gradient={action.gradient}
            delayClass={action.delay}
            onClick={action.path ? () => navigate(action.path!) : action.onClick!}
          />
        ))}
      </div>
    </div>
  );
};

const TestForm = ({ type }: { type: 'START' | 'END' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [animalFound, setAnimalFound] = useState<boolean | null>(null);
  const [isDeceased, setIsDeceased] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(type === 'START');
  const [suggestions, setSuggestions] = useState<RegistryAnimal[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const numberInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const [form, setForm] = useState<FormState>({
    date: new Date().toISOString().split('T')[0],
    tattooPrefix: localStorage.getItem('last_tattoo_prefix') || '',
    animalNumber: '',
    breed: '',
    weight: '',
    shed: localStorage.getItem('last_shed') || '',
    pen: localStorage.getItem('last_pen') || '',
    mother: '-',
    father: '-',
    birthDate: '-',
    notes: ''
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (form.animalNumber.trim().length >= 1) {
        const matches = await googleSheetsService.searchAnimals(form.animalNumber, form.tattooPrefix);
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [form.animalNumber, form.tattooPrefix]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.animalNumber.trim().length >= 1) {
        setLookupLoading(true);
        const fullId = `${form.tattooPrefix}${form.animalNumber.trim()}`;
        const animalData = await googleSheetsService.lookupAnimal(fullId);
        
        if (animalData) {
          setForm(prev => ({
            ...prev,
            breed: animalData.breed,
            mother: animalData.mother,
            father: animalData.father,
            birthDate: animalData.birthDate
          }));
          setAnimalFound(true);
          setIsDeceased(!!animalData.isDeceased);
        } else {
          setAnimalFound(false);
          setIsDeceased(false);
        }
        setLookupLoading(false);
      } else {
        setAnimalFound(null);
        setIsDeceased(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.animalNumber, form.tattooPrefix]);

  const selectSuggestion = (animal: RegistryAnimal) => {
    let numericPart = animal.id;
    const prefixNorm = form.tattooPrefix.toLowerCase().trim();
    if (animal.id.toLowerCase().startsWith(prefixNorm)) {
      numericPart = animal.id.substring(form.tattooPrefix.length).trim();
    }

    setForm(prev => ({
      ...prev,
      animalNumber: numericPart,
      breed: animal.breed,
      mother: animal.mother,
      father: animal.father,
      birthDate: animal.birthDate
    }));
    setAnimalFound(true);
    setIsDeceased(!!animal.isDeceased);
    setShowSuggestions(false);
    
    setTimeout(() => weightInputRef.current?.focus(), 50);
  };

  const handleAnimalInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showSuggestions || animalFound) {
        e.preventDefault();
        setShowSuggestions(false);
        weightInputRef.current?.focus();
      }
    }
  };

  const handleAiImprove = async () => {
    if (!form.notes) return;
    setAiLoading(true);
    const improved = await generateSmartObservation(form.notes);
    setForm(prev => ({ ...prev, notes: improved }));
    setAiLoading(false);
  };

  const handleConfigConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('last_tattoo_prefix', form.tattooPrefix);
    localStorage.setItem('last_shed', form.shed);
    localStorage.setItem('last_pen', form.pen);
    setShowConfigModal(false);
    setTimeout(() => numberInputRef.current?.focus(), 100);
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || parseFloat(value) >= 0) {
      setForm(p => ({ ...p, weight: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDeceased) {
      const confirm = window.confirm("¡ALERTA! El animal figura como fallecido en la base de datos de bajas. ¿Desea ignorar esta advertencia y guardar de todas formas?");
      if (!confirm) return;
    }

    const weightVal = parseFloat(form.weight);
    if (isNaN(weightVal) || weightVal <= 0) {
      alert('El peso debe ser un número positivo mayor a 0.');
      return;
    }

    setLoading(true);
    try {
      const animalId = `${form.tattooPrefix}${form.animalNumber}`;
      const data: Partial<TestEntry> = {
        date: form.date,
        animalId,
        breed: form.breed,
        weight: weightVal,
        shed: form.shed,
        pen: form.pen,
        mother: form.mother,
        father: form.father,
        birthDate: form.birthDate,
        notes: form.notes,
        startTime: new Date().toISOString(),
        status: type === 'START' ? TestStatus.IN_PROGRESS : TestStatus.COMPLETED
      };
      
      if (type === 'START') {
        await googleSheetsService.saveStartTest(data);
      } else {
        await googleSheetsService.saveEndTest(data);
      }
      
      setSuccessMsg(true);
      setForm(p => ({
        ...p,
        animalNumber: '',
        breed: '',
        weight: '',
        mother: '-',
        father: '-',
        birthDate: '-',
        notes: ''
      }));
      setAnimalFound(null);
      setIsDeceased(false);
      
      setTimeout(() => setSuccessMsg(false), 3000);
      setTimeout(() => numberInputRef.current?.focus(), 100);

    } catch (err) {
      alert('Error en la comunicación con Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] animate-bounce">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            <span className="font-black text-sm uppercase tracking-widest">¡Sincronización Exitosa!</span>
          </div>
        </div>
      )}

      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass max-w-md w-full p-6 md:p-8 rounded-[2rem] shadow-2xl border border-white/20 animate-slide-up">
            <h3 className="text-xl font-black text-slate-900 mb-1">Configuración de Sesión</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Parámetros fijos para esta tanda de carga.</p>
            
            <form onSubmit={handleConfigConfirm} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Prefijo (Tatuaje)</label>
                <input
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-black text-xl text-indigo-600 tracking-tighter"
                  placeholder="Ej: ABC-"
                  value={form.tattooPrefix}
                  onChange={e => setForm(p => ({ ...p, tattooPrefix: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Galpón</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="G1"
                    value={form.shed}
                    onChange={e => setForm(p => ({ ...p, shed: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Corral</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="C12"
                    value={form.pen}
                    onChange={e => setForm(p => ({ ...p, pen: e.target.value }))}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-extrabold text-md transition-all shadow-xl mt-2 flex items-center justify-center gap-2"
              >
                EMPEZAR CARGA
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto glass rounded-[2rem] p-6 md:p-8 animate-slide-up shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${type === 'START' ? 'from-indigo-500 to-blue-600' : 'from-emerald-500 to-teal-600'} shadow-lg`}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {type === 'START' ? 'Alta de Test Animal' : 'Cierre de Ciclo'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carga Continua con Filtro Inteligente</p>
          </div>
        </div>

        {isDeceased && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-2xl flex items-center gap-4 animate-bounce shadow-lg">
             <div className="bg-red-500 p-2 rounded-full text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <div>
                <p className="text-red-700 font-black text-sm uppercase tracking-tight">¡ATENCIÓN! ANIMAL REGISTRADO COMO MUERTO</p>
                <p className="text-red-600 text-xs font-bold">Este animal figura en la base de datos de bajas.</p>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1 relative">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identificación</label>
                <div className="flex items-center gap-2">
                   {lookupLoading && <div className="w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                   {isDeceased ? (
                     <span className="text-[9px] font-black text-red-600 tracking-tighter">FALLECIDO ✖</span>
                   ) : (
                     <>
                      {animalFound === true && <span className="text-[9px] font-black text-emerald-500 tracking-tighter">ENCONTRADO ✓</span>}
                      {animalFound === false && <span className="text-[9px] font-black text-amber-500 tracking-tighter">NUEVO +</span>}
                     </>
                   )}
                </div>
              </div>
              <div className={`flex overflow-hidden border rounded-xl transition-all bg-white/50 ${isDeceased ? 'border-red-500 bg-red-50/10' : animalFound ? 'border-emerald-400 bg-emerald-50/10' : 'border-slate-200 focus-within:border-indigo-500'}`}>
                <div className={`bg-slate-100 px-3 flex items-center justify-center border-r border-slate-200 min-w-[60px] ${isDeceased ? 'bg-red-50' : ''}`}>
                  <span className={`text-[10px] font-black tracking-tighter uppercase ${isDeceased ? 'text-red-600' : 'text-slate-500'}`}>{form.tattooPrefix || '-'}</span>
                </div>
                <input
                  required
                  ref={numberInputRef}
                  type="text"
                  autoComplete="off"
                  className={`w-full px-4 py-2.5 bg-transparent outline-none font-black placeholder:text-slate-300 text-sm ${isDeceased ? 'text-red-600' : 'text-indigo-600'}`}
                  placeholder="Número..."
                  value={form.animalNumber}
                  onKeyDown={handleAnimalInputKeyDown}
                  onChange={e => {
                    setForm(p => ({ ...p, animalNumber: e.target.value }));
                    setShowSuggestions(true);
                  }}
                  onFocus={() => form.animalNumber && setShowSuggestions(suggestions.length > 0)}
                />
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute left-0 right-0 top-full mt-1 z-50 glass rounded-xl shadow-xl border border-white/40 overflow-hidden"
                >
                  {suggestions.map((animal) => (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => selectSuggestion(animal)}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white transition-colors text-left group ${animal.isDeceased ? 'bg-red-50/50' : ''}`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-black ${animal.isDeceased ? 'text-red-700' : 'text-slate-900'}`}>{animal.id}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{animal.breed}</span>
                      </div>
                      <div className="flex gap-2">
                        {animal.isDeceased && <span className="text-[8px] font-black text-white bg-red-600 px-2 py-1 rounded-md">MUERTO</span>}
                        {animal.id.toLowerCase().startsWith(form.tattooPrefix.toLowerCase()) && (
                          <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">LOTE ACTUAL</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Raza</label>
              <input
                required
                className="w-full px-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm"
                placeholder="Angus..."
                value={form.breed}
                onChange={e => setForm(p => ({ ...p, breed: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Peso (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                ref={weightInputRef}
                className="w-full px-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-black text-indigo-600 text-sm"
                placeholder="0.00"
                value={form.weight}
                onChange={handleWeightChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Galpón</label>
                  <input
                    required
                    className="w-full px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm"
                    value={form.shed}
                    onChange={e => setForm(p => ({ ...p, shed: e.target.value }))}
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Corral</label>
                  <input
                    required
                    className="w-full px-3 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm"
                    value={form.pen}
                    onChange={e => setForm(p => ({ ...p, pen: e.target.value }))}
                  />
               </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 shadow-lg border border-white/5 relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-3">
              <svg className={`w-3 h-3 ${isDeceased ? 'text-red-400' : animalFound ? 'text-emerald-400' : 'text-indigo-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="text-white font-extrabold text-[9px] uppercase tracking-[0.2em]">Genealogía y Origen</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Madre</span>
                <p className="text-white font-bold text-xs truncate">{form.mother}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Padre</span>
                <p className="text-white font-bold text-xs truncate">{form.father}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Nacimiento</span>
                <p className="text-white font-bold text-xs truncate">{form.birthDate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Observaciones</label>
              <button
                type="button"
                onClick={handleAiImprove}
                disabled={aiLoading || !form.notes}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
              >
                <svg className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {aiLoading ? 'IA...' : 'ASISTENCIA IA'}
              </button>
            </div>
            <textarea
              rows={2}
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm leading-relaxed"
              placeholder="Notas del test..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
              isDeceased ? 'bg-red-600 hover:bg-red-700' :
              type === 'START' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{type === 'START' ? 'CONFIRMAR REGISTRO' : 'CONFIRMAR CIERRE'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const DatabaseView = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    googleSheetsService.fetchAllData().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="glass rounded-[2rem] overflow-hidden shadow-2xl animate-slide-up">
      <div className="px-6 py-5 bg-white/40 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Registro General</h2>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Sincronizado con Sheet</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
           <span className="text-xs font-bold text-slate-700">{data.length} Animales</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Raza</th>
              <th className="px-6 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Lugar</th>
              <th className="px-6 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Peso</th>
              <th className="px-6 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Fecha</th>
              <th className="px-6 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="inline-block w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></td></tr>
            ) : data.map((row, idx) => (
              <tr key={idx} className="group hover:bg-white/60 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-xs font-black text-slate-900">{row.animalId}</span>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-700">{row.breed}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-600">G: {row.shed}</span>
                    <span className="text-[9px] text-slate-400 font-medium">C: {row.pen}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-black text-indigo-600">{row.weight}</td>
                <td className="px-6 py-4 text-[10px] font-semibold text-slate-500">{row.date}</td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    row.status === TestStatus.COMPLETED 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {row.status === TestStatus.COMPLETED ? 'Finalizado' : 'En Curso'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout title="Control Ganadero"><Dashboard /></Layout>} />
        <Route path="/start" element={<Layout title="Registro Ingreso" onBack={() => window.history.back()}><TestForm type="START" /></Layout>} />
        <Route path="/end" element={<Layout title="Cierre Ciclo" onBack={() => window.history.back()}><TestForm type="END" /></Layout>} />
        <Route path="/database" element={<Layout title="Histórico" onBack={() => window.history.back()}><DatabaseView /></Layout>} />
      </Routes>
    </HashRouter>
  );
};

export default App;
