import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy' };

// Keep in step with the Data privacy settings (features/settings): what each
// switch collects and who receives it. A change to either for a purpose means
// raising its number in PRIVACY_POLICY_VERSIONS, which asks everyone again.
export default function PrivacyPage() {
  return (
    <section
      aria-labelledby="privacy-heading"
      className="flex flex-1 justify-center px-6 py-16 sm:px-12"
    >
      <div className="flex w-full max-w-3xl flex-col gap-8 border-t border-divider py-10">
        <h1
          id="privacy-heading"
          className="font-heading text-4xl font-medium leading-tight tracking-tight text-balance"
        >
          Privacy
        </h1>
        <p>
          Synapcity collects nothing about how you use it unless you turn it on
          in Settings, under Data privacy. Every choice there is off until you
          change it, and you can turn it off again at any time. Turning one off
          takes effect at once.
        </p>

        <section
          aria-labelledby="error-reports"
          className="flex flex-col gap-3"
        >
          <h2 id="error-reports" className="font-heading text-2xl font-medium">
            Error reports
          </h2>
          <p>
            With error reports on, when something breaks in your browser,
            Synapcity sends a report to Sentry, an error-monitoring service, so
            the problem can be found and fixed. A report holds the error
            message, where in the code it happened, and the address of the page,
            with ids and email addresses removed from both.
          </p>
          <p>
            Reports are built not to include your name, email address or account
            id, or what you did before the error. An error message can still
            quote other text from the page, such as something you typed, which
            cannot be recognised and removed. Reports are used only to fix
            problems.
          </p>
          <p>
            Sentry stores reports in the United States and deletes them after at
            most 90 days. Synapcity asks Sentry not to store the network address
            a report came from.
          </p>
        </section>

        <section aria-labelledby="not-yet" className="flex flex-col gap-3">
          <h2 id="not-yet" className="font-heading text-2xl font-medium">
            Activity tracking and data sharing
          </h2>
          <p>
            These switches record your choice now, so it is already in place if
            a service for them is added. Today nothing is collected for activity
            tracking and nothing is shared with other companies, whatever they
            are set to. This notice will say what is collected and who receives
            it before anything is, and you will be asked again.
          </p>
        </section>

        <section aria-labelledby="signals" className="flex flex-col gap-3">
          <h2 id="signals" className="font-heading text-2xl font-medium">
            Your browser&rsquo;s privacy signal
          </h2>
          <p>
            If your browser sends Global Privacy Control, data sharing stays
            off, whatever the switch says.
          </p>
        </section>

        <section aria-labelledby="where" className="flex flex-col gap-3">
          <h2 id="where" className="font-heading text-2xl font-medium">
            Where your choices are kept
          </h2>
          <p>
            Your choices are saved in this browser and, when you are signed in,
            with your account, so they follow you to your other devices. Each
            records when you made it. Global Privacy Control is read from each
            browser separately.
          </p>
        </section>

        <section aria-labelledby="changes" className="flex flex-col gap-3">
          <h2 id="changes" className="font-heading text-2xl font-medium">
            When this notice changes
          </h2>
          <p>
            If what a choice covers changes, that choice is turned off and the
            Data privacy settings ask you again. Only the choices that changed
            are affected.
          </p>
        </section>
      </div>
    </section>
  );
}
