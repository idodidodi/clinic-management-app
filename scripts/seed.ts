import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before seeding.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const owner = await prisma.user.findUnique({
    where: { email: "owner@example.test" },
    include: { memberships: true },
  });

  if (!owner?.memberships[0]) {
    throw new Error("Run the local clinic setup first at http://localhost:3000/setup.");
  }

  const clinicId = owner.memberships[0].clinicId;
  const clinic = await prisma.clinic.findUniqueOrThrow({ where: { id: clinicId } });

  const familyOne = await prisma.familyAccount.upsert({
    where: { id: "seed-family-rivera" },
    update: {
      accountName: "Demo Family One",
      invoiceName: "Demo Family One",
      parentOneRole: "MOM",
      parentTwoRole: "DAD",
    },
    create: {
      id: "seed-family-rivera",
      clinicId: clinic.id,
      accountName: "Rivera family",
      invoiceName: "Demo Family One",
      parentOneRole: "MOM",
      parentTwoRole: "DAD",
      invoiceTitle: "Professional services",
      invoiceDescription: "Synthetic development invoice",
      comments: "Seed data only.",
    },
  });

  const familyTwo = await prisma.familyAccount.upsert({
    where: { id: "seed-family-chen" },
    update: {
      accountName: "Demo Family Two",
      invoiceName: "Demo Family Two",
      parentOneRole: "MOM",
      parentTwoRole: "DAD",
    },
    create: {
      id: "seed-family-chen",
      clinicId: clinic.id,
      accountName: "Demo Family Two",
      invoiceName: "Demo Family Two",
      parentOneRole: "MOM",
      parentTwoRole: "DAD",
      invoiceTitle: "Professional services",
      invoiceDescription: "Synthetic development invoice",
      comments: "Seed data only.",
    },
  });

  const childRivera = await upsertClient({
    id: "seed-client-rivera-child",
    clinicId: clinic.id,
    familyAccountId: familyOne.id,
    externalRef: "SEED-RIVERA-CHILD",
    fullName: "Demo Child One",
    invoiceName: "Demo Family One",
    clientType: "CHILD",
    email: "alex.rivera@example.test",
    phoneNumber: "+1 555 0101",
    preferredContact: "WHATSAPP",
  });
  const parentARivera = await upsertClient({
    id: "seed-client-rivera-parent-a",
    clinicId: clinic.id,
    familyAccountId: familyOne.id,
    externalRef: "SEED-RIVERA-PARENT-A",
    fullName: "Demo Mom One",
    invoiceName: "Demo Family One",
    clientType: "PARENT",
    parentRole: "MOM",
    email: "morgan.rivera@example.test",
    phoneNumber: "+1 555 0102",
    preferredContact: "EMAIL",
  });
  const parentBRivera = await upsertClient({
    id: "seed-client-rivera-parent-b",
    clinicId: clinic.id,
    familyAccountId: familyOne.id,
    externalRef: "SEED-RIVERA-PARENT-B",
    fullName: "Demo Dad One",
    invoiceName: "Demo Family One",
    clientType: "PARENT",
    parentRole: "DAD",
    email: "taylor.rivera@example.test",
    phoneNumber: "+1 555 0103",
    preferredContact: "WHATSAPP",
  });
  const bothParentsRivera = await upsertClient({
    id: "seed-client-rivera-both-parents",
    clinicId: clinic.id,
    familyAccountId: familyOne.id,
    externalRef: "SEED-RIVERA-BOTH",
    fullName: "Demo Parent Pair One",
    invoiceName: "Demo Family One",
    clientType: "BOTH_PARENTS",
    preferredContact: "EMAIL",
  });

  await prisma.client.update({
    where: { id: childRivera.id },
    data: { parentAId: parentARivera.id, parentBId: parentBRivera.id },
  });

  const childChen = await upsertClient({
    id: "seed-client-chen-child",
    clinicId: clinic.id,
    familyAccountId: familyTwo.id,
    externalRef: "SEED-CHEN-CHILD",
    fullName: "Demo Child Two",
    invoiceName: "Demo Family Two",
    clientType: "CHILD",
    email: "jamie.chen@example.test",
    phoneNumber: "+1 555 0201",
    preferredContact: "EMAIL",
  });
  const parentAChen = await upsertClient({
    id: "seed-client-chen-parent-a",
    clinicId: clinic.id,
    familyAccountId: familyTwo.id,
    externalRef: "SEED-CHEN-PARENT-A",
    fullName: "Demo Mom Two",
    invoiceName: "Demo Family Two",
    clientType: "PARENT",
    parentRole: "MOM",
    email: "casey.chen@example.test",
    phoneNumber: "+1 555 0202",
    preferredContact: "WHATSAPP",
  });
  const parentBChen = await upsertClient({
    id: "seed-client-chen-parent-b",
    clinicId: clinic.id,
    familyAccountId: familyTwo.id,
    externalRef: "SEED-CHEN-PARENT-B",
    fullName: "Demo Dad Two",
    invoiceName: "Demo Family Two",
    clientType: "PARENT",
    parentRole: "DAD",
    email: "demo.dad.two@example.test",
    preferredContact: "EMAIL",
  });

  await prisma.client.update({
    where: { id: childChen.id },
    data: { parentAId: parentAChen.id, parentBId: parentBChen.id },
  });

  const payerGrandparent = await prisma.payer.upsert({
    where: { id: "seed-payer-grandparent" },
    update: {},
    create: {
      id: "seed-payer-grandparent",
      clinicId: clinic.id,
      familyAccountId: familyTwo.id,
      fullName: "Demo Other Payer",
      email: "jordan.chen@example.test",
      phoneNumber: "+1 555 0203",
      comments: "Synthetic payer who is not a client.",
    },
  });
  const payerParentARivera = await upsertPayer({
    id: "seed-payer-rivera-parent-a",
    clinicId: clinic.id,
    familyAccountId: familyOne.id,
    clientId: parentARivera.id,
    fullName: parentARivera.fullName,
  });
  const payerParentBRivera = await upsertPayer({
    id: "seed-payer-rivera-parent-b",
    clinicId: clinic.id,
    familyAccountId: familyOne.id,
    clientId: parentBRivera.id,
    fullName: parentBRivera.fullName,
  });

  const meetings = [
    {
      id: "seed-meeting-child-shared-single",
      familyAccountId: familyOne.id,
      subjectClientId: childRivera.id,
      parentAId: parentARivera.id,
      parentBId: parentBRivera.id,
      type: "CHILD" as const,
      tariff: "120.00",
      billingArrangement: "SHARED_SINGLE_INVOICE" as const,
      invoiceKind: "SINGLE" as const,
      invoiceAmount: "120.00",
      paymentAmounts: ["60.00", "60.00"],
      payerIds: [payerParentARivera.id, payerParentBRivera.id],
    },
    {
      id: "seed-meeting-parent-a-regular",
      familyAccountId: familyOne.id,
      subjectClientId: parentARivera.id,
      parentAId: parentARivera.id,
      type: "PARENT_A" as const,
      tariff: "90.00",
      billingArrangement: "REGULAR" as const,
      invoiceKind: "SINGLE" as const,
      invoiceAmount: "90.00",
      paymentAmounts: ["90.00"],
      payerIds: [payerParentARivera.id],
    },
    {
      id: "seed-meeting-both-separate",
      familyAccountId: familyOne.id,
      subjectClientId: bothParentsRivera.id,
      parentAId: parentARivera.id,
      parentBId: parentBRivera.id,
      type: "BOTH_PARENTS" as const,
      tariff: "160.00",
      billingArrangement: "SHARED_SEPARATE_INVOICES" as const,
      invoiceKind: "PARENT_A_SHARE" as const,
      invoiceAmount: "80.00",
      paymentAmounts: ["80.00"],
      payerIds: [payerParentARivera.id],
    },
    {
      id: "seed-meeting-parent-b-regular",
      familyAccountId: familyOne.id,
      subjectClientId: parentBRivera.id,
      parentBId: parentBRivera.id,
      type: "PARENT_B" as const,
      tariff: "85.00",
      billingArrangement: "REGULAR" as const,
      invoiceKind: "SINGLE" as const,
      invoiceAmount: "85.00",
      paymentAmounts: [],
      payerIds: [],
    },
    {
      id: "seed-meeting-child-grandparent",
      familyAccountId: familyTwo.id,
      subjectClientId: childChen.id,
      parentAId: parentAChen.id,
      type: "CHILD" as const,
      tariff: "110.00",
      billingArrangement: "REGULAR" as const,
      invoiceKind: "SINGLE" as const,
      invoiceAmount: "110.00",
      paymentAmounts: ["110.00"],
      payerIds: [payerGrandparent.id],
    },
  ];

  for (const meetingData of meetings) {
    const meeting = await prisma.meeting.upsert({
      where: { id: meetingData.id },
      update: {},
      create: {
        id: meetingData.id,
        clinicId: clinic.id,
        familyAccountId: meetingData.familyAccountId,
        subjectClientId: meetingData.subjectClientId,
        parentAId: meetingData.parentAId,
        parentBId: meetingData.parentBId,
        startsAt: new Date("2026-09-10T10:00:00.000Z"),
        type: meetingData.type,
        status: "COMPLETED",
        tariff: meetingData.tariff,
        billingArrangement: meetingData.billingArrangement,
      },
    });
    const participantIds =
      meetingData.type === "BOTH_PARENTS"
        ? [meetingData.parentAId, meetingData.parentBId].filter((id): id is string => Boolean(id))
        : [meetingData.subjectClientId];
    await prisma.meetingParticipant.createMany({
      data: participantIds.map((clientId) => ({ meetingId: meeting.id, clientId })),
      skipDuplicates: true,
    });

    const recipientClientId =
      meetingData.type === "PARENT_A"
        ? meetingData.parentAId
        : meetingData.type === "PARENT_B"
          ? meetingData.parentBId
          : meetingData.parentAId;

    const invoice = await prisma.invoice.upsert({
      where: {
        meetingId_kind: {
          meetingId: meeting.id,
          kind: meetingData.invoiceKind,
        },
      },
      update: {},
      create: {
        clinicId: clinic.id,
        familyAccountId: meetingData.familyAccountId,
        meetingId: meeting.id,
        recipientClientId,
        kind: meetingData.invoiceKind,
        amount: meetingData.invoiceAmount,
        status: meetingData.paymentAmounts.length > 0 ? "PAID" : "ISSUED",
        issuedAt: new Date("2026-09-10T12:00:00.000Z"),
      },
    });

    if (
      meetingData.billingArrangement === "SHARED_SEPARATE_INVOICES" &&
      meetingData.parentBId
    ) {
      await prisma.invoice.upsert({
        where: {
          meetingId_kind: {
            meetingId: meeting.id,
            kind: "PARENT_B_SHARE",
          },
        },
        update: {},
        create: {
          clinicId: clinic.id,
          familyAccountId: meetingData.familyAccountId,
          meetingId: meeting.id,
          recipientClientId: meetingData.parentBId,
          kind: "PARENT_B_SHARE",
          amount: meetingData.invoiceAmount,
          status: "ISSUED",
          issuedAt: new Date("2026-09-10T12:00:00.000Z"),
        },
      });
    }

    for (let index = 0; index < meetingData.paymentAmounts.length; index += 1) {
      await prisma.payment.upsert({
        where: { id: `${meeting.id}-payment-${index + 1}` },
        update: {},
        create: {
          id: `${meeting.id}-payment-${index + 1}`,
          clinicId: clinic.id,
          meetingId: meeting.id,
          invoiceId: invoice.id,
          payerId: meetingData.payerIds[index],
          payerNameSnapshot: meetingData.payerIds[index] ? undefined : "Unidentified payer",
          paidAt: new Date("2026-09-11T09:00:00.000Z"),
          amount: meetingData.paymentAmounts[index],
          comments: "Synthetic development payment.",
        },
      });
    }
  }

  for (let familyNumber = 1; familyNumber <= 10; familyNumber += 1) {
    const family = await upsertFamily({
      id: `seed-family-regular-${familyNumber}`,
      clinicId: clinic.id,
      accountName: `Demo Family ${familyNumber + 2}`,
      invoiceName: `Demo Family ${familyNumber + 2}`,
    });
    const childMeetingPrefix = `seed-meeting-regular-${familyNumber}-child-`;
    await prisma.payment.deleteMany({
      where: { meeting: { id: { startsWith: childMeetingPrefix } } },
    });
    await prisma.invoice.deleteMany({
      where: { meeting: { id: { startsWith: childMeetingPrefix } } },
    });
    await prisma.meeting.deleteMany({
      where: { id: { startsWith: childMeetingPrefix } },
    });
    const seededChildren = await prisma.client.findMany({
      where: {
        familyAccountId: family.id,
        externalRef: { startsWith: `SEED-REGULAR-${familyNumber}-CHILD-` },
      },
      select: { id: true },
    });
    const seededChildIds = seededChildren.map((child) => child.id);
    if (seededChildIds.length > 0) {
      const childMeetings = { subjectClientId: { in: seededChildIds } };
      await prisma.payment.deleteMany({ where: { meeting: childMeetings } });
      await prisma.invoice.deleteMany({ where: { meeting: childMeetings } });
      await prisma.meeting.deleteMany({ where: childMeetings });
    }
    await prisma.client.deleteMany({
      where: { id: { in: seededChildIds } },
    });
    const parentA = await upsertClient({
      id: `seed-client-regular-${familyNumber}-parent-a`,
      clinicId: clinic.id,
      familyAccountId: family.id,
      externalRef: `SEED-REGULAR-${familyNumber}-PARENT-A`,
      fullName: `Demo Mom ${familyNumber + 2}`,
      invoiceName: family.invoiceName,
      clientType: "PARENT",
      parentRole: "MOM",
      email: `regular.parent.a.${familyNumber}@example.test`,
      preferredContact: "EMAIL",
    });
    const parentB = await upsertClient({
      id: `seed-client-regular-${familyNumber}-parent-b`,
      clinicId: clinic.id,
      familyAccountId: family.id,
      externalRef: `SEED-REGULAR-${familyNumber}-PARENT-B`,
      fullName: `Demo Dad ${familyNumber + 2}`,
      invoiceName: family.invoiceName,
      clientType: "PARENT",
      parentRole: "DAD",
      email: `regular.parent.b.${familyNumber}@example.test`,
      preferredContact: "WHATSAPP",
    });
    const bothParents = await upsertClient({
      id: `seed-client-regular-${familyNumber}-both-parents`,
      clinicId: clinic.id,
      familyAccountId: family.id,
      externalRef: `SEED-REGULAR-${familyNumber}-BOTH`,
      fullName: `Demo Parent Pair ${familyNumber + 2}`,
      invoiceName: family.invoiceName,
      clientType: "BOTH_PARENTS",
      preferredContact: "EMAIL",
    });

    // Keep the demo distribution realistic: nine of ten regular families have one child.
    const childCount = familyNumber === 10 ? 2 : 1;
    for (let childNumber = 1; childNumber <= childCount; childNumber += 1) {
      const child = await upsertClient({
        id: `seed-client-regular-${familyNumber}-child-${childNumber}`,
        clinicId: clinic.id,
        familyAccountId: family.id,
        externalRef: `SEED-REGULAR-${familyNumber}-CHILD-${childNumber}`,
        fullName: `Demo Child ${familyNumber + 2}-${childNumber}`,
        invoiceName: family.invoiceName,
        clientType: "CHILD",
        preferredContact: "EMAIL",
      });
      await prisma.client.update({
        where: { id: child.id },
        data: { parentAId: parentA.id, parentBId: parentB.id },
      });
      await createSeedMeeting({
        id: `seed-meeting-regular-${familyNumber}-child-${childNumber}`,
        clinicId: clinic.id,
        familyAccountId: family.id,
        subjectClientId: child.id,
        parentAId: parentA.id,
        parentBId: parentB.id,
        type: "CHILD",
        billingArrangement: "REGULAR",
        tariff: "100.00",
        recipientClientId: parentA.id,
      });
    }

    await createSeedMeeting({
      id: `seed-meeting-regular-${familyNumber}-both-1`,
      clinicId: clinic.id,
      familyAccountId: family.id,
      subjectClientId: bothParents.id,
      parentAId: parentA.id,
      parentBId: parentB.id,
      type: "BOTH_PARENTS",
      billingArrangement: "REGULAR",
      tariff: "150.00",
      recipientClientId: parentA.id,
    });
    await createSeedMeeting({
      id: `seed-meeting-regular-${familyNumber}-both-2`,
      clinicId: clinic.id,
      familyAccountId: family.id,
      subjectClientId: bothParents.id,
      parentAId: parentA.id,
      parentBId: parentB.id,
      type: "BOTH_PARENTS",
      billingArrangement: "REGULAR",
      tariff: "150.00",
      recipientClientId: parentA.id,
    });
    await createSeedMeeting({
      id: `seed-meeting-regular-${familyNumber}-parent-a`,
      clinicId: clinic.id,
      familyAccountId: family.id,
      subjectClientId: parentA.id,
      parentAId: parentA.id,
      type: "PARENT_A",
      billingArrangement: "REGULAR",
      tariff: "90.00",
      recipientClientId: parentA.id,
    });
    await createSeedMeeting({
      id: `seed-meeting-regular-${familyNumber}-parent-b`,
      clinicId: clinic.id,
      familyAccountId: family.id,
      subjectClientId: parentB.id,
      parentBId: parentB.id,
      type: "PARENT_B",
      billingArrangement: "REGULAR",
      tariff: "90.00",
      recipientClientId: parentB.id,
    });
  }

  const motherChildFamily = await upsertFamily({
    id: "seed-family-mother-child",
    clinicId: clinic.id,
    accountName: "Demo Family Single Parent",
    invoiceName: "Demo Family Single Parent",
  });
  const mother = await upsertClient({
    id: "seed-client-mother-child-mother",
    clinicId: clinic.id,
    familyAccountId: motherChildFamily.id,
    externalRef: "SEED-MOTHER-CHILD-MOTHER",
    fullName: "Demo Mom Single Parent",
    invoiceName: motherChildFamily.invoiceName,
    clientType: "PARENT",
    parentRole: "MOM",
    email: "mother.example@example.test",
    preferredContact: "WHATSAPP",
  });
  const onlyChild = await upsertClient({
    id: "seed-client-mother-child-child",
    clinicId: clinic.id,
    familyAccountId: motherChildFamily.id,
    externalRef: "SEED-MOTHER-CHILD-CHILD",
    fullName: "Demo Child Single Parent",
    invoiceName: motherChildFamily.invoiceName,
    clientType: "CHILD",
    preferredContact: "EMAIL",
  });
  const father = await upsertClient({
    id: "seed-client-mother-child-father",
    clinicId: clinic.id,
    familyAccountId: motherChildFamily.id,
    externalRef: "SEED-MOTHER-CHILD-FATHER",
    fullName: "Demo Dad Single Parent",
    invoiceName: motherChildFamily.invoiceName,
    clientType: "PARENT",
    parentRole: "DAD",
    preferredContact: "EMAIL",
  });
  await prisma.client.update({
    where: { id: onlyChild.id },
    data: { parentAId: mother.id, parentBId: father.id },
  });
  await createSeedMeeting({
    id: "seed-meeting-mother-child",
    clinicId: clinic.id,
    familyAccountId: motherChildFamily.id,
    subjectClientId: onlyChild.id,
    parentAId: mother.id,
    type: "CHILD",
    billingArrangement: "REGULAR",
    tariff: "100.00",
    recipientClientId: mother.id,
  });

  await createSplitFamily(
    clinic.id,
    "shared-single",
    "SHARED_SINGLE_INVOICE",
  );
  await createSplitFamily(
    clinic.id,
    "shared-separate",
    "SHARED_SEPARATE_INVOICES",
  );

  const relatedClients = await prisma.client.findMany({
    where: { clinicId: clinic.id },
    select: { id: true, parentAId: true, parentBId: true, clientType: true },
  });
  for (const client of relatedClients) {
    for (const parentId of [client.parentAId, client.parentBId]) {
      if (!parentId) continue;
      await prisma.clientRelation.createMany({
        data: [
          {
            clientId: parentId,
            relatedClientId: client.id,
            relationType: client.clientType === "CHILD" ? "CHILD" : "OTHER",
          },
          {
            clientId: client.id,
            relatedClientId: parentId,
            relationType: "PARENT",
          },
        ],
        skipDuplicates: true,
      });
    }
  }
  const clinicForTariffs = await prisma.clinic.findUniqueOrThrow({ where: { id: clinic.id } });
  const seededClients = await prisma.client.findMany({ where: { clinicId: clinic.id }, select: { id: true } });
  for (const client of seededClients) {
    await prisma.clientTariff.createMany({
      data: (["CHILD", "PARENT_A", "PARENT_B", "BOTH_PARENTS"] as const).map((meetingType) => ({
        clientId: client.id,
        meetingType,
        tariff: clinicForTariffs.defaultTariff,
      })),
      skipDuplicates: true,
    });
  }

  console.log(`Seeded synthetic data for ${clinic.name}.`);
}

async function upsertClient(data: {
  id: string;
  clinicId: string;
  familyAccountId: string;
  externalRef: string;
  fullName: string;
  invoiceName: string;
  clientType: "CHILD" | "PARENT" | "OTHER" | "BOTH_PARENTS";
  parentRole?: "MOM" | "DAD" | "OTHER";
  email?: string;
  phoneNumber?: string;
  preferredContact?: "WHATSAPP" | "EMAIL";
}) {
  return prisma.client.upsert({
    where: { id: data.id },
    update: {
      fullName: data.fullName,
      invoiceName: data.invoiceName,
      clientType: data.clientType,
      parentRole: data.parentRole,
    },
    create: data,
  });
}

async function upsertFamily(data: {
  id: string;
  clinicId: string;
  accountName: string;
  invoiceName: string;
}) {
  return prisma.familyAccount.upsert({
    where: { id: data.id },
    update: {
      accountName: data.accountName,
      invoiceName: data.invoiceName,
      parentOneRole: "MOM",
      parentTwoRole: "DAD",
    },
    create: {
      ...data,
      invoiceTitle: "Professional services",
      invoiceDescription: "Synthetic development invoice",
      comments: "Seed data only.",
    },
  });
}

async function createSeedMeeting(data: {
  id: string;
  clinicId: string;
  familyAccountId: string;
  subjectClientId: string;
  parentAId?: string;
  parentBId?: string;
  type: "CHILD" | "PARENT_A" | "PARENT_B" | "BOTH_PARENTS";
  billingArrangement:
    | "REGULAR"
    | "SHARED_SINGLE_INVOICE"
    | "SHARED_SEPARATE_INVOICES";
  tariff: string;
  recipientClientId: string;
  invoiceKinds?: ("SINGLE" | "PARENT_A_SHARE" | "PARENT_B_SHARE")[];
}) {
  const meeting = await prisma.meeting.upsert({
    where: { id: data.id },
    update: {},
    create: {
      id: data.id,
      clinicId: data.clinicId,
      familyAccountId: data.familyAccountId,
      subjectClientId: data.subjectClientId,
      parentAId: data.parentAId,
      parentBId: data.parentBId,
      startsAt: new Date("2026-09-11T10:00:00.000Z"),
      type: data.type,
      invoiceMeetingName: data.type === "CHILD" ? "Art therapy" : "Professional guidance",
      status: "COMPLETED",
      tariff: data.tariff,
      billingArrangement: data.billingArrangement,
    },
  });
  const participantIds =
    data.type === "BOTH_PARENTS"
      ? [data.parentAId, data.parentBId].filter((id): id is string => Boolean(id))
      : [data.subjectClientId];
  await prisma.meetingParticipant.createMany({
    data: participantIds.map((clientId) => ({ meetingId: meeting.id, clientId })),
    skipDuplicates: true,
  });

  for (const kind of data.invoiceKinds ?? ["SINGLE"]) {
    await prisma.invoice.upsert({
      where: { meetingId_kind: { meetingId: meeting.id, kind } },
      update: {},
      create: {
        clinicId: data.clinicId,
        familyAccountId: data.familyAccountId,
        meetingId: meeting.id,
        recipientClientId: data.recipientClientId,
        kind,
        amount: kind === "SINGLE" ? data.tariff : "50.00",
        description: meeting.invoiceMeetingName,
        status: "ISSUED",
        issuedAt: new Date("2026-09-11T12:00:00.000Z"),
      },
    });
  }
}

async function createSplitFamily(
  clinicId: string,
  key: string,
  billingArrangement: "SHARED_SINGLE_INVOICE" | "SHARED_SEPARATE_INVOICES",
) {
  const family = await upsertFamily({
    id: `seed-family-${key}`,
    clinicId,
    accountName: `Demo Family ${key === "shared-single" ? "Shared Single" : "Shared Separate"}`,
    invoiceName: `Demo Family ${key === "shared-single" ? "Shared Single" : "Shared Separate"}`,
  });
  const parentA = await upsertClient({
    id: `seed-client-${key}-parent-a`,
    clinicId,
    familyAccountId: family.id,
    externalRef: `SEED-${key.toUpperCase()}-PARENT-A`,
    fullName: `Demo Mom ${key === "shared-single" ? "Shared Single" : "Shared Separate"}`,
    invoiceName: family.invoiceName,
    clientType: "PARENT",
    parentRole: "MOM",
    preferredContact: "EMAIL",
  });
  const parentB = await upsertClient({
    id: `seed-client-${key}-parent-b`,
    clinicId,
    familyAccountId: family.id,
    externalRef: `SEED-${key.toUpperCase()}-PARENT-B`,
    fullName: `Demo Dad ${key === "shared-single" ? "Shared Single" : "Shared Separate"}`,
    invoiceName: family.invoiceName,
    clientType: "PARENT",
    parentRole: "DAD",
    preferredContact: "WHATSAPP",
  });
  const child = await upsertClient({
    id: `seed-client-${key}-child`,
    clinicId,
    familyAccountId: family.id,
    externalRef: `SEED-${key.toUpperCase()}-CHILD`,
    fullName: `${key} Child`,
    invoiceName: family.invoiceName,
    clientType: "CHILD",
    preferredContact: "EMAIL",
  });
  await prisma.client.update({
    where: { id: child.id },
    data: { parentAId: parentA.id, parentBId: parentB.id },
  });
  await createSeedMeeting({
    id: `seed-meeting-${key}-child`,
    clinicId,
    familyAccountId: family.id,
    subjectClientId: child.id,
    parentAId: parentA.id,
    parentBId: parentB.id,
    type: "CHILD",
    billingArrangement,
    tariff: "100.00",
    recipientClientId: parentA.id,
    invoiceKinds:
      billingArrangement === "SHARED_SINGLE_INVOICE"
        ? ["SINGLE"]
        : ["PARENT_A_SHARE", "PARENT_B_SHARE"],
  });
}

async function upsertPayer(data: {
  id: string;
  clinicId: string;
  familyAccountId: string;
  clientId: string;
  fullName: string;
}) {
  return prisma.payer.upsert({
    where: { id: data.id },
    update: {},
    create: data,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
