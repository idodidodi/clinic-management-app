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
  await prisma.meeting.create({
    data: {
      id,
      clinicId: currentClinicId,
      familyAccountId,
      subjectClientId: String(formData.get("subjectClientId")),
      parentAId: String(formData.get("parentAId") || "") || null,
      parentBId: String(formData.get("parentBId") || "") || null,
      startsAt: new Date(String(formData.get("startsAt"))),
      type: String(formData.get("type")) as
        | "CHILD"
        | "PARENT_A"
        | "PARENT_B"
        | "BOTH_PARENTS",
      status: "SCHEDULED",
      workflowStatus: "REGISTERED",
      tariff: String(formData.get("tariff")),
      billingArrangement: "REGULAR",
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
