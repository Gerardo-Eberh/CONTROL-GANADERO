
import { TestEntry, TestStatus } from '../types';

const SHEET_ID = '1caHz2oGQUzpOCdkJlzLYk7aLAdGk5La5c948Z_y87MI';
const GID = '2118275156';
const REGISTRY_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

// URL de tu Google Apps Script (Debe ser configurada para escritura real)
const APPS_SCRIPT_URL = ''; 

export interface RegistryAnimal {
  id: string;
  breed: string;
  mother: string;
  father: string;
  birthDate: string;
  isDeceased?: boolean;
}

const LOCAL_STORAGE_KEY = 'ganaderia_db_v1';

export const googleSheetsService = {
  // Guardar localmente para que el usuario vea sus cambios de inmediato
  saveLocally(data: Partial<TestEntry>) {
    const existing = this.getLocalEntries();
    const newEntry = {
      ...data,
      id: crypto.randomUUID(), // ID único para manejo local
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newEntry, ...existing]));
    return newEntry;
  },

  getLocalEntries(): any[] {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  clearLocalData() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  },

  async loadRegistry(): Promise<RegistryAnimal[]> {
    try {
      const response = await fetch(REGISTRY_CSV_URL);
      if (!response.ok) throw new Error('No se pudo acceder a la hoja de registro');
      const text = await response.text();
      return this.parseRegistryCSV(text);
    } catch (error) {
      console.error('Error cargando registro:', error);
      return [];
    }
  },

  parseRegistryCSV(text: string): RegistryAnimal[] {
    const lines = text.split('\n');
    const result: RegistryAnimal[] = [];
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.trim().replace(/^"|"$/g, ''));
      if (columns.length >= 2) {
        result.push({
          birthDate: columns[0] || '-',
          id: columns[1],
          breed: columns[9] || '-',
          mother: columns[6] || '-',
          father: columns[5] || '-'
        });
      }
    }
    return result;
  },

  async saveStartTest(data: Partial<TestEntry>) {
    this.saveLocally({ ...data, status: TestStatus.IN_PROGRESS });
    
    if (APPS_SCRIPT_URL) {
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ ...data, type: 'START' })
        });
      } catch (e) {
        console.error("Error al sincronizar con Google Sheets", e);
      }
    }
    return { success: true };
  },

  async saveEndTest(data: Partial<TestEntry>) {
    this.saveLocally({ ...data, status: TestStatus.COMPLETED });
    
    if (APPS_SCRIPT_URL) {
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ ...data, type: 'END' })
        });
      } catch (e) {
        console.error("Error al sincronizar con Google Sheets", e);
      }
    }
    return { success: true };
  },

  async lookupAnimal(fullId: string) {
    const registry = await this.loadRegistry();
    const normalizedTarget = fullId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const animal = registry.find(a => a.id && a.id.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedTarget);
    return animal || null;
  },

  async searchAnimals(query: string, prefix: string): Promise<RegistryAnimal[]> {
    if (!query) return [];
    const registry = await this.loadRegistry();
    const combined = (prefix + query).toLowerCase();
    return registry.filter(a => a.id && a.id.toLowerCase().includes(combined)).slice(0, 5);
  },

  async fetchAllData(): Promise<TestEntry[]> {
    // Retorna los datos que el usuario ha ido cargando
    return this.getLocalEntries();
  },

  exportToCSV(data: any[], fileName: string) {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
