import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export const CODE_RE = /^PA-\d{4}-\d{4}$/;

export class ActionDto {
  @ApiProperty({ example: "giao_phong" }) @IsString() @MinLength(1) @MaxLength(40)
  actionId!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  reason?: string;

  @ApiPropertyOptional({ description: "Tên phòng hoặc tên cán bộ được giao" }) @IsOptional() @IsString() @MaxLength(120)
  target?: string;

  @ApiPropertyOptional({ description: "Ghi chú KP: cho người dân xem" }) @IsOptional() @IsBoolean()
  share?: boolean;
}

export class StepDto {
  @ApiProperty() @IsInt() @Min(0) @Max(50)
  index!: number;

  @ApiProperty({ enum: ["done", "skip", "undo"] }) @IsIn(["done", "skip", "undo"])
  op!: "done" | "skip" | "undo";

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}

export class SearchHitsDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(200) @Matches(CODE_RE, { each: true })
  codes!: string[];

  @ApiProperty() @IsString() @MaxLength(200)
  q!: string;
}

export class EditCaseDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120)
  ward!: string;

  @ApiProperty() @IsString() @MinLength(3) @MaxLength(300)
  address!: string;

  @ApiProperty() @IsString() @MinLength(10) @MaxLength(4000)
  description!: string;
}

export class SubmitDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120)
  topic!: string;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120)
  ward!: string;

  @ApiProperty() @IsString() @MinLength(3) @MaxLength(300)
  address!: string;

  @ApiProperty() @IsString() @MinLength(10) @MaxLength(4000)
  description!: string;

  @ApiProperty() @IsInt() @Min(0) @Max(10)
  photos!: number;

  @ApiProperty() @IsBoolean()
  consentShowKp!: boolean;

  @ApiProperty() @IsString() @MaxLength(120)
  onBehalfName!: string;

  @ApiProperty() @IsString() @MaxLength(20)
  onBehalfPhone!: string;
}
