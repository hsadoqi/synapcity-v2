import { AuthLinkButton } from "@synapcity/features-auth/frontend";


export default function RootPage() {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="flex flex-1 items-center justify-center px-6 py-16 sm:px-12"
    >
      <div className="flex w-full max-w-3xl flex-col items-start gap-10 border-t border-divider py-10 sm:gap-12 sm:py-16">
        <h1
          id="welcome-heading"
          className="font-heading text-4xl font-medium leading-tight tracking-tight text-balance sm:text-5xl"
        >
          <span className="block text-muted-foreground">Welcome to</span>
          <span className="block">Synapcity Web</span>
        </h1>
        <AuthLinkButton type="login" />
      </div>
    </section>
  );
}
