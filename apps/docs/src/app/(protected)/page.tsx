import { redirect } from 'next/navigation'

import { createClient } from '@synapcity/server-supabase/client';
import { Button } from '@synapcity/frontend-ui/components';

export default async function ProtectedDocsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <p>
        Hello <span>{data.claims.email}</span>
      </p>
      <Button
        onClick={() => {
            supabase.auth.logOut()
        }}
      >
        Log Out
      </Button>
    </div>
  )
}
