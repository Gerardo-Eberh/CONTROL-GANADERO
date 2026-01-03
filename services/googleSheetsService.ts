
import { TestEntry, TestStatus } from '../types';

const SHEET_ID = '1caHz2oGQUzpOCdkJlzLYk7aLAdGk5La5c948Z_y87MI';
const GID = '2118275156';
const REGISTRY_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

// Nueva Hoja de Bajas
const BAJAS_SHEET_ID = '1oLCMGGMg6yzOPaRPUrVamLUjPXEKk0S814iOoxYoevc';
const BAJAS_CSV_URL = `https://docs.google.com/spreadsheets/d/${BAJAS_SHEET_ID}/export?format=csv&gid=0`;

export interface RegistryAnimal {
  id: string;
  breed: string;
  mother: string;
  father: string;
  birthDate: string;
  isDeceased?: boolean;
}

let animalRegistryCache: RegistryAnimal[] | null = null;
let deceasedCache: Set<string> | null = null;

// Función auxiliar para normalizar IDs (quitar guiones, espacios y pasar a minúsculas)
const normalizeId = (id: string) => id.toLowerCase().replace(/[^a-z0-9]/g, '');

export const googleSheetsService = {
  parseRegistryCSV(text: string): RegistryAnimal[] {
    const lines = text.split('\n');
    const result: RegistryAnimal[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.trim().replace(/^"|"$/g, ''));
      
      if (columns.length >= 2) {
        result.push({
          birthDate: columns[0] || '-',   // Col A
          id: columns[1],                 // Col B (Identificación)
          breed: columns[9] || '-',       // Col J
          mother: columns[6] || '-',      // Col G
          father: columns[5] || '-'       // Col F
        });
      }
    }
    return result;
  },

  parseDeceasedCSV(text: string): Set<string> {
    const lines = text.split('\n');
    const deceasedIds = new Set<string>();
    
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.trim().replace(/^"|"$/g, ''));
      
      // Columnas B(1), D(3), F(5), H(7) según el usuario
      const indices = [1, 3, 5, 7];
      indices.forEach(idx => {
        if (columns[idx]) {
          deceasedIds.add(normalizeId(columns[idx]));
        }
      });
    }
    return deceasedIds;
  },

  async loadDeceasedRegistry(): Promise<Set<string>> {
    if (deceasedCache) return deceasedCache;
    try {
      const response = await fetch(BAJAS_CSV_URL);
      if (!response.ok) throw new Error('No se pudo acceder a la hoja de Bajas');
      const text = await response.text();
      deceasedCache = this.parseDeceasedCSV(text);
      return deceasedCache;
    } catch (error) {
      console.error('Error cargando registro de Bajas:', error);
      return new Set();
    }
  },

  async loadRegistry(): Promise<RegistryAnimal[]> {
    if (animalRegistryCache) return animalRegistryCache;
    
    try {
      const response = await fetch(REGISTRY_CSV_URL);
      if (!response.ok) throw new Error('No se pudo acceder a la hoja de registro');
      const text = await response.text();
      animalRegistryCache = this.parseRegistryCSV(text);
      return animalRegistryCache;
    } catch (error) {
      console.error('Error cargando registro de Drive:', error);
      return [];
    }
  },

  async saveStartTest(data: Partial<TestEntry>) {
    console.log('Sincronizando Inicio con Google Sheets...', data);
    await new Promise(r => setTimeout(r, 800));
    return { success: true };
  },

  async saveEndTest(data: Partial<TestEntry>) {
    console.log('Sincronizando Fin con Google Sheets...', data);
    await new Promise(r => setTimeout(r, 800));
    return { success: true };
  },

  async lookupAnimal(fullId: string) {
    const registry = await this.loadRegistry();
    const deceasedIds = await this.loadDeceasedRegistry();
    const normalizedTarget = normalizeId(fullId);
    
    // Primero verificar si está muerto
    if (deceasedIds.has(normalizedTarget)) {
      const baseAnimal = registry.find(a => a.id && normalizeId(a.id) === normalizedTarget);
      return {
        ...(baseAnimal || { id: fullId, breed: 'Desconocida', mother: '-', father: '-', birthDate: '-' }),
        isDeceased: true
      };
    }

    // Buscar en registro normal
    const animal = registry.find(a => a.id && normalizeId(a.id) === normalizedTarget);
    return animal ? { ...animal, isDeceased: false } : null;
  },

  async searchAnimals(query: string, prefix: string): Promise<RegistryAnimal[]> {
    if (!query) return [];
    const registry = await this.loadRegistry();
    const deceasedIds = await this.loadDeceasedRegistry();
    
    const combinedQuery = normalizeId(prefix + query);
    const simpleQuery = normalizeId(query);
    
    return registry
      .filter(a => {
        if (!a.id) return false;
        const normalizedId = normalizeId(a.id);
        return normalizedId.includes(combinedQuery) || normalizedId.includes(simpleQuery);
      })
      .map(a => ({
        ...a,
        isDeceased: deceasedIds.has(normalizeId(a.id))
      }))
      .sort((a, b) => {
        const aMatch = normalizeId(a.id).startsWith(normalizeId(prefix));
        const bMatch = normalizeId(b.id).startsWith(normalizeId(prefix));
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      })
      .slice(0, 5); 
  },

  async fetchAllData(): Promise<TestEntry[]> {
    return [
      { 
        date: new Date().toISOString().split('T')[0],
        animalId: 'Ejemplo',
        breed: 'Angus',
        weight: 350,
        shed: 'G1',
        pen: 'C1',
        mother: '-',
        father: '-',
        birthDate: '-',
        startTime: new Date().toISOString(), 
        status: TestStatus.IN_PROGRESS, 
        notes: 'Sincronización activa.' 
      }
    ];
  },

  exportToCSV(data: any[], fileName: string) {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
