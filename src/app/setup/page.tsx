import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function registerClinic(formData: FormData) {
  "use server";

  const clinicName = String(formData.get("clinicName") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim().toLowerCase();
  const ownerPassword = String(formData.get("ownerPassword") ?? "");
  const managerName = String(formData.get("managerName") ?? "").trim();
  const managerEmail = String(formData.get("managerEmail") ?? "").trim().toLowerCase();
  const managerPassword = String(formData.get("managerPassword") ?? "");

  if (
    !clinicName ||
    !ownerName ||
    !ownerEmail ||
    ownerPassword.length < 12 ||
    !managerName ||
    !managerEmail ||
    managerPassword.length < 12 ||
    ownerEmail === managerEmail
  ) {
    throw new Error(
      "Provide all fields, use passwords with at least 12 characters, and use different email addresses.",
    );
  }

  const [ownerPasswordHash, managerPasswordHash] = await Promise.all([
    hash(ownerPassword, 12),
    hash(managerPassword, 12),
  ]);

  const clinic = await prisma.$transaction(async (transaction) => {
    const owner = await transaction.user.create({
      data: { email: ownerEmail, displayName: ownerName, passwordHash: ownerPasswordHash },
    });
    const manager = await transaction.user.create({
      data: {
        email: managerEmail,
        displayName: managerName,
        passwordHash: managerPasswordHash,
      },
    });

    return transaction.clinic.create({
      data: {
        name: clinicName,
        memberships: {
          create: [
            { userId: owner.id, role: "OWNER" },
            { userId: manager.id, role: "MANAGER" },
          ],
        },
      },
    });
  });

  redirect(`/setup/complete?clinic=${encodeURIComponent(clinic.name)}`);
}

export default function SetupPage() {
  return (
    <main className="setup-shell">
      <div className="setup-card">
        <p className="kicker">Local workspace setup</p>
        <h1>Register your clinic</h1>
        <p className="setup-intro">
          This creates one clinic owner and one clinic manager in your local
          PostgreSQL database. Passwords are hashed and never stored in plain text.
        </p>
        <form action={registerClinic} className="setup-form">
          <fieldset>
            <legend>Clinic</legend>
            <label>
              Clinic name
              <input name="clinicName" required placeholder="Example Clinic" />
            </label>
          </fieldset>
          <fieldset>
            <legend>Owner</legend>
            <label>
              Full name
              <input name="ownerName" required autoComplete="name" />
            </label>
            <label>
              Email
              <input name="ownerEmail" type="email" required autoComplete="email" />
            </label>
            <label>
              Local password
              <input
                name="ownerPassword"
                type="password"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>Clinic manager</legend>
            <label>
              Full name
              <input name="managerName" required autoComplete="name" />
            </label>
            <label>
              Email
              <input name="managerEmail" type="email" required autoComplete="email" />
            </label>
            <label>
              Local password
              <input
                name="managerPassword"
                type="password"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </label>
          </fieldset>
          <button className="setup-submit" type="submit">
            Create local workspace
          </button>
        </form>
      </div>
    </main>
  );
}
