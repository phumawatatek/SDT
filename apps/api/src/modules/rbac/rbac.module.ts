import { Module } from "@nestjs/common";
import { RbacController } from "./infrastructure/rbac.controller.js";
import { RbacRepo } from "./infrastructure/rbac.repo.js";

@Module({ controllers: [RbacController], providers: [RbacRepo] })
export class RbacModule {}
