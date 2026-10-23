/** Package category, from the path: `packages/<category>/<name>` or `apps/<name>`. */
export type Category =
  'domain' | 'frontend' | 'server' | 'features' | 'dev' | 'app';

/** The dependency graph a file belongs to; the rows and columns of ADR-0014's matrix. */
export type Graph =
  | 'domain'
  | 'frontend'
  | 'server'
  | 'feature-contracts'
  | 'feature-frontend'
  | 'feature-server'
  | 'app-browser'
  | 'app-backend'
  | 'testing'
  | 'dev';

export type RuleId =
  | 'R0'
  | 'R1'
  | 'R2'
  | 'R3'
  | 'R4'
  | 'R5'
  | 'R6'
  | 'R7'
  | 'R8'
  | 'R9'
  | 'R10'
  | 'R11';

export interface WorkspacePackage {
  name: string;
  /** Absolute directory. */
  dir: string;
  category: Category;
  /** Existing packages that keep their own layout (workspace conventions, Internal organization). */
  legacy: boolean;
  /** Workspace package names from `dependencies` and `devDependencies`. */
  dependencies: string[];
  /** `exports`, flattened to string targets. */
  exports: Record<string, string>;
  /** Absolute path of the package's `tsconfig.json`, if it has one. */
  tsconfig: string | null;
}

export interface Workspace {
  root: string;
  packages: WorkspacePackage[];
}

export interface ImportRecord {
  specifier: string;
  typeOnly: boolean;
  kind: 'import' | 'export' | 'side-effect' | 'dynamic';
  /** False for a dynamic import whose argument is not a single string literal. */
  literal: boolean;
  line: number;
}

export interface SourceFile {
  /** Absolute path. */
  path: string;
  pkg: WorkspacePackage;
  graph: Graph;
  production: boolean;
  directive: 'use client' | 'use server' | null;
  imports: ImportRecord[];
  parseError: string | null;
}

export type Target =
  | { kind: 'file'; file: SourceFile }
  | { kind: 'asset'; path: string }
  | { kind: 'external'; name: string }
  | { kind: 'unresolved' };

export interface Edge {
  from: SourceFile;
  record: ImportRecord;
  target: Target;
}

export interface Violation {
  rule: RuleId;
  /** Repository-relative, POSIX separators. */
  file: string;
  specifier: string;
  target: string | null;
  message: string;
}

export interface Exception {
  rule: RuleId;
  file: string;
  specifier?: string;
  reason: string;
  removal: string;
}
