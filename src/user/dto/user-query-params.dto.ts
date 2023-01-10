import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { IsOneDefined } from '@app/common/decorators/is-one-defined.decorator';
import { BasicsQueryParamsDto } from '@app/common/dto/basics-query-params.dto';
const name_group = ['fullNamesComplex', 'fullNameSimple'];
export class UserQueryParamsDto extends BasicsQueryParamsDto {
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
