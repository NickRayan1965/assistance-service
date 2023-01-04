import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUppercase, MinLength } from 'class-validator';
import { Is24hFormatString } from 'src/common/decorators/is-24-hours-format-string.decorator';

export class CreateWorkPositionDto {
    @ApiProperty({ required: true, uniqueItems: true, minLength: 1 })
    @IsString()
    @MinLength(1)
    @IsUppercase()
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
    @Is24hFormatString()
    work_start_time: string;

    @ApiProperty({
        format: 'hh:mm',
        description: 'Hora de final de trabajo',
        minLength: 4,
        maxLength: 5,
        required: true,
    })
    @IsString()
    @Is24hFormatString()
    work_end_time: string;
}
