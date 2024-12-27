import React from "react";
import { useTaskQueue } from "./use-task-queue";

function App() {
  const [tasksToAdd, setTasksToAdd] = React.useState(20);
  const [threads, setThreads] = React.useState(4);
  const queue = useTaskQueue({ threads });

  function addTasks() {
    for (let i = 0; i < tasksToAdd; i++) {
      queue.add(simpleTimer(Math.random() * 20000));
    }
  }

  return (
    <main className="p-4 space-y-5">
      <h1 className="text-lg">
        Add tasks to the queue to see them run concurrently.
      </h1>
      <Controls
        threads={threads}
        setThreads={setThreads}
        tasksToAdd={tasksToAdd}
        setTasksToAdd={setTasksToAdd}
        addTasks={addTasks}
      />
      <Tasks tasks={queue.tasks} />
    </main>
  );
}

function Controls({
  threads,
  setThreads,
  tasksToAdd,
  setTasksToAdd,
  addTasks,
}) {
  return (
    <div className="flex gap-8">
      <div className="flex gap-2 items-center">
        <input
          type="number"
          className="border px-4 py-1 rounded-md w-20"
          value={tasksToAdd}
          onChange={(e) => setTasksToAdd(e.target.value)}
        />
        <button
          className="border px-4 py-1 rounded-md cursor-pointer"
          onClick={addTasks}
        >
          add tasks
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <label>set max threads:</label>
        <input
          type="number"
          className="border px-4 py-1 rounded-md w-20"
          value={threads}
          onChange={(e) => setThreads(e.target.value)}
        />
      </div>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {import('./use-task-queue').TaskState[]} props.tasks
 * @returns {React.ReactElement}
 */
function Tasks({ tasks = [] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {tasks.map((t) => (
        <Task key={t.id} {...t} />
      ))}
    </div>
  );
}

/**
 * @param {import('./use-task-queue').TaskState} props
 * @returns {React.ReactElement}
 */
function Task({ running, complete, error }) {
  return (
    <div className="flex border rounded-md size-20 justify-center items-center overflow-hidden">
      {running && (
        <div className="size-10 border-2 border-l-0 rounded-full animate-spin" />
      )}
      {complete && !error && <div className="size-full bg-green-500" />}
      {complete && error && <div className="size-full bg-red-500" />}
    </div>
  );
}

export default App;

function simpleTimer(ms) {
  return async () => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
}
