import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf,
} from "class-validator";

export const ROLES = ["citizen", "kp", "canbo", "truongphong", "dieuphoi", "phochutich", "chutich", "admin"] as const;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MSG = { message: "Ngày dạng YYYY-MM-DD" };

export class UserDto {
  @ApiProperty() @IsString() @Matches(/^[a-z0-9_.]{3,32}$/, { message: "Tên đăng nhập 3–32 ký tự a-z, 0-9, _ ." })
  username!: string;

  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120)
  title!: string;

  /** Vai trò (bảng roles). Loại vai trò (`users.role`) lấy theo vai trò này. */
  @ApiProperty() @IsInt() @Min(1)
  roleId!: number;

  @ApiPropertyOptional({ nullable: true }) @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt()
  unitId?: number | null;

  @ApiPropertyOptional({ nullable: true }) @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt()
  wardId?: number | null;

  @ApiPropertyOptional({ nullable: true }) @IsOptional() @ValidateIf((_, v) => v !== null && v !== "") @Matches(/^0\d{9}$/, { message: "SĐT 10 số, bắt đầu bằng 0" })
  phone?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;
}

export class CreateUserDto extends UserDto {
  @ApiProperty() @IsString() @MinLength(6) @MaxLength(128)
  password!: string;
}

export class UpdateUserDto extends PartialType(UserDto) {}

export class PasswordDto {
  @ApiProperty() @IsString() @MinLength(6) @MaxLength(128)
  password!: string;
}

export class TopicDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ nullable: true, description: "null = vào hàng chờ điều phối" }) @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt()
  defaultUnitId?: number | null;

  @ApiPropertyOptional({ nullable: true }) @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(80)
  flag?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  sensitive?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  urgent?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(60)
  slaDays?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;
}

export class UpdateTopicDto extends PartialType(TopicDto) {}

export class WardDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;
}

export class UpdateWardDto extends PartialType(WardDto) {}

export class AssignmentDto {
  @ApiProperty() @IsInt()
  userId!: number;

  @ApiProperty() @IsInt()
  unitId!: number;

  @ApiProperty() @IsInt()
  topicId!: number;

  @ApiPropertyOptional({ nullable: true, description: "null = toàn phường" }) @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt()
  wardId?: number | null;

  @ApiProperty() @Matches(DATE, DATE_MSG)
  fromDate!: string;

  @ApiPropertyOptional({ nullable: true }) @IsOptional() @ValidateIf((_, v) => v !== null && v !== "") @Matches(DATE, DATE_MSG)
  toDate?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;
}

export class UpdateAssignmentDto extends PartialType(AssignmentDto) {}

export class DelegationDto {
  @ApiProperty() @IsInt()
  fromUserId!: number;

  @ApiProperty() @IsInt()
  toUserId!: number;

  @ApiProperty() @Matches(DATE, DATE_MSG)
  startDate!: string;

  @ApiProperty() @Matches(DATE, DATE_MSG)
  endDate!: string;

  @ApiPropertyOptional({ nullable: true }) @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(300)
  note?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  active?: boolean;
}

export class UpdateDelegationDto extends PartialType(DelegationDto) {}

export class HolidayDto {
  @ApiProperty() @Matches(DATE, DATE_MSG)
  date!: string;

  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120)
  name!: string;
}
