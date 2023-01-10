import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { OFFSET_ALTERNATIVE, LIMIT_ALTERNATIVE } from '@app/config/app.config';
import { IsBooleanFlagOfQueryParams } from '../decorators/is-boolean-flag-of-query-params.decorator';
import { Flag } from '../interfaces/flag-true-false.enum';
const state_group = ['all', 'inactive'];
export class BasicsQueryParamsDto {
    @ApiProperty({
        type: String,
        required: false,
        description: `Bandera (vacía) que indica que se deben devolver todos los registros (activos e inactivos). Grupo [${state_group}], (no se pueden usar a la vez más de uno).`,
        enum: Flag,
    })
    @IsBooleanFlagOfQueryParams({ groups: state_group })
    all: string | boolean;

    @ApiProperty({
        type: 'Flag',
        required: false,
        description: `Bandera (vacía) que indica que se deben devolver todos los registros eliminados (inactivos). Grupo [${state_group}], (no se pueden usar a la vez más de uno).`,
        enum: Flag,
    })
    @IsBooleanFlagOfQueryParams({ groups: state_group })
    inactive: string | boolean;

    @ApiProperty({
        type: 'Integer',
        required: false,
        default: +process.env.LIMIT || LIMIT_ALTERNATIVE,
        description:
            'Cantidad de registros devueltos para la paginación. Min: 1',
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    limit: number = +process.env.LIMIT || LIMIT_ALTERNATIVE;

    @ApiProperty({
        type: 'Integer',
        required: false,
        default: +process.env.OFFSET || OFFSET_ALTERNATIVE,
        description:
            'Número de paginación (Si la paginacion (limit) es 20, y el offset es 0, devolvera los primeros 20. En cambio si es offset es 1, devolverá los siguientes 20, y asi susesivamente). Min: 0',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    offset: number = +process.env.OFFSET || OFFSET_ALTERNATIVE;
}
