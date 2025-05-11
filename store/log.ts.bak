import { useImmer } from 'use-immer';

export function useLog() {
  const [logs, updateLogs] = useImmer<string[]>([]);

  const addLog = (message: string | string[], userId?: string) => {
    updateLogs((logs) => {
      logs.push(
        `[${new Date().toLocaleTimeString()}] ${userId ?? ''}: ${Array.isArray(message) ? message.join(' ') : message}`,
      );
    });
  };

  return { logs, addLog };
}
