import type { PrototypeRecords, RecordContext, Task } from '../../types';
import { newRecord } from '../new-record';
import { putRecord, touchRecord } from '../record-tables';

export function tasksForProject(
  tasks: PrototypeRecords['task'],
  projectId: string,
): Task[] {
  return Object.values(tasks)
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Adds a task at the end of a project. A blank name or an unknown project
 * returns `records` unchanged.
 */
export function addTask(
  records: PrototypeRecords,
  projectId: string,
  name: string,
  ctx: RecordContext,
): PrototypeRecords {
  const trimmed = name.trim();
  if (!trimmed || !records.project[projectId]) return records;
  const order = tasksForProject(records.task, projectId).reduce(
    (next, t) => Math.max(next, t.order + 1),
    0,
  );
  return putRecord(records, 'task', {
    ...newRecord('task', trimmed, ctx),
    projectId,
    done: false,
    order,
  });
}

/**
 * Flips a task's completion. Completing a task records an activity, so the
 * activity feed comes from real changes rather than widget-local copies.
 */
export function toggleTask(
  records: PrototypeRecords,
  taskId: string,
  ctx: RecordContext,
): PrototypeRecords {
  const task = records.task[taskId];
  if (!task) return records;
  const done = !task.done;
  let next = putRecord(records, 'task', {
    ...touchRecord(task, ctx.now),
    done,
  });
  if (done) {
    next = putRecord(next, 'activity', {
      ...newRecord('activity', `Completed "${task.name}"`, ctx),
      occurredAt: new Date(ctx.now).toISOString(),
      subject: { kind: 'task', id: task.id },
    });
  }
  return next;
}
