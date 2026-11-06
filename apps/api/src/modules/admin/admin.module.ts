import { Module } from "@nestjs/common";
import { AdminController } from "./infrastructure/admin.controller.js";
import { AdminRepo } from "./infrastructure/admin.repo.js";

@Module({ controllers: [AdminController], providers: [AdminRepo] })
export class AdminModule {}
