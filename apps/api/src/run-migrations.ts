// Chạy migration Drizzle (thư mục drizzle/) — dùng cho dev, CI, deploy.
import "./shared/env.js";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { databaseUrl } from "./shared/persistence/db.js";

const client = postgres(databaseUrl(), { max: 1, onnotice: () => {} });
await migrate(drizzle(client), { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
await client.end();
console.log("Migration xong.");
