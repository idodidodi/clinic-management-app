import Link from "next/link";

export default async function SetupCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ clinic?: string }>;
}) {
  const params = await searchParams;
  const clinicName = params.clinic || "your clinic";

  return (
    <main className="setup-shell">
      <div className="setup-card">
        <p className="kicker">Workspace ready</p>
        <h1>{clinicName} is registered.</h1>
        <p className="setup-intro">
          The owner and manager memberships were created in your local database.
          Authentication and the operational dashboard are the next steps.
        </p>
        <Link className="setup-submit setup-link" href="/">
          Return to workspace
        </Link>
      </div>
    </main>
  );
}
