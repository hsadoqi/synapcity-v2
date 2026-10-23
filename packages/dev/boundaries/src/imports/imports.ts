import { parseSync } from 'oxc-parser';

import type { ImportRecord } from '../model/index.ts';

type Directive = 'use client' | 'use server' | null;

export interface ModuleRead {
  imports: ImportRecord[];
  directive: Directive;
  parseError: string | null;
}

const STRING_LITERAL = /^\s*(['"`])([^'"`\\$]*)\1\s*$/;

function lineLocator(source: string): (offset: number) => number {
  const starts = [0];
  for (let index = 0; index < source.length; index++) {
    if (source[index] === '\n') starts.push(index + 1);
  }
  return (offset) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if ((starts[middle] ?? 0) <= offset) low = middle;
      else high = middle - 1;
    }
    return low + 1;
  };
}

function leadingDirective(body: readonly unknown[]): Directive {
  for (const statement of body) {
    const directive = (statement as { directive?: unknown }).directive;
    if (typeof directive !== 'string') return null;
    if (directive === 'use client' || directive === 'use server')
      return directive;
  }
  return null;
}

/** Every import, re-export and dynamic import in a module, its leading directive, and any parse error. */
export function readModule(path: string, source: string): ModuleRead {
  const result = parseSync(path, source);
  const firstError = result.errors[0];
  if (firstError)
    return { imports: [], directive: null, parseError: firstError.message };

  const line = lineLocator(source);
  const imports: ImportRecord[] = [];

  for (const statement of result.module.staticImports) {
    imports.push({
      specifier: statement.moduleRequest.value,
      typeOnly:
        statement.entries.length > 0 &&
        statement.entries.every((entry) => entry.isType),
      kind: statement.entries.length === 0 ? 'side-effect' : 'import',
      literal: true,
      line: line(statement.start),
    });
  }

  for (const statement of result.module.staticExports) {
    const bySpecifier = new Map<string, { typeOnly: boolean; start: number }>();
    for (const entry of statement.entries) {
      if (!entry.moduleRequest) continue;
      const seen = bySpecifier.get(entry.moduleRequest.value);
      bySpecifier.set(entry.moduleRequest.value, {
        typeOnly: (seen?.typeOnly ?? true) && entry.isType,
        start: statement.start,
      });
    }
    for (const [specifier, { typeOnly, start }] of bySpecifier) {
      imports.push({
        specifier,
        typeOnly,
        kind: 'export',
        literal: true,
        line: line(start),
      });
    }
  }

  for (const expression of result.module.dynamicImports) {
    const argument = source.slice(
      expression.moduleRequest.start,
      expression.moduleRequest.end,
    );
    const literal = STRING_LITERAL.exec(argument);
    imports.push({
      specifier: literal?.[2] ?? '',
      typeOnly: false,
      kind: 'dynamic',
      literal: literal !== null,
      line: line(expression.start),
    });
  }

  imports.sort((a, b) => a.line - b.line);
  return {
    imports,
    directive: leadingDirective(result.program.body),
    parseError: null,
  };
}
