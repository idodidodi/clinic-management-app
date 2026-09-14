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

const currentUser = async () => {
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: "owner@example.test" } });
  return owner;
};

export async function updateUserSettings(formData: FormData) {
  const user = await currentUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { dateFormat: String(formData.get("dateFormat")) as "DD_MM_YYYY" | "MM_DD_YYYY" | "YYYY_MM_DD" },
  });
  revalidatePath("/dashboard");
}

export async function createClient(formData: FormData) {
  const id = String(formData.get("id") || crypto.randomUUID());
  const currentClinicId = await clinicId();
  const parentClientId = String(formData.get("parentClientId") || "") || null;
  const clientType = String(formData.get("clientType")) as "CHILD" | "PARENT" | "OTHER" | "BOTH_PARENTS";
  const parentRole = String(formData.get("parentRole") || "") as "MOM" | "DAD" | "OTHER";
  const fullName = String(formData.get("fullName"));
  const invoiceName = String(formData.get("invoiceName") || fullName);
  await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.findUniqueOrThrow({ where: { id: currentClinicId } });
    let familyAccountId = parentClientId
      ? (await tx.client.findFirstOrThrow({ where: { id: parentClientId, clinicId: currentClinicId } })).familyAccountId
      : "";
    if (!parentClientId) {
      if (clientType !== "PARENT") throw new Error("Start a family by creating a parent client.");
      const family = await tx.familyAccount.create({
        data: {
          clinicId: currentClinicId,
          accountName: `${fullName} family`,
          invoiceName,
          parentOneRole: parentRole === "DAD" ? "DAD" : "MOM",
          parentTwoRole: parentRole === "DAD" ? "MOM" : "DAD",
        },
      });
      familyAccountId = family.id;
    } else if (clientType === "PARENT") {
      const parentCount = await tx.client.count({ where: { familyAccountId, clientType: "PARENT" } });
      if (parentCount >= 2) throw new Error("A family can have at most two parent clients.");
    }
    const client = await tx.client.create({
      data: {
      id,
      clinicId: currentClinicId,
      familyAccountId,
      externalRef: String(formData.get("externalRef") || id.slice(0, 8)),
      fullName,
      invoiceName,
      clientType,
      parentRole: clientType === "PARENT" ? parentRole : null,
      email: String(formData.get("email") || "") || null,
      phoneNumber: String(formData.get("phoneNumber") || "") || null,
      preferredContact: (String(formData.get("preferredContact") || "") || null) as
        | "WHATSAPP"
        | "EMAIL"
        | null,
      comments: String(formData.get("comments") || "") || null,
      },
    });
    const meetingTypes = ["CHILD", "PARENT_A", "PARENT_B", "BOTH_PARENTS"] as const;
    await tx.clientTariff.createMany({
      data: meetingTypes.map((meetingType) => ({
        clientId: client.id,
        meetingType,
        tariff: String(formData.get(`tariff-${meetingType}`) || "")
          || clinic.defaultTariff,
      })),
    });
    if (parentClientId) {
      const relationType = clientType === "CHILD" ? "PARENT" : clientType === "PARENT" ? "PARENT" : "OTHER";
      await tx.clientRelation.createMany({
        data: [
          { clientId: parentClientId, relatedClientId: client.id, relationType: clientType === "CHILD" ? "CHILD" : "OTHER" },
          { clientId: client.id, relatedClientId: parentClientId, relationType },
        ],
      });
    }
    return client;
  });
  revalidatePath("/dashboard");
}

export async function updateClient(formData: FormData) {
  const currentClinicId = await clinicId();
  const id = String(formData.get("id"));
  await prisma.$transaction([
    prisma.client.updateMany({
      where: { id, clinicId: currentClinicId },
      data: {
        fullName: String(formData.get("fullName")),
        email: String(formData.get("email") || "") || null,
        phoneNumber: String(formData.get("phoneNumber") || "") || null,
      },
    }),
    ...(["CHILD", "PARENT_A", "PARENT_B", "BOTH_PARENTS"] as const)
      .filter((meetingType) => String(formData.get(`tariff-${meetingType}`) || ""))
      .map((meetingType) => prisma.clientTariff.upsert({
        where: { clientId_meetingType: { clientId: id, meetingType } },
        update: { tariff: String(formData.get(`tariff-${meetingType}`)) },
        create: { clientId: id, meetingType, tariff: String(formData.get(`tariff-${meetingType}`)) },
      })),
  ]);
  revalidatePath("/dashboard");
}

export async function createMeeting(formData: FormData) {
  const currentClinicId = await clinicId();
  const id = crypto.randomUUID();
  const clientId = String(formData.get("clientId"));
  const type = String(formData.get("type")) as
    | "CHILD"
    | "PARENT_A"
    | "PARENT_B"
    | "BOTH_PARENTS";
  const selectedClient = await prisma.client.findFirstOrThrow({
    where: { id: clientId, clinicId: currentClinicId },
    include: { tariffs: true },
  });
  const clinic = await prisma.clinic.findUniqueOrThrow({ where: { id: currentClinicId } });
  const familyAccountId = selectedClient.familyAccountId;
  const familyClients = await prisma.client.findMany({ where: { familyAccountId, clinicId: currentClinicId } });
  const parents = familyClients.filter((client) => client.clientType === "PARENT");
  const mom = parents.find((client) => client.parentRole === "MOM");
  const dad = parents.find((client) => client.parentRole === "DAD");
  const participants =
    type === "CHILD"
      ? selectedClient.clientType === "CHILD" ? [selectedClient] : []
      : type === "PARENT_A"
        ? selectedClient.parentRole === "MOM" ? [selectedClient] : []
        : type === "PARENT_B"
          ? selectedClient.parentRole === "DAD" ? [selectedClient] : []
          : [mom, dad].filter((client): client is NonNullable<typeof client> => Boolean(client));
  if (!participants.length || (type === "BOTH_PARENTS" && participants.length < 2)) {
    throw new Error("The selected family does not have the clients required for this meeting type.");
  }
  const tariff = selectedClient.tariffs.find((item) => item.meetingType === type)?.tariff
    ?? clinic.defaultTariff;
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
      tariff,
      billingArrangement: "REGULAR",
      participants: { create: participants.map((client) => ({ clientId: client.id })) },
    },
  });
  revalidatePath("/dashboard");
}

export async function updateClinicTariff(formData: FormData) {
  const currentClinicId = await clinicId();
  const defaultTariff = String(formData.get("defaultTariff"));
  await prisma.clinic.update({ where: { id: currentClinicId }, data: { defaultTariff } });
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
  const [subjectMeetingCount, participantCount] = await Promise.all([
    prisma.meeting.count({ where: { subjectClientId: client.id, clinicId: currentClinicId } }),
    prisma.meetingParticipant.count({ where: { clientId: client.id } }),
  ]);
  if (subjectMeetingCount > 0 || participantCount > 0) {
    throw new Error(
      "This client cannot be deleted because they are attached to meeting history. Remove or reassign those meetings first.",
    );
  }
  await prisma.$transaction(async (tx) => {
    await tx.clientAudit.create({
      data: {
        clinicId: currentClinicId,
        clientId: client.id,
        action: "DELETED",
        snapshot: client,
      },
    });
    await tx.meeting.updateMany({
      where: { clinicId: currentClinicId, parentAId: client.id },
      data: { parentAId: null },
    });
    await tx.meeting.updateMany({
      where: { clinicId: currentClinicId, parentBId: client.id },
      data: { parentBId: null },
    });
    await tx.invoice.updateMany({
      where: { clinicId: currentClinicId, recipientClientId: client.id },
      data: { recipientClientId: null },
    });
    await tx.payer.updateMany({
      where: { clinicId: currentClinicId, clientId: client.id },
      data: { clientId: null },
    });
    await tx.client.delete({ where: { id: client.id } });
  });
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
