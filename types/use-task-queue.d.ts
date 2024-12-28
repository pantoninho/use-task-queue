interface UseTaskQueueParams {
  concurrent: number;
}

interface TaskState {
  id: string;
  running: boolean;
  complete: boolean;
  error?: unknown;
  data?: unknown;
}

interface TaskQueue {
  tasks: TaskState[];
  add: (fn: () => unknown) => Promise<unknown>;
}

export function useTaskQueue(params: UseTaskQueueParams): TaskQueue;
