import { Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

/** Đếm query — Gate 3 (số query không tăng theo số vụ). Tăng ở mọi môi trường, chi phí không đáng kể. */
export const queryCounter = { n: 0 };

export function createDb(url: string) {
  const client = postgres(url, { max: 10, debug: () => { queryCounter.n++; } });
  return { client, db: drizzle(client, { schema, casing: "snake_case" }) };
}

export type Db = ReturnType<typeof createDb>["db"];
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export const DB = Symbol("Db");
const SQL_CLIENT = Symbol("SqlClient");

export function databaseUrl(): string {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL chưa cấu hình (xem apps/api/.env.example)");
  return url;
}

class DbShutdown implements OnApplicationShutdown {
  constructor(@Inject(SQL_CLIENT) private readonly client: ReturnType<typeof postgres>) {}
  async onApplicationShutdown() {
    await this.client.end();
  }
}

/** Một kết nối Postgres cho cả app, cấp qua token `DB`. */
@Global()
@Module({
  providers: [
    { provide: SQL_CLIENT, useFactory: () => createDb(databaseUrl()).client },
    { provide: DB, useFactory: (client: ReturnType<typeof postgres>) => drizzle(client, { schema, casing: "snake_case" }), inject: [SQL_CLIENT] },
    DbShutdown,
  ],
  exports: [DB],
})
export class DatabaseModule {}
