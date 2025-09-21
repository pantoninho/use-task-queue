/* @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTaskQueue } from "../src/use-task-queue.js";

describe.sequential("useTaskQueue", () => {
  it("runs a single task and updates state on success", async () => {
    const { result } = renderHook(() => useTaskQueue());

    const promise = result.current.add(async () => "ok");
    const output = await promise;

    expect(output).toBe("ok");

    await waitFor(() => {
      const tasks = result.current.tasks;
      expect(tasks.length).toBe(1);
      const t = tasks[0];
      expect(t.complete).toBe(true);
      expect(t.running).toBe(false);
      expect(t.error).toBe(null);
      expect(t.data).toBe("ok");
    });
  });

  it("enforces concurrency and starts next tasks as slots free up", async () => {
    const { result } = renderHook(() => useTaskQueue({ concurrent: 2 }));

    const d1 = createDeferred();
    const d2 = createDeferred();
    const d3 = createDeferred();
    const d4 = createDeferred();

    // Kick off 4 tasks; only 2 should run initially
    await act(async () => {
      void result.current.add(() => d1.promise);
      void result.current.add(() => d2.promise);
      void result.current.add(() => d3.promise);
      void result.current.add(() => d4.promise);
    });

    await waitFor(() => {
      const running = result.current.tasks.filter((t) => t.running).length;
      expect(running).toBe(2);
    });

    // Resolve one; the third should start running to keep concurrency at 2
    await act(async () => {
      d1.resolve("a1");
    });

    await waitFor(() => {
      const running = result.current.tasks.filter((t) => t.running).length;
      const complete = result.current.tasks.filter((t) => t.complete).length;
      expect(running).toBe(2);
      expect(complete).toBe(1);
    });

    // Resolve remaining
    await act(async () => {
      d2.resolve("a2");
      d3.resolve("a3");
      d4.resolve("a4");
    });

    await waitFor(() => {
      const tasks = result.current.tasks;
      const complete = tasks.filter((t) => t.complete).length;
      const running = tasks.filter((t) => t.running).length;
      expect(complete).toBe(4);
      expect(running).toBe(0);
    });
  });

  it("retries failed task until success", async () => {
    const { result } = renderHook(() => useTaskQueue({ concurrent: 1 }));

    let attempts = 0;
    const value = await result.current.add(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("fail");
        }
        return "success";
      },
      { retries: 2 }
    );

    expect(value).toBe("success");
    expect(attempts).toBe(3);

    await waitFor(() => {
      const t = result.current.tasks[0];
      expect(t.complete).toBe(true);
      expect(t.error).toBe(null);
      expect(t.data).toBe("success");
    });
  });

  it("propagates error after retries are exhausted", async () => {
    const { result } = renderHook(() => useTaskQueue({ concurrent: 1 }));

    /** @type {unknown} */
    let caught;
    try {
      await result.current.add(
        async () => {
          throw new Error("always");
        },
        { retries: 2 }
      );
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(Error);

    await waitFor(() => {
      const t = result.current.tasks[0];
      expect(t.running).toBe(false);
      expect(t.complete).toBe(false);
      expect(t.error).toBeTruthy();
    });
  });
});




function createDeferred() {
    /** @type {(value: unknown) => void} */
    let resolve;
    /** @type {(reason?: unknown) => void} */
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    // @ts-ignore - initialized above
    return { promise, resolve, reject };
  }
