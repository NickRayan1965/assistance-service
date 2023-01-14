import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';
import { CreateUserDto } from '@app/auth/dto';
import { Types } from 'mongoose';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @IsBoolean()
    isActive: boolean;
    @IsOptional()
    @IsMongoId()
    work_position: string | Types.ObjectId;
}
