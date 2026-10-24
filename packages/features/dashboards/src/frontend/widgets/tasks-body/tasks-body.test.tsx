import { tasksForProject } from '@synapcity/domain-prototypes';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { seededWorkspace } from '../../../testing/seed';
import { TasksBody } from './index';

function sample() {
  const { records } = seededWorkspace();
  const project = Object.values(records.project)[0]!;
  return { project, tasks: tasksForProject(records.task, project.id) };
}

describe('TasksBody', () => {
  it("lists the project's tasks in order as checkboxes", () => {
    const { project, tasks } = sample();
    render(
      <TasksBody project={project} tasks={tasks} onToggleTask={() => {}} />,
    );
    const list = screen.getByRole('list', { name: 'Side project: Habit app' });
    const boxes = within(list).getAllByRole('checkbox');
    expect(boxes.map((b) => b.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(
      within(list).getByRole('checkbox', { name: 'Wire up habit streaks' }),
    ).toBeDefined();
  });

  it('toggles a task', () => {
    const { project, tasks } = sample();
    const onToggleTask = vi.fn();
    render(
      <TasksBody project={project} tasks={tasks} onToggleTask={onToggleTask} />,
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Write launch notes' }),
    );
    expect(onToggleTask).toHaveBeenCalledWith(tasks[2]!.id);
  });

  it('says so when there are no tasks', () => {
    render(
      <TasksBody
        project={sample().project}
        tasks={[]}
        onToggleTask={() => {}}
      />,
    );
    expect(screen.getByText('No tasks yet.')).toBeDefined();
  });
});
