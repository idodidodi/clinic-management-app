"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const clinicId = async () => {
  const owner = await prisma.user.findUnique({
    where: { email: "owner@example.test" },
    include: { memberships: true },
  });
  if (!owner?.memberships[0]) throw new Error("Complete local setup first.");
  return owner.memberships[0].clinicId;
};

export async function createClient(formData: FormData) {
  const id = String(formData.get("id") || crypto.randomUUID());
  const currentClinicId = await clinicId();
  await prisma.client.create({
    data: {
      id,
      clinicId: currentClinicId,
      familyAccountId: String(formData.get("familyAccountId")),
      externalRef: String(formData.get("externalRef") || id.slice(0, 8)),
      fullName: String(formData.get("fullName")),
      invoiceName: String(formData.get("invoiceName") || ""),
      clientType: String(formData.get("clientType")) as "CHILD" | "PARENT" | "BOTH_PARENTS",
      parentRole: String(formData.get("parentRole") || "") as "MOM" | "DAD" | "OTHER" || null,
      email: String(formData.get("email") || "") || null,
      phoneNumber: String(formData.get("phoneNumber") || "") || null,
      preferredContact: (String(formData.get("preferredContact") || "") || null) as
        | "WHATSAPP"
        | "EMAIL"
        | null,
      comments: String(formData.get("comments") || "") || null,
    },
  });
  revalidatePath("/dashboard");
}

export async function createFamily(formData: FormData) {
  const currentClinicId = await clinicId();
  const accountName = String(formData.get("accountName"));
  const invoiceName = String(formData.get("invoiceName"));
  const parentOneRole = String(formData.get("parentOneRole")) as "MOM" | "DAD";
  const parentTwoRole = String(formData.get("parentTwoRole")) as "MOM" | "DAD";
  const familyId = crypto.randomUUID();
  await prisma.familyAccount.create({
    data: {
      id: familyId,
      clinicId: currentClinicId,
      accountName,
      invoiceName,
      parentOneRole,
      parentTwoRole,
      clients: {
        create: [
          {
            clinicId: currentClinicId,
            externalRef: `${familyId}-parent-1`,
            fullName: `${accountName} ${parentOneRole === "MOM" ? "Mom" : "Dad"} 1`,
            invoiceName,
            clientType: "PARENT",
            parentRole: parentOneRole,
          },
          {
            clinicId: currentClinicId,
            externalRef: `${familyId}-parent-2`,
            fullName: `${accountName} ${parentTwoRole === "MOM" ? "Mom" : "Dad"} 2`,
            invoiceName,
            clientType: "PARENT",
            parentRole: parentTwoRole,
          },
        ],
      },
    },
  });
  revalidatePath("/dashboard");
}

export async function updateClient(formData: FormData) {
  const currentClinicId = await clinicId();
  await prisma.client.updateMany({
    where: { id: String(formData.get("id")), clinicId: currentClinicId },
    data: {
      fullName: String(formData.get("fullName")),
      email: String(formData.get("email") || "") || null,
      phoneNumber: String(formData.get("phoneNumber") || "") || null,
    },
  });
  revalidatePath("/dashboard");
}

export async function createMeeting(formData: FormData) {
  const currentClinicId = await clinicId();
  const id = crypto.randomUUID();
  const familyAccountId = String(formData.get("familyAccountId"));
  const type = String(formData.get("type")) as
    | "CHILD"
    | "PARENT_A"
    | "PARENT_B"
    | "BOTH_PARENTS";
  const familyClients = await prisma.client.findMany({
    where: { familyAccountId, clinicId: currentClinicId },
  });
  const child = familyClients.find((client) => client.clientType === "CHILD");
  const parents = familyClients.filter((client) => client.clientType === "PARENT");
  const mom = parents.find((client) => client.parentRole === "MOM");
  const dad = parents.find((client) => client.parentRole === "DAD");
  const participants =
    type === "CHILD"
      ? child ? [child] : []
      : type === "PARENT_A"
        ? mom ? [mom] : []
        : type === "PARENT_B"
          ? dad ? [dad] : []
          : [mom, dad].filter((client): client is NonNullable<typeof client> => Boolean(client));
  if (!participants.length || (type === "BOTH_PARENTS" && participants.length < 2)) {
    throw new Error("The selected family does not have the clients required for this meeting type.");
  }
  await prisma.meeting.create({
    data: {
      id,
      clinicId: currentClinicId,
      familyAccountId,
      subjectClientId: participants[0].id,
      parentAId: String(formData.get("parentAId") || "") || null,
      parentBId: String(formData.get("parentBId") || "") || null,
      startsAt: new Date(String(formData.get("startsAt"))),
      type,
      status: "SCHEDULED",
      workflowStatus: "REGISTERED",
      tariff: String(formData.get("tariff")),
      billingArrangement: "REGULAR",
      participants: { create: participants.map((client) => ({ clientId: client.id })) },
    },
  });
  revalidatePath("/dashboard");
}

export async function updateMeeting(formData: FormData) {
  const currentClinicId = await clinicId();
  await prisma.meeting.updateMany({
    where: { id: String(formData.get("id")), clinicId: currentClinicId },
    data: {
      startsAt: new Date(String(formData.get("startsAt"))),
      tariff: String(formData.get("tariff")),
      workflowStatus: String(formData.get("workflowStatus")) as
        | "REGISTERED"
        | "REMINDER_SENT"
        | "PAID_INVOICE_PENDING"
        | "PAID_INVOICE_ISSUED",
    },
  });
  revalidatePath("/dashboard");
}

export async function createPayment(formData: FormData) {
  const currentClinicId = await clinicId();
  const meetingId = String(formData.get("meetingId"));
  const invoiceId = String(formData.get("invoiceId") || "") || null;
  await prisma.payment.create({
    data: {
      clinicId: currentClinicId,
      meetingId,
      invoiceId,
      payerId: String(formData.get("payerId") || "") || null,
      payerNameSnapshot: String(formData.get("payerName") || "") || null,
      paidAt: new Date(String(formData.get("paidAt"))),
      amount: String(formData.get("amount")),
      comments: String(formData.get("comments") || "") || null,
    },
  });
  revalidatePath("/dashboard");
}

export async function updatePayment(formData: FormData) {
  const currentClinicId = await clinicId();
  await prisma.payment.updateMany({
    where: { id: String(formData.get("id")), clinicId: currentClinicId },
    data: {
      paidAt: new Date(String(formData.get("paidAt"))),
      amount: String(formData.get("amount")),
      payerNameSnapshot: String(formData.get("payerName") || "") || null,
      comments: String(formData.get("comments") || "") || null,
    },
  });
  revalidatePath("/dashboard");
}

export async function deleteClient(formData: FormData) {
  const currentClinicId = await clinicId();
  const id = String(formData.get("id"));
  const client = await prisma.client.findFirstOrThrow({
    where: { id, clinicId: currentClinicId },
  });
  await prisma.$transaction([
    prisma.clientAudit.create({
      data: {
        clinicId: currentClinicId,
        clientId: client.id,
        action: "DELETED",
        snapshot: client,
      },
    }),
    prisma.client.delete({ where: { id: client.id } }),
  ]);
  revalidatePath("/dashboard");
}

export async function deleteMeeting(formData: FormData) {
  const currentClinicId = await clinicId();
  const id = String(formData.get("id"));
  const meeting = await prisma.meeting.findFirstOrThrow({
    where: { id, clinicId: currentClinicId },
  });
  await prisma.$transaction([
    prisma.meetingAudit.create({
      data: {
        clinicId: currentClinicId,
        meetingId: meeting.id,
        action: "DELETED",
        snapshot: meeting,
      },
    }),
    prisma.payment.deleteMany({ where: { meetingId: meeting.id } }),
    prisma.invoice.deleteMany({ where: { meetingId: meeting.id } }),
    prisma.meeting.delete({ where: { id: meeting.id } }),
  ]);
  revalidatePath("/dashboard");
}

export async function deletePayment(formData: FormData) {
  const currentClinicId = await clinicId();
  const id = String(formData.get("id"));
  const payment = await prisma.payment.findFirstOrThrow({
    where: { id, clinicId: currentClinicId },
  });
  await prisma.$transaction([
    prisma.paymentAudit.create({
      data: {
        clinicId: currentClinicId,
        paymentId: payment.id,
        action: "DELETED",
        snapshot: payment,
      },
    }),
    prisma.payment.delete({ where: { id: payment.id } }),
  ]);
  revalidatePath("/dashboard");
}
