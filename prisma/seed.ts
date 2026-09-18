import { PrismaClient, Role, MessageType, MessageStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Rewrite legacy demo copy left in databases seeded by older versions (idempotent)
  const legacyText: Record<string, string> = {
    "Hey Alice! Are we deploying the new WhatsApp clone to Railway today?":
      "Hey Alice! Are we shipping the new release today?",
    "Yes! Next.js fullstack with WebSockets is ready to deploy! 🚀":
      "Yes! Everything is tested and ready to go 🚀",
    "Welcome everyone to the WhatsApp Clone Dev Team! Admin dashboard & WebSockets are active.":
      "Welcome to the team channel! Use this group for announcements and updates.",
    "UI looks sleek! Dark mode matches WhatsApp Web perfectly.":
      "Thanks! Looking forward to working with everyone.",
  };
  for (const [from, to] of Object.entries(legacyText)) {
    await prisma.message.updateMany({ where: { content: from }, data: { content: to } });
  }
  await prisma.chat.updateMany({ where: { name: "🚀 Dev Team Announcements" }, data: { name: "Team Announcements" } });
  await prisma.user.updateMany({
    where: { statusMessage: "Hey there! I am using WhatsApp." },
    data: { statusMessage: "Available" },
  });

  // Set SEED_DEMO_DATA=false to stop (re)creating the sample accounts and chats,
  // e.g. once real users are on the site and the sample accounts have been deleted.
  if (process.env.SEED_DEMO_DATA === "false") {
    console.log("⏭️  SEED_DEMO_DATA=false, skipping sample data");
    return;
  }

  console.log("🌱 Seeding database...");

  // Password hashes
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("password123", 10);

  // 1. Create Users
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      phone: "+10000000000",
      username: "admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=admin",
      statusMessage: "System Administrator • Online 24/7",
    },
  });

  const alice = await prisma.user.upsert({
    where: { username: "alice" },
    update: {},
    create: {
      phone: "+10000000001",
      username: "alice",
      passwordHash: userPassword,
      role: Role.USER,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
      statusMessage: "Coding the next big thing 🚀",
    },
  });

  const bob = await prisma.user.upsert({
    where: { username: "bob" },
    update: {},
    create: {
      phone: "+10000000002",
      username: "bob",
      passwordHash: userPassword,
      role: Role.USER,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
      statusMessage: "Available | Coffee lover ☕",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { username: "charlie" },
    update: {},
    create: {
      phone: "+10000000003",
      username: "charlie",
      passwordHash: userPassword,
      role: Role.USER,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
      statusMessage: "Design is not just what it looks like.",
    },
  });

  console.log("✅ Users created: admin, alice, bob, charlie");

  // Seed runs on every container start (see Dockerfile), so only create sample chats once
  if ((await prisma.chat.count()) > 0) {
    console.log("⏭️  Chats already exist, skipping sample chats");
    return;
  }

  // 2. Create 1-on-1 Chat between Alice and Bob
  const directChat = await prisma.chat.create({
    data: {
      isGroup: false,
      participants: {
        create: [
          { userId: alice.id, role: "MEMBER" },
          { userId: bob.id, role: "MEMBER" },
        ],
      },
    },
  });

  const m1 = await prisma.message.create({
    data: {
      chatId: directChat.id,
      senderId: bob.id,
      content: "Hey Alice! Are we shipping the new release today?",
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    },
  });

  const m2 = await prisma.message.create({
    data: {
      chatId: directChat.id,
      senderId: alice.id,
      content: "Yes! Everything is tested and ready to go 🚀",
      status: MessageStatus.READ,
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
  });

  // Add reaction to m2
  await prisma.messageReaction.create({
    data: {
      messageId: m2.id,
      userId: bob.id,
      emoji: "🔥",
    },
  });

  // 3. Create Group Chat: "Team Announcements"
  const groupChat = await prisma.chat.create({
    data: {
      isGroup: true,
      name: "Team Announcements",
      avatarUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=devteam",
      participants: {
        create: [
          { userId: adminUser.id, role: "ADMIN" },
          { userId: alice.id, role: "MEMBER" },
          { userId: bob.id, role: "MEMBER" },
          { userId: charlie.id, role: "MEMBER" },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      chatId: groupChat.id,
      senderId: adminUser.id,
      content: "Welcome to the team channel! Use this group for announcements and updates.",
      status: MessageStatus.DELIVERED,
      createdAt: new Date(Date.now() - 1800000), // 30 mins ago
    },
  });

  await prisma.message.create({
    data: {
      chatId: groupChat.id,
      senderId: charlie.id,
      content: "Thanks! Looking forward to working with everyone.",
      status: MessageStatus.DELIVERED,
      createdAt: new Date(Date.now() - 600000), // 10 mins ago
    },
  });

  console.log("✅ Chats, groups, and sample messages seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
