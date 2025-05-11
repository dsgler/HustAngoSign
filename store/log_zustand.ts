import { create } from 'zustand';

type LogRowType = {
  time: string;
  tags?: string[];
  messages: string | string[];
};

type LogStateType = {
  logs: LogRowType[];
};

type LogActionType = {
  addLog: (message: string | string[], tags?: string | string[]) => void;
};

export const useLog = create<LogStateType & LogActionType>((set) => ({
  logs: [],
  addLog(message: string | string[], tags?: string | string[]) {
    const newLog: LogRowType = {
      time: new Date().toLocaleTimeString(),
      messages: message,
      tags: typeof tags === 'string' ? [tags] : tags,
    };
    set((state) => ({ logs: [...state.logs, newLog] }));
  },
}));

export function formatLog(logRow: LogRowType) {
  return `[${logRow.time}] [${logRow.tags?.join('] [') ?? ''}] ${typeof logRow.messages === 'string' ? logRow.messages : logRow.messages.join(' ')}`;
}
