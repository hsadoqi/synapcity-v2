import type { Project, Task } from '@synapcity/domain-prototypes';
import { Checkbox } from '@synapcity/frontend-ui/core/checkbox';
import { cn } from '@synapcity/frontend-ui/lib/utils';

import { WidgetEmpty } from '../widget-states';

export function TasksBody({
  project,
  tasks,
  onToggleTask,
}: {
  project: Project;
  tasks: readonly Task[];
  onToggleTask: (taskId: string) => void;
}) {
  if (tasks.length === 0) return <WidgetEmpty>No tasks yet.</WidgetEmpty>;
  return (
    <ul
      aria-label={project.name}
      className="m-0 flex list-none flex-col gap-1.5 p-0"
    >
      {tasks.map((task) => (
        <li key={task.id}>
          <label className="flex cursor-pointer items-center gap-2 py-1">
            <Checkbox
              checked={task.done}
              onCheckedChange={() => onToggleTask(task.id)}
            />
            <span
              className={cn(
                'flex-1 text-sm text-foreground',
                task.done && 'text-muted-foreground line-through',
              )}
            >
              {task.name}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
