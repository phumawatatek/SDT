import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DB, type Db } from "../shared/persistence/db.js";

/** Health có ping DB: DB không trả lời thì 503. */
@Controller("health")
export class HealthController {
  constructor(@Inject(DB) private readonly db: Db) {}

  @Get()
  async check() {
    try {
      await this.db.execute(sql`select 1`);
    } catch {
      throw new ServiceUnavailableException({ status: "error", db: "down" });
    }
    return { status: "ok", db: "ok" };
  }
}
