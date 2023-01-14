import { IsOneDefined } from '@app/common/decorators/is-one-defined.decorator';
import {
    hour_register_group,
    UserQueryParamsDto,
} from '@app/user/dto/user-query-params.dto';
import {
    IsBooleanString,
    IsDateString,
    IsMongoId,
    IsOptional,
} from 'class-validator';

export class HourRegisterQueryParamDto extends UserQueryParamsDto {
    @IsOptional()
    @IsMongoId()
    @IsOneDefined(hour_register_group)
    userId?: string;

    @IsOptional()
    @IsBooleanString()
    time_fulfilled?: string | boolean;

    @IsOptional()
    @IsBooleanString()
    isWithinWorkingHour?: string | boolean;

    @IsOptional()
    @IsDateString()
    minDate: string | Date;

    @IsOptional()
    @IsDateString()
    maxDate: string | Date;
}
