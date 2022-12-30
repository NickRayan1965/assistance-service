import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MinLength } from 'class-validator';

export class CreateWorkPositionDto {
    @ApiProperty({ required: true, uniqueItems: true, minLength: 1 })
    @IsString()
    @MinLength(1)
    name: string;

    @ApiProperty({ required: true, minLength: 1 })
    @IsString()
    @MinLength(1)
    description: string;

    @ApiProperty({
        format: 'hh:mm',
        description: 'Hora de inicio de trabajo',
        minLength: 4,
        maxLength: 5,
        required: true,
    })
    @IsString()
    @Length(4, 5)
    work_start_time: string;

    @ApiProperty({
        format: 'hh:mm',
        description: 'Hora de final de trabajo',
        minLength: 4,
        maxLength: 5,
        required: true,
    })
    @IsString()
    @Length(4, 5)
    work_end_time: string;
}
