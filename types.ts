
export enum TestStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface TestEntry {
  date: string; // Fecha del registro
  animalId: string;
  breed: string;
  weight: number;
  shed: string;
  pen: string;
  mother: string;
  father: string;
  birthDate: string;
  startTime: string;
  endTime?: string;
  status: TestStatus;
  notes: string;
}

export interface FormState {
  date: string;
  tattooPrefix: string;
  animalNumber: string;
  breed: string;
  weight: string;
  shed: string;
  pen: string;
  mother: string;
  father: string;
  birthDate: string;
  notes: string;
}
