import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsIn, IsString, MaxLength, MinLength } from "class-validator";
import { ROLES } from "../../admin/restapi/dto.js";
import type { Scope } from "../domain/permissions.js";

const SCOPES = ["own", "ward", "assigned", "unit", "all", "none"] as const satisfies readonly Scope[];

export class RoleDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(80)
  name!: string;

  @ApiProperty({ enum: ROLES, description: "Loại vai trò gốc: quyết định giao diện và hồ sơ (đơn vị, khu phố). Không đổi được sau khi tạo." })
  @IsIn(ROLES)
  kind!: (typeof ROLES)[number];

  @ApiProperty({ enum: SCOPES }) @IsIn(SCOPES)
  scope!: Scope;

  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) @MaxLength(40, { each: true })
  perms!: string[];
}

export class UpdateRoleDto extends PartialType(OmitType(RoleDto, ["kind"] as const)) {}
