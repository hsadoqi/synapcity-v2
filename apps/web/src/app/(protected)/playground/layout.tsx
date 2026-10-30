import React from 'react';
import { getSpaceSource } from '@/lib/spaces';
import { WorkbenchShell } from '@synapcity/frontend-blocks';
import { getCurrentUser } from '@/features/auth/server';
import { User } from '@synapcity/domain-identity';

export default async function PlaygroundLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const source = await getSpaceSource();
    console.log('source', source);
    const spaces = await source.list();
    const user = await getCurrentUser();
    if (!user) return null;
    return (
        <>
            <WorkbenchShell
                initialWorkspaceId={spaces[0]?.id}
                workspaces={spaces.map((s) => ({
                    ...s,
                    initials: s.name[0] ?? '',
                }))}
                user={user as User}
            />
            {children}
        </>
    );
}
