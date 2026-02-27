import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed users (use these Clerk IDs only for local seed; real users get real Clerk IDs)
  const u1 = await prisma.user.upsert({
    where: { clerkUserId: "seed_user_1" },
    create: {
      clerkUserId: "seed_user_1",
      email: "alice@example.com",
      name: "Alice Smith",
      phone: "+1 555 111 0001",
    },
    update: { name: "Alice Smith", phone: "+1 555 111 0001" },
  });
  const u2 = await prisma.user.upsert({
    where: { clerkUserId: "seed_user_2" },
    create: {
      clerkUserId: "seed_user_2",
      email: "bob@example.com",
      name: "Bob Jones",
      phone: "+1 555 222 0002",
    },
    update: { name: "Bob Jones", phone: "+1 555 222 0002" },
  });
  const u3 = await prisma.user.upsert({
    where: { clerkUserId: "seed_user_3" },
    create: {
      clerkUserId: "seed_user_3",
      email: "carol@example.com",
      name: "Carol Lee",
      phone: "+1 555 333 0003",
    },
    update: { name: "Carol Lee", phone: "+1 555 333 0003" },
  });

  // Root group
  let root = await prisma.group.findFirst({
    where: { name: "Engineering", parentGroupId: null },
  });
  if (!root) {
    root = await prisma.group.create({
      data: { name: "Engineering", description: "Engineering team" },
    });
  }

  let frontend = await prisma.group.findFirst({
    where: { name: "Frontend", parentGroupId: root.id },
  });
  if (!frontend) {
    frontend = await prisma.group.create({
      data: {
        name: "Frontend",
        description: "Frontend squad",
        parentGroupId: root.id,
      },
    });
  }

  let backend = await prisma.group.findFirst({
    where: { name: "Backend", parentGroupId: root.id },
  });
  if (!backend) {
    backend = await prisma.group.create({
      data: {
        name: "Backend",
        description: "Backend squad",
        parentGroupId: root.id,
      },
    });
  }

  // Memberships
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: u1.id, groupId: root.id } },
    create: { userId: u1.id, groupId: root.id, role: "admin" },
    update: {},
  });
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: u2.id, groupId: root.id } },
    create: { userId: u2.id, groupId: root.id, role: "member" },
    update: {},
  });
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: u2.id, groupId: frontend.id } },
    create: { userId: u2.id, groupId: frontend.id, role: "admin" },
    update: {},
  });
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: u3.id, groupId: backend.id } },
    create: { userId: u3.id, groupId: backend.id, role: "member" },
    update: {},
  });

  // Pages
  const existingPage1 = await prisma.page.findFirst({
    where: { groupId: root.id, title: "Engineering Handbook" },
  });
  if (!existingPage1) {
    await prisma.page.create({
      data: {
        groupId: root.id,
        title: "Engineering Handbook",
        description: "Team practices and onboarding",
      },
    });
  }
  const existingPage2 = await prisma.page.findFirst({
    where: { groupId: frontend.id, title: "Component Library" },
  });
  if (!existingPage2) {
    await prisma.page.create({
      data: {
        groupId: frontend.id,
        title: "Component Library",
        description: "Shared UI components",
      },
    });
  }

  // Extra page for Backend group
  const backendPage = await prisma.page.findFirst({
    where: { groupId: backend.id, title: "API Guidelines" },
  });
  if (!backendPage) {
    await prisma.page.create({
      data: {
        groupId: backend.id,
        title: "API Guidelines",
        description: "REST and internal API standards",
      },
    });
  }

  console.log("Seed complete: users 3, groups 3, memberships 4, pages 3");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
