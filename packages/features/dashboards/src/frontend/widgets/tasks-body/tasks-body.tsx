import { useState } from 'react';

import type { Project, Task } from '@synapcity/domain-prototypes';
import { Button } from '@synapcity/frontend-ui/core/button';
import { Checkbox } from '@synapcity/frontend-ui/core/checkbox';
import { Input } from '@synapcity/frontend-ui/core/input';
import { cn } from '@synapcity/frontend-ui/lib/utils';

import { WidgetEmpty } from '../widget-states';

export function TasksBody({
  project,
  tasks,
  onToggleTask,
  onAddTask,
}: {
  project: Project;
  tasks: readonly Task[];
  onToggleTask: (taskId: string) => void;
  onAddTask?: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {tasks.length === 0 ? (
        <WidgetEmpty>No tasks yet.</WidgetEmpty>
      ) : (
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
      )}
      {onAddTask && <AddTaskForm onAdd={onAddTask} />}
    </div>
  );
}

function AddTaskForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd(name);
        setName('');
      }}
    >
      <Input
        aria-label="New task"
        placeholder="New task"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="min-w-0 flex-1"
      />
      <Button type="submit" variant="outline" size="sm">
        Add
      </Button>
    </form>
  );
}
