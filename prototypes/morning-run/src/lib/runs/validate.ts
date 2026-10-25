import { runSchema, type Run } from './schema';

export type RunProblem = { path: string; message: string };

/** Turn the schema's errors into sentences a person can act on. */
export function validateRun(
  draft: Run,
): { ok: true; run: Run } | { ok: false; problems: RunProblem[] } {
  const result = runSchema.safeParse(draft);
  if (result.success) return { ok: true, run: result.data };

  const problems = result.error.issues.map((issue): RunProblem => {
    const [first, index, ...rest] = issue.path;
    const key = rest[0] ?? first;
    const where =
      first === 'steps' && typeof index === 'number'
        ? `Step ${index + 1}`
        : 'Run';
    return {
      path: issue.path.join('.'),
      message: `${where}: ${describe(String(key), issue.code, issue.message)}`,
    };
  });
  return { ok: false, problems };
}

function describe(key: string, code: string, fallback: string): string {
  switch (key) {
    case 'name':
      return 'give it a name (up to 40 characters).';
    case 'label':
      return 'give it a title (up to 60 characters).';
    case 'steps':
      return code === 'too_small'
        ? 'add at least one step.'
        : 'a run can have at most 12 steps.';
    case 'options':
      return 'a list needs 2 to 10 options, each up to 60 characters.';
    case 'durationSec':
      return 'time must be between 10 seconds and 15 minutes.';
    default:
      return fallback.toLowerCase();
  }
}
