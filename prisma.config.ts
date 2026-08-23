import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI (db push / migrate) は直接接続 (port 5432) を使う
    url: env("DIRECT_URL"),
  },
});
