import { defineConfig, env } from "prisma/config";
import { config as loadEnv } from "dotenv";

// Load environment variables (supports .env.local for Next.js)
loadEnv({ path: ".env.local" });
loadEnv(); // fallback to default .env

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
