
import Link from "next/link";
import { Button } from "@synapcity/frontend-ui/core/button";
import { createClient } from "@synapcity/server-supabase";

export function AuthButton() {
const result = async () => {
          const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();
  
  const user = data?.claims;
  return { data, user }
}


return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <AuthButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
)}

