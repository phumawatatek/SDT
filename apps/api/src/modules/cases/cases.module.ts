import { Module } from "@nestjs/common";
import { CASE_STORE } from "./application/case-store.port.js";
import { CaseService } from "./application/case.service.js";
import { SubmitService } from "./application/submit.service.js";
import { DrizzleCaseStore } from "./infrastructure/persistence/drizzle-case.store.js";
import { CasesController, PublicCasesController, PublicCatalogController } from "./infrastructure/restapi/cases.controller.js";

@Module({
  controllers: [CasesController, PublicCasesController, PublicCatalogController],
  providers: [CaseService, SubmitService, { provide: CASE_STORE, useClass: DrizzleCaseStore }],
})
export class CasesModule {}
