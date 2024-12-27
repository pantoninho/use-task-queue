import React from "react";

/**
 * react hook that queues asynchronous tasks and runs them concurrently
 * @param {Object} [params]
 * @param {number} [params.threads=5] maximum number of concurrent tasks
 * @returns {TaskQueue}
 */
export function useTaskQueue({ threads = 5 } = {}) {
  /** @type {useState<Task[]>} */
  const [activeThreads, setActiveThreads] = React.useState([]);
  /** @type {useState<Task[]>} */
  const [queue, setQueue] = React.useState([]);

  React.useEffect(() => {
    if (activeThreads.length >= threads) return;

    const job = queue.shift();
    if (!job) return;

    job
      .run()
      .then(job.onComplete)
      .catch(job.onError)
      .then(() =>
        setActiveThreads((prev) => prev.filter((t) => t.id !== job.id)),
      );

    setActiveThreads((prev) => [...prev, job]);
  }, [queue, activeThreads, threads]);

  return {
    /**
     * adds a task to the queue
     * @param {Function} fn function to be executed
     * @returns {Promise<unknown>} promise that resolves to the result of the task. rejects if the task throws an error
     */
    add: async (fn) => {
      return new Promise((resolve, reject) => {
        const job = {
          id: crypto.randomUUID(),
          run: fn,
          onComplete: resolve,
          onError: reject,
        };

        setQueue((prev) => [...prev, job]);
      });
    },
  };
}

/**
 * @typedef {Object} TaskQueue
 * @property {Function} add
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {Function} run
 * @property {Function} onComplete
 * @property {Function} onError
 */

/**
 * @template T
 * @typedef {ReturnType<typeof import("react").useState<T>>} useState
 */
