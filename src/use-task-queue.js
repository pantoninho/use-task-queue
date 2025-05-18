import React from "react";

/**
 * react hook that queues asynchronous tasks and runs them concurrently
 * @param {Object} [params]
 * @param {number} [params.concurrent=5] maximum number of concurrent tasks
 * @param {number} [params.retries=0] number of retries for failed tasks
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
      tasks.map((t) => (t.id === id ? { ...t, ...state } : t))
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
        updateTaskState(task.id, { data, running: false, complete: true });
      })
      .catch((error) => {
        if (task.retries <= 0) {
          task.onError(error);
          updateTaskState(task.id, { error });
          return;
        }
        setQueue((prev) => [...prev, { ...task, retries: task.retries - 1 }]);
      })
      .finally(() => {
        setActiveTasks((prev) => prev.filter((t) => t.id !== task.id));
      });

    setActiveTasks((prev) => [...prev, task]);
  }, [queue, activeTasks, concurrent]);

  return {
    tasks,
    add: async (fn, { retries = 0 } = {}) => {
      return new Promise((resolve, reject) => {
        const task = {
          id: crypto.randomUUID(),
          run: fn,
          onComplete: resolve,
          onError: reject,
          retries,
        };

        const taskState = {
          id: task.id,
          running: false,
          data: null,
          error: null,
          complete: false,
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
 * @property {number?} retries
 */

/**
 * @typedef {Object} TaskState
 * @property {string} id
 * @property {boolean} running
 * @property {boolean} complete
 * @property {unknown} data
 * @property {unknown} error
 * @property {number} retries
 */

/**
 * @template T
 * @typedef {ReturnType<typeof import("react").useState<T>>} useState
 */
