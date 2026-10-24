import type { Widget } from '@synapcity/domain-dashboards';
import {
  getRecord,
  tasksForProject,
  type PrototypeRecords,
} from '@synapcity/domain-prototypes';

import { CalendarBody } from '../calendar-body';
import { FeedBody } from '../feed-body';
import { HabitBody } from '../habit-body';
import { NotesBody } from '../notes-body';
import { ProgressBody, type GoalChange } from '../progress-body';
import { StatBody } from '../stat-body';
import { TasksBody } from '../tasks-body';
import { WidgetUnavailable } from '../widget-states';

export type WidgetBodyActions = {
  toggleTask(taskId: string): void;
  toggleHabitDay(habitId: string, day: string): void;
  updateNoteBody(noteId: string, body: string): void;
  updateMetricValue(metricId: string, value: number): void;
  updateGoal(goalId: string, patch: GoalChange): void;
  addTask(projectId: string, name: string): void;
};

/** The body for a widget's type, or a notice when its source record is missing. */
export function WidgetBody({
  widget,
  records,
  now,
  actions,
}: {
  widget: Widget;
  records: PrototypeRecords;
  now: number;
  actions: WidgetBodyActions;
}) {
  switch (widget.type) {
    case 'stat': {
      const metric = getRecord(records, widget.source);
      return metric ? (
        <StatBody
          metric={metric}
          onValueChange={(value) => actions.updateMetricValue(metric.id, value)}
        />
      ) : (
        <WidgetUnavailable kind="metric" />
      );
    }
    case 'progress': {
      const goal = getRecord(records, widget.source);
      return goal ? (
        <ProgressBody
          goal={goal}
          onChange={(patch) => actions.updateGoal(goal.id, patch)}
        />
      ) : (
        <WidgetUnavailable kind="goal" />
      );
    }
    case 'habit': {
      const habit = getRecord(records, widget.source);
      return habit ? (
        <HabitBody
          habit={habit}
          now={now}
          onToggleDay={(day) => actions.toggleHabitDay(habit.id, day)}
        />
      ) : (
        <WidgetUnavailable kind="habit" />
      );
    }
    case 'notes': {
      const note = getRecord(records, widget.source);
      return note ? (
        <NotesBody
          note={note}
          label={widget.title}
          onChange={(body) => actions.updateNoteBody(note.id, body)}
        />
      ) : (
        <WidgetUnavailable kind="note" />
      );
    }
    case 'tasks': {
      const project = getRecord(records, widget.source);
      return project ? (
        <TasksBody
          project={project}
          tasks={tasksForProject(records.task, project.id)}
          onToggleTask={actions.toggleTask}
          onAddTask={(name) => actions.addTask(project.id, name)}
        />
      ) : (
        <WidgetUnavailable kind="task list" />
      );
    }
    case 'calendar':
      return <CalendarBody events={records.event} now={now} />;
    case 'feed':
      return (
        <FeedBody
          activity={records.activity}
          limit={widget.query.limit}
          now={now}
        />
      );
  }
}
