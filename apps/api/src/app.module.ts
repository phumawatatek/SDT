import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { HealthController } from "./health/health.controller.js";
import { AdminModule } from "./modules/admin/admin.module.js";
import { RbacModule } from "./modules/rbac/rbac.module.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { CasesModule } from "./modules/cases/cases.module.js";
import { SessionGuard } from "./shared/auth/session.guard.js";
import { DatabaseModule } from "./shared/persistence/db.js";

@Module({
  imports: [DatabaseModule, CasesModule, AdminModule, RbacModule],
  controllers: [HealthController, AuthController],
  // Có token (cookie hoặc Bearer) thì dựng người đăng nhập cho mọi request.
  providers: [{ provide: APP_GUARD, useClass: SessionGuard }],
})
export class AppModule {}
