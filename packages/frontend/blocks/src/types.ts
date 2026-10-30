import { ReactNode } from 'react';

export interface Workspace {
  id: string;
  name: string;
  initials: string;
  /** A lucide icon name in kebab-case, as stored on the record. */
  icon?: string;
  description?: string;
  plan?: string;
  avatar?: string;
  resources?: WorkspaceResource[];
}

export type ResourceKind = 'document' | 'dashboard';

/** One entry in a workspace's panel. The same record can be listed in several workspaces. */
export interface WorkspaceResource {
  id: string;
  kind: ResourceKind;
  name: string;
  icon: string;
  pinned?: boolean;
  /** How many other workspaces list this same record. */
  alsoIn?: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  isActive?: boolean;
}

export interface Deployment {
  id: string;
  title: string;
  branch: string;
  time: string;
  failed?: boolean;
}
