// ============================================================
// PetroVision — Process Store (Live Data + Instruments)
// ============================================================

import { create } from 'zustand';
import type { 
  ChemicalProcess, Instrument, Equipment, 
  PIDLoop, Alarm, Batch, LiveReading 
} from '@/types';

interface ProcessState {
  // Selected process
  activeProcessId: number | null;
  processes: ChemicalProcess[];

  // Instruments & equipment
  instruments: Instrument[];
  equipment: Equipment[];
  pidLoops: PIDLoop[];

  // Live sensor data: tag -> latest reading
  liveData: Record<string, LiveReading>;

  // Alarms
  activeAlarms: Alarm[];
  alarmCount: number;

  // Batches
  activeBatch: Batch | null;

  // Actions
  setActiveProcess: (id: number) => void;
  setProcesses: (processes: ChemicalProcess[]) => void;
  setInstruments: (instruments: Instrument[]) => void;
  setEquipment: (equipment: Equipment[]) => void;
  setPIDLoops: (loops: PIDLoop[]) => void;
  updateLiveReading: (tag: string, reading: LiveReading) => void;
  updateBulkReadings: (readings: Record<string, LiveReading>) => void;
  setActiveAlarms: (alarms: Alarm[]) => void;
  addAlarm: (alarm: Alarm) => void;
  setActiveBatch: (batch: Batch | null) => void;
}

export const useProcess = create<ProcessState>()((set) => ({
  activeProcessId: null,
  processes: [],
  instruments: [],
  equipment: [],
  pidLoops: [],
  liveData: {},
  activeAlarms: [],
  alarmCount: 0,
  activeBatch: null,

  setActiveProcess: (id) => set({ activeProcessId: id }),
  setProcesses: (processes) => set({ processes }),
  setInstruments: (instruments) => set({ instruments }),
  setEquipment: (equipment) => set({ equipment }),
  setPIDLoops: (loops) => set({ pidLoops: loops }),

  updateLiveReading: (tag, reading) =>
    set((state) => ({
      liveData: { ...state.liveData, [tag]: reading },
    })),

  updateBulkReadings: (readings) =>
    set((state) => ({
      liveData: { ...state.liveData, ...readings },
    })),

  setActiveAlarms: (alarms) =>
    set({ activeAlarms: alarms, alarmCount: alarms.length }),

  addAlarm: (alarm) =>
    set((state) => ({
      activeAlarms: [alarm, ...state.activeAlarms],
      alarmCount: state.alarmCount + 1,
    })),

  setActiveBatch: (batch) => set({ activeBatch: batch }),
}));
