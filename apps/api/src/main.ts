import "reflect-metadata";
import "./shared/env.js";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { createValidationPipe } from "./shared/http/validation.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(createValidationPipe());

  // OpenAPI là hợp đồng BE / FE: Swagger UI ở /api/docs, JSON ở /api/docs-json, trừ production.
  if (process.env["NODE_ENV"] !== "production") {
    const config = new DocumentBuilder().setTitle("SDT PAKN API").setVersion("0.1").build();
    SwaggerModule.setup("api/docs", app, () => SwaggerModule.createDocument(app, config), { jsonDocumentUrl: "api/docs-json" });
  }
  app.enableShutdownHooks();
  await app.listen(Number(process.env["PORT"] ?? 3001));
}

void bootstrap();
