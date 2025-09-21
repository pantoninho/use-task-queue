## use-task-queue

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/955f6703a28f418bb434f7bf147da1b9)](https://app.codacy.com/gh/pantoninho/use-task-queue?utm_source=github.com&utm_medium=referral&utm_content=pantoninho/use-task-queue&utm_campaign=Badge_Grade)

React hook for queueing asynchronous tasks with configurable concurrency and per-task retries.

### Installation

```bash
npm install use-task-queue
# or
yarn add use-task-queue
# or
pnpm add use-task-queue
# or
bun add use-task-queue
```

### Usage

Basic example using a concurrency limit of 3 and per-task retries:

```tsx
import React from "react";
import { useTaskQueue } from "use-task-queue";

export function Example() {
  const { tasks, add } = useTaskQueue({ concurrent: 3 });

  const enqueueWork = React.useCallback(() => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < 10; i++) {
      add(async () => {
        await sleep(300 + Math.random() * 700);
        if (Math.random() < 0.2) throw new Error("random failure");
        return { index: i };
      }, { retries: 2 })
        .then((data) => console.log("task complete", data))
        .catch((err) => console.error("task failed", err));
    }
  }, [add]);

  return (
    <div>
      <button onClick={enqueueWork}>Enqueue 10 tasks</button>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            {t.running ? "running" : t.complete ? "done" : "queued"}
            {t.error ? ` – error: ${String(t.error)}` : ""}
            {t.data ? ` – data: ${JSON.stringify(t.data)}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Notes:
- **concurrency**: `useTaskQueue({ concurrent })` limits how many tasks run at once (default: Infinity).
- **retries**: `add(fn, { retries })` re-queues a failing task up to the specified number of retries (default: 0).
- `add(fn)` returns a Promise that resolves/rejects with the task result/error.
