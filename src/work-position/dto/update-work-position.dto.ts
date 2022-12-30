import { PartialType } from '@nestjs/swagger';
import { CreateWorkPositionDto } from './create-work-position.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateWorkPositionDto extends PartialType(CreateWorkPositionDto) {
    @IsOptional()
    @IsBoolean()
    isActive: boolean;
}
