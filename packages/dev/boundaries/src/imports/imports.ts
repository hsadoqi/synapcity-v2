import { parseSync } from 'oxc-parser';

import type { Directive, ImportRecord } from '../model/index.ts';

export interface ModuleRead {
  imports: ImportRecord[];
  directive: Directive;
  leadingImport: string | null;
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

type Node = { type?: string; [key: string]: unknown };

/** The first statement after the directives, if it is a bare `import 'x'`. */
function leadingImport(body: readonly unknown[]): string | null {
  const first = (body as Node[]).find(
    (statement) => typeof statement.directive !== 'string',
  );
  const source = first?.source as Node | undefined;
  if (
    first?.type === 'ImportDeclaration' &&
    (first.specifiers as unknown[]).length === 0 &&
    typeof source?.value === 'string'
  )
    return source.value;
  return null;
}

const literalValue = (node: unknown): string | null => {
  const value = (node as Node | undefined)?.value;
  return typeof value === 'string' ? value : null;
};

/**
 * Edges the module record omits: `require('x')`, `import x = require('x')` and type-position `import('x').T`.
 * The walk runs only when the source mentions one of them, so most files skip it.
 */
const COMMONJS_OR_TYPE_IMPORT = /\brequire\b|\bimport\s*\(/;
function extraEdges(
  program: unknown,
  line: (offset: number) => number,
): ImportRecord[] {
  const found: ImportRecord[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (!value || typeof value !== 'object') return;
    const node = value as Node;
    let specifier: string | null = null;
    let kind: ImportRecord['kind'] | null = null;
    let typeOnly = false;
    if (node.type === 'CallExpression') {
      const callee = node.callee as Node;
      const args = node.arguments as unknown[];
      if (callee.type === 'Identifier' && callee.name === 'require') {
        specifier = literalValue(args[0]);
        kind = 'require';
        // `require(variable)` is as unreadable as a computed dynamic import.
        if (specifier === null) {
          found.push({
            specifier: '',
            typeOnly: false,
            kind,
            literal: false,
            line: line(node.start as number),
          });
        }
      }
    } else if (node.type === 'TSImportEqualsDeclaration') {
      const reference = node.moduleReference as Node;
      if (reference.type === 'TSExternalModuleReference') {
        specifier = literalValue(reference.expression);
        kind = 'require';
        typeOnly = node.importKind === 'type';
      }
    } else if (node.type === 'TSImportType') {
      specifier = literalValue(node.source);
      kind = 'import-type';
      typeOnly = true;
    }
    if (specifier !== null && kind) {
      found.push({
        specifier,
        typeOnly,
        kind,
        literal: true,
        line: line(node.start as number),
      });
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(program);
  return found;
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
    return {
      imports: [],
      directive: null,
      leadingImport: null,
      parseError: firstError.message,
    };

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
      // Only `export … from '…'` is an edge. `import { s } from 'x'; export { s }` is recorded by the
      // module record as an indirect re-export of 'x': that request precedes the entry, while a real
      // re-export's request follows it. (The record's statement span covers the import, not the export.)
      const request = entry.moduleRequest;
      if (!request || request.start < entry.start) continue;
      const seen = bySpecifier.get(request.value);
      bySpecifier.set(request.value, {
        typeOnly: (seen?.typeOnly ?? true) && entry.isType,
        start: seen?.start ?? entry.start,
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

  if (COMMONJS_OR_TYPE_IMPORT.test(source))
    imports.push(...extraEdges(result.program.body, line));

  imports.sort((a, b) => a.line - b.line);
  return {
    imports,
    directive: leadingDirective(result.program.body),
    leadingImport: leadingImport(result.program.body),
    parseError: null,
  };
}
