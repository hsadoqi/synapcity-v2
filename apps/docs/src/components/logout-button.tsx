"use client";

import { createClient } from "@synapcity/server-supabase/client";
import { Button } from "@synapcity/frontend-ui/core/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return <Button onClick={logout}>Logout</Button>;
}
