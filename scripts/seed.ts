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
    update: {},
    create: {
      id: "seed-family-rivera",
      clinicId: clinic.id,
      accountName: "Rivera family",
      invoiceName: "Rivera Family",
      invoiceTitle: "Professional services",
      invoiceDescription: "Synthetic development invoice",
      comments: "Seed data only.",
    },
  });

  const familyTwo = await prisma.familyAccount.upsert({
    where: { id: "seed-family-chen" },
    update: {},
    create: {
      id: "seed-family-chen",
      clinicId: clinic.id,
      accountName: "Chen family",
      invoiceName: "Chen Family",
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
    fullName: "Alex Rivera",
    invoiceName: "Rivera Family",
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
    fullName: "Morgan Rivera",
    invoiceName: "Rivera Family",
    clientType: "PARENT",
    email: "morgan.rivera@example.test",
    phoneNumber: "+1 555 0102",
    preferredContact: "EMAIL",
  });
  const parentBRivera = await upsertClient({
    id: "seed-client-rivera-parent-b",
    clinicId: clinic.id,
    familyAccountId: familyOne.id,
    externalRef: "SEED-RIVERA-PARENT-B",
    fullName: "Taylor Rivera",
    invoiceName: "Rivera Family",
    clientType: "PARENT",
    email: "taylor.rivera@example.test",
    phoneNumber: "+1 555 0103",
    preferredContact: "WHATSAPP",
  });
  const bothParentsRivera = await upsertClient({
    id: "seed-client-rivera-both-parents",
    clinicId: clinic.id,
    familyAccountId: familyOne.id,
    externalRef: "SEED-RIVERA-BOTH",
    fullName: "Morgan and Taylor Rivera",
    invoiceName: "Rivera Family",
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
    fullName: "Jamie Chen",
    invoiceName: "Chen Family",
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
    fullName: "Casey Chen",
    invoiceName: "Chen Family",
    clientType: "PARENT",
    email: "casey.chen@example.test",
    phoneNumber: "+1 555 0202",
    preferredContact: "WHATSAPP",
  });

  await prisma.client.update({
    where: { id: childChen.id },
    data: { parentAId: parentAChen.id },
  });

  const payerGrandparent = await prisma.payer.upsert({
    where: { id: "seed-payer-grandparent" },
    update: {},
    create: {
      id: "seed-payer-grandparent",
      clinicId: clinic.id,
      familyAccountId: familyTwo.id,
      fullName: "Jordan Chen",
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
      accountName: `Regular family ${familyNumber}`,
      invoiceName: `Regular Family ${familyNumber}`,
    });
    const parentA = await upsertClient({
      id: `seed-client-regular-${familyNumber}-parent-a`,
      clinicId: clinic.id,
      familyAccountId: family.id,
      externalRef: `SEED-REGULAR-${familyNumber}-PARENT-A`,
      fullName: `Parent A ${familyNumber}`,
      invoiceName: family.invoiceName,
      clientType: "PARENT",
      email: `regular.parent.a.${familyNumber}@example.test`,
      preferredContact: "EMAIL",
    });
    const parentB = await upsertClient({
      id: `seed-client-regular-${familyNumber}-parent-b`,
      clinicId: clinic.id,
      familyAccountId: family.id,
      externalRef: `SEED-REGULAR-${familyNumber}-PARENT-B`,
      fullName: `Parent B ${familyNumber}`,
      invoiceName: family.invoiceName,
      clientType: "PARENT",
      email: `regular.parent.b.${familyNumber}@example.test`,
      preferredContact: "WHATSAPP",
    });
    const bothParents = await upsertClient({
      id: `seed-client-regular-${familyNumber}-both-parents`,
      clinicId: clinic.id,
      familyAccountId: family.id,
      externalRef: `SEED-REGULAR-${familyNumber}-BOTH`,
      fullName: `Parents ${familyNumber}`,
      invoiceName: family.invoiceName,
      clientType: "BOTH_PARENTS",
      preferredContact: "EMAIL",
    });

    for (let childNumber = 1; childNumber <= 6; childNumber += 1) {
      const child = await upsertClient({
        id: `seed-client-regular-${familyNumber}-child-${childNumber}`,
        clinicId: clinic.id,
        familyAccountId: family.id,
        externalRef: `SEED-REGULAR-${familyNumber}-CHILD-${childNumber}`,
        fullName: `Child ${familyNumber}-${childNumber}`,
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
    accountName: "Mother and child family",
    invoiceName: "Mother and Child Family",
  });
  const mother = await upsertClient({
    id: "seed-client-mother-child-mother",
    clinicId: clinic.id,
    familyAccountId: motherChildFamily.id,
    externalRef: "SEED-MOTHER-CHILD-MOTHER",
    fullName: "Mother Example",
    invoiceName: motherChildFamily.invoiceName,
    clientType: "PARENT",
    email: "mother.example@example.test",
    preferredContact: "WHATSAPP",
  });
  const onlyChild = await upsertClient({
    id: "seed-client-mother-child-child",
    clinicId: clinic.id,
    familyAccountId: motherChildFamily.id,
    externalRef: "SEED-MOTHER-CHILD-CHILD",
    fullName: "Child Example",
    invoiceName: motherChildFamily.invoiceName,
    clientType: "CHILD",
    preferredContact: "EMAIL",
  });
  await prisma.client.update({
    where: { id: onlyChild.id },
    data: { parentAId: mother.id },
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

  console.log(`Seeded synthetic data for ${clinic.name}.`);
}

async function upsertClient(data: {
  id: string;
  clinicId: string;
  familyAccountId: string;
  externalRef: string;
  fullName: string;
  invoiceName: string;
  clientType: "CHILD" | "PARENT" | "BOTH_PARENTS";
  email?: string;
  phoneNumber?: string;
  preferredContact?: "WHATSAPP" | "EMAIL";
}) {
  return prisma.client.upsert({
    where: { id: data.id },
    update: {},
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
    update: {},
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
      status: "COMPLETED",
      tariff: data.tariff,
      billingArrangement: data.billingArrangement,
    },
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
    accountName: `${key} billing family`,
    invoiceName: `${key} Billing Family`,
  });
  const parentA = await upsertClient({
    id: `seed-client-${key}-parent-a`,
    clinicId,
    familyAccountId: family.id,
    externalRef: `SEED-${key.toUpperCase()}-PARENT-A`,
    fullName: `${key} Parent A`,
    invoiceName: family.invoiceName,
    clientType: "PARENT",
    preferredContact: "EMAIL",
  });
  const parentB = await upsertClient({
    id: `seed-client-${key}-parent-b`,
    clinicId,
    familyAccountId: family.id,
    externalRef: `SEED-${key.toUpperCase()}-PARENT-B`,
    fullName: `${key} Parent B`,
    invoiceName: family.invoiceName,
    clientType: "PARENT",
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
