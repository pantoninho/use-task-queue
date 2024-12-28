import React from "react";

/**
 * react hook that queues asynchronous tasks and runs them concurrently
 * @param {Object} [params]
 * @param {number} [params.concurrent=5] maximum number of concurrent tasks
 * @returns {TaskQueue}
 */
export function useTaskQueue({ concurrent = Infinity } = {}) {
  /** @type {useState<Task[]>} */
  const [activeTasks, setActiveTasks] = React.useState([]);
  /** @type {useState<Task[]>} */
  const [queue, setQueue] = React.useState([]);
  /** @type {useState<TaskState[]>} */
  const [tasks, setTasks] = React.useState([]);

  function updateTaskState(id, state) {
    setTasks((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, ...state } : t)),
    );
  }

  React.useEffect(() => {
    if (activeTasks.length >= concurrent) return;

    const task = queue.shift();
    if (!task) return;

    updateTaskState(task.id, { running: true });
    task
      .run()
      .then((data) => {
        task.onComplete(data);
        updateTaskState(task.id, { data });
      })
      .catch((error) => {
        task.onError(error);
        updateTaskState(task.id, { error });
      })
      .finally(() => {
        updateTaskState(task.id, { running: false, complete: true });
        setActiveTasks((prev) => prev.filter((t) => t.id !== task.id));
      });

    setActiveTasks((prev) => [...prev, task]);
  }, [queue, activeTasks, concurrent]);

  return {
    tasks,
    /**
     * adds a task to the queue
     * @param {Function} fn function to be executed
     * @returns {Promise<unknown>} promise that resolves to the result of the task. rejects if the task throws an error
     */
    add: async (fn) => {
      return new Promise((resolve, reject) => {
        const task = {
          id: crypto.randomUUID(),
          run: fn,
          onComplete: resolve,
          onError: reject,
        };

        const taskState = {
          id: task.id,
          running: false,
          data: null,
          error: null,
        };

        setTasks((prev) => [...prev, taskState]);
        setQueue((prev) => [...prev, task]);
      });
    },
  };
}

/**
 * @typedef {Object} TaskQueue
 * @property {Function} add
 * @property {TaskState[]} tasks
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {() => Promise<unknown>} run
 * @property {Function} onComplete
 * @property {Function} onError
 */

/**
 * @typedef {Object} TaskState
 * @property {string} id
 * @property {boolean} running
 * @property {boolean} complete
 * @property {unknown} data
 * @property {unknown} error
 */

/**
 * @template T
 * @typedef {ReturnType<typeof import("react").useState<T>>} useState
 */
