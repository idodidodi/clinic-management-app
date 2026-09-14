import { prisma } from "@/lib/prisma";
import Dashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const owner = await prisma.user.findUnique({
    where: { email: "owner@example.test" },
    include: { memberships: true },
  });
  const clinicId = owner?.memberships[0]?.clinicId;
  if (!clinicId) return <p className="dashboard-empty">Complete setup first.</p>;

  const [clinic, clients, families, meetings, payments, invoices, payers] =
    await Promise.all([
      prisma.clinic.findUniqueOrThrow({ where: { id: clinicId } }),
      prisma.client.findMany({
        where: { clinicId },
        include: {
          familyAccount: { select: { accountName: true } },
          parentA: { select: { id: true, fullName: true, parentRole: true } },
          parentB: { select: { id: true, fullName: true, parentRole: true } },
          tariffs: true,
          relationsFrom: { include: { relatedClient: { select: { id: true, fullName: true, clientType: true, parentRole: true } } } },
          relationsTo: { include: { client: { select: { id: true, fullName: true, clientType: true, parentRole: true } } } },
        },
        orderBy: { fullName: "asc" },
      }),
      prisma.familyAccount.findMany({ where: { clinicId }, orderBy: { accountName: "asc" } }),
      prisma.meeting.findMany({
        where: { clinicId },
        include: { subjectClient: true, invoices: true, participants: { include: { client: true } } },
        orderBy: { startsAt: "desc" },
      }),
      prisma.payment.findMany({
        where: { clinicId },
        include: { meeting: { include: { subjectClient: true } }, payer: true },
        orderBy: { paidAt: "desc" },
      }),
      prisma.invoice.findMany({ where: { clinicId } }),
      prisma.payer.findMany({ where: { clinicId }, orderBy: { fullName: "asc" } }),
    ]);

  return (
    <Dashboard
      clinicName={clinic.name}
      clients={clients.map((client) => ({
        ...client,
        familyAccount: client.familyAccount,
        parentA: client.parentA,
        parentB: client.parentB,
        relationsFrom: client.relationsFrom,
        relationsTo: client.relationsTo,
        tariffs: client.tariffs.map((tariff) => ({ meetingType: tariff.meetingType, tariff: tariff.tariff.toString() })),
      }))}
      families={families.map((family) => ({ id: family.id, accountName: family.accountName }))}
      meetings={meetings.map((meeting) => ({
        ...meeting,
        tariff: meeting.tariff.toString(),
        invoices: meeting.invoices.map((invoice) => ({
          ...invoice,
          amount: invoice.amount.toString(),
        })),
        participants: meeting.participants.map((participant) => participant.client),
      }))}
      payments={payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toString(),
        paidAt: payment.paidAt.toISOString(),
        meeting: {
          id: payment.meeting.id,
          startsAt: payment.meeting.startsAt.toISOString(),
          subjectClient: payment.meeting.subjectClient,
        },
        payer: payment.payer,
      }))}
      invoices={invoices.map((invoice) => ({ ...invoice, amount: invoice.amount.toString() }))}
      payers={payers}
      defaultTariff={clinic.defaultTariff.toString()}
      dateFormat={owner.dateFormat}
    />
  );
}
