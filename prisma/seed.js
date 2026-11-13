// Creates a test user from data/workoutData.json:  test@athala.dev / test
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/db.js";
import fs from "fs";

const data = JSON.parse(
  fs.readFileSync(new URL("../data/workoutData.json", import.meta.url))
);

async function main() {
  const email = "test@athala.dev";
  await prisma.user.deleteMany({ where: { email } });
  await prisma.user.create({
    data: {
      email,
      name: data.user.name,
      passwordHash: await bcrypt.hash("test", 10),
      routines: data.routines,
      workouts: { create: data.history.map((h) => ({ date: h.date, data: h })) },
    },
  });
  console.log("test user ready: test@athala.dev / test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());