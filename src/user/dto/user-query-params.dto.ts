import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { IsOneDefined } from '@app/common/decorators/is-one-defined.decorator';
import { BasicsQueryParamsDto } from '@app/common/dto/basics-query-params.dto';
//import { hour_register_group } from '@app/hour-register/dto/hour-register-query-params.dto';
const name_group = ['fullNamesComplex', 'fullNameSimple'];
export const hour_register_group = ['workPosition', 'user'];
export class UserQueryParamsDto extends BasicsQueryParamsDto {
    @IsOneDefined(hour_register_group)
    @IsOptional()
    @IsMongoId()
    workPosition?: string;

    @IsOptional()
    @IsString()
    @IsOneDefined(name_group)
    fullNameComplex?: string;
    @IsOptional()
    @IsString()
    @IsOneDefined(name_group)
    fullNameSimple?: string;
}
