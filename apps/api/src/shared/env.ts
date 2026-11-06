// Nạp apps/api/.env khi chạy dev; production lấy biến môi trường từ hệ thống.
import { config } from "dotenv";

if (process.env["NODE_ENV"] !== "production") config({ quiet: true });
