
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import NavigationCard from './components/NavigationCard';
import { TestStatus, FormState, TestEntry } from './types';
import { googleSheetsService, RegistryAnimal } from './services/googleSheetsService';
import { analyzeAnimalPerformance } from './services/geminiService';

interface NavigationAction {
  title: string;
  description: string;
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
      description: 'Registro de ingreso y pesaje inicial.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      gradient: 'from-indigo-500 to-blue-600',
      path: '/start',
      delay: 'stagger-1'
    },
    {
      title: 'Fin de Test',
      description: 'Cierre de ciclo y pesaje final.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      gradient: 'from-emerald-500 to-teal-600',
      path: '/end',
      delay: 'stagger-2'
    }
  ];

  const secondaryActions: NavigationAction[] = [
    {
      title: 'Abrir Base de Datos',
      description: 'Ver todos los registros guardados en este dispositivo.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zM9 12h6M9 16h6" /></svg>,
      gradient: 'from-violet-500 to-purple-600',
      path: '/database',
      delay: 'stagger-3'
    },
    {
      title: 'Exportar Base de Datos',
      description: 'Descargar historial completo en CSV.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
      gradient: 'from-slate-700 to-slate-900',
      delay: 'stagger-4',
      onClick: async () => {
        const data = await googleSheetsService.fetchAllData();
        googleSheetsService.exportToCSV(data, 'DB_Completa');
      }
    },
    {
      title: 'Exportar T-Start',
      description: 'Solo registros de pesaje inicial.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>,
      gradient: 'from-pink-500 to-rose-600',
      delay: 'stagger-5',
      onClick: async () => {
        const data = await googleSheetsService.fetchAllData();
        const filtered = data.filter(d => d.status === TestStatus.IN_PROGRESS);
        googleSheetsService.exportToCSV(filtered, 'T_Start');
      }
    },
    {
      title: 'Exportar T-End',
      description: 'Solo registros de pesaje final.',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      gradient: 'from-amber-500 to-orange-600',
      delay: 'stagger-6',
      onClick: async () => {
        const data = await googleSheetsService.fetchAllData();
        const filtered = data.filter(d => d.status === TestStatus.COMPLETED);
        googleSheetsService.exportToCSV(filtered, 'T_End');
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
          <span className="pr-3 bg-transparent text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operaciones de Datos</span>
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
  const [aiDiagnostic, setAiDiagnostic] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(type === 'START');
  const [suggestions, setSuggestions] = useState<RegistryAnimal[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const numberInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);
  
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
        } else {
          setAnimalFound(false);
        }
        setLookupLoading(false);
      } else {
        setAnimalFound(null);
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
    setShowSuggestions(false);
    setAiDiagnostic('');
    setTimeout(() => weightInputRef.current?.focus(), 50);
  };

  const handleAiDiagnostic = async () => {
    if (!form.weight || !form.breed) {
      alert("Se requiere peso y raza para el análisis técnico.");
      return;
    }
    setAiLoading(true);
    const diagnostic = await analyzeAnimalPerformance({
      animalId: `${form.tattooPrefix}${form.animalNumber}`,
      breed: form.breed,
      weight: form.weight,
      birthDate: form.birthDate
    });
    setAiDiagnostic(diagnostic);
    setForm(prev => ({ ...prev, notes: diagnostic }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const animalId = `${form.tattooPrefix}${form.animalNumber}`;
      const data: Partial<TestEntry> = {
        date: form.date,
        animalId,
        breed: form.breed,
        weight: parseFloat(form.weight),
        shed: form.shed,
        pen: form.pen,
        mother: form.mother,
        father: form.father,
        birthDate: form.birthDate,
        notes: form.notes || 'Registro directo.',
        startTime: new Date().toISOString(),
        status: type === 'START' ? TestStatus.IN_PROGRESS : TestStatus.COMPLETED
      };
      
      if (type === 'START') {
        await googleSheetsService.saveStartTest(data);
      } else {
        await googleSheetsService.saveEndTest(data);
      }
      
      setSuccessMsg(true);
      setAiDiagnostic('');
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
      setTimeout(() => setSuccessMsg(false), 3000);
      setTimeout(() => numberInputRef.current?.focus(), 100);
    } catch (err) {
      alert('Error al guardar el registro');
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
            <span className="font-black text-sm uppercase tracking-widest">¡Guardado Exitosamente!</span>
          </div>
        </div>
      )}

      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass max-w-md w-full p-8 rounded-[2rem] shadow-2xl border border-white/20 animate-slide-up">
            <h3 className="text-xl font-black text-slate-900 mb-1">Configuración de Sesión</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Define los parámetros fijos para esta tanda de carga.</p>
            <form onSubmit={handleConfigConfirm} className="space-y-4">
              <input
                required
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-black text-xl text-indigo-600 tracking-tighter"
                placeholder="Prefijo (Ej: ABC-)"
                value={form.tattooPrefix}
                onChange={e => setForm(p => ({ ...p, tattooPrefix: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  placeholder="Galpón"
                  value={form.shed}
                  onChange={e => setForm(p => ({ ...p, shed: e.target.value }))}
                />
                <input
                  required
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  placeholder="Corral"
                  value={form.pen}
                  onChange={e => setForm(p => ({ ...p, pen: e.target.value }))}
                />
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-extrabold text-md transition-all shadow-xl">CONTINUAR</button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto glass rounded-[2rem] p-8 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${type === 'START' ? 'from-indigo-500 to-blue-600' : 'from-emerald-500 to-teal-600'}`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">{type === 'START' ? 'Registro Ingreso' : 'Cierre de Ciclo'}</h2>
          </div>
          <button
            type="button"
            onClick={handleAiDiagnostic}
            disabled={aiLoading || !form.animalNumber || !form.weight}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-indigo-600 transition-all disabled:opacity-30 shadow-lg"
          >
            <svg className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {aiLoading ? 'ANALIZANDO...' : 'DIAGNÓSTICO IA'}
          </button>
        </div>

        {aiDiagnostic && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl animate-fadeIn">
             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Diagnóstico Técnico:</p>
             <p className="text-indigo-900 font-bold text-sm italic">"{aiDiagnostic}"</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Identificación</label>
              <div className="flex border-2 border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-all bg-white/50 relative">
                <div className="bg-slate-100 px-3 flex items-center justify-center border-r border-slate-200 min-w-[60px]">
                  <span className="text-[10px] font-black text-slate-500 uppercase">{form.tattooPrefix || '-'}</span>
                </div>
                <input
                  required
                  ref={numberInputRef}
                  type="text"
                  autoComplete="off"
                  className="w-full px-4 py-3 bg-transparent outline-none font-black text-indigo-600"
                  placeholder="Número..."
                  value={form.animalNumber}
                  onChange={e => {
                    setForm(p => ({ ...p, animalNumber: e.target.value }));
                    setShowSuggestions(true);
                  }}
                  onFocus={() => form.animalNumber && setShowSuggestions(suggestions.length > 0)}
                />
                {lookupLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 glass rounded-xl shadow-xl border border-white/40 overflow-hidden w-[250px] mt-1">
                  {suggestions.map((animal) => (
                    <button key={animal.id} type="button" onClick={() => selectSuggestion(animal)} className="w-full flex flex-col px-4 py-2 hover:bg-white text-left border-b border-slate-100 last:border-0">
                      <span className="text-sm font-black text-slate-900">{animal.id}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{animal.breed}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                ref={weightInputRef}
                className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-black text-indigo-600 text-xl"
                placeholder="0.0"
                value={form.weight}
                onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Raza</label>
              <input
                required
                className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800"
                placeholder="Angus..."
                value={form.breed}
                onChange={e => setForm(p => ({ ...p, breed: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha</label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="text-white font-extrabold text-[10px] uppercase tracking-widest">Información de Origen</h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div><span className="text-[8px] font-bold text-slate-400 uppercase">Madre</span><p className="text-white font-bold text-xs truncate">{form.mother}</p></div>
              <div><span className="text-[8px] font-bold text-slate-400 uppercase">Padre</span><p className="text-white font-bold text-xs truncate">{form.father}</p></div>
              <div><span className="text-[8px] font-bold text-slate-400 uppercase">Nacimiento</span><p className="text-white font-bold text-xs truncate">{form.birthDate}</p></div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl text-white font-black text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${type === 'START' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : (
              <>
                <span>GUARDAR REGISTRO</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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

  const handleClear = () => {
    if (confirm("¿Estás seguro de que quieres vaciar la base de datos local?")) {
      googleSheetsService.clearLocalData();
      setData([]);
    }
  };

  return (
    <div className="glass rounded-[2rem] overflow-hidden shadow-2xl animate-slide-up">
      <div className="px-8 py-6 bg-white/40 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Base de Datos Local</h2>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Registros en este dispositivo</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleClear} className="px-4 py-2 bg-red-50 text-red-600 text-[10px] font-black rounded-xl hover:bg-red-100 transition-all border border-red-100">VACIAR BASE</button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             <span className="text-xs font-bold text-slate-700">{data.length} Registros</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Animal ID</th>
              <th className="px-6 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Tipo</th>
              <th className="px-6 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Peso</th>
              <th className="px-6 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Galpón/Corral</th>
              <th className="px-6 py-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Diagnóstico IA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {loading ? (
              <tr><td colSpan={5} className="px-8 py-12 text-center font-bold text-slate-400">Cargando datos...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="px-8 py-12 text-center font-bold text-slate-400 italic">No hay registros guardados aún.</td></tr>
            ) : data.map((row, idx) => (
              <tr key={idx} className="group hover:bg-white/60 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900">{row.animalId}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{row.breed}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${row.status === TestStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {row.status === TestStatus.COMPLETED ? 'Finalizado' : 'En Inicio'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm font-black text-indigo-600">{row.weight} kg</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-600">G: {row.shed}</span>
                    <span className="text-[10px] font-bold text-slate-600">C: {row.pen}</span>
                  </div>
                </td>
                <td className="px-6 py-5 max-w-[250px]">
                  <p className="text-[10px] font-medium text-slate-500 italic line-clamp-2">{row.notes}</p>
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
        <Route path="/database" element={<Layout title="Historial" onBack={() => window.history.back()}><DatabaseView /></Layout>} />
      </Routes>
    </HashRouter>
  );
};

export default App;
