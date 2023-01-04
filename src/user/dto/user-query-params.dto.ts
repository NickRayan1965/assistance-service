import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { IsOneDefined } from 'src/common/decorators/is-one-defined.decorator';
import { BasicsQueryParamsDto } from 'src/common/dto/basics-query-params.dto';

export class UserQueryParamsDto extends BasicsQueryParamsDto {
    @IsOptional()
    @IsMongoId()
    workPosition?: string;

    @IsOptional()
    @IsString()
    @IsOneDefined('nameFilter')
    fullNamesComplex?: string;
    @IsOptional()
    @IsString()
    @IsOneDefined('namesFilter')
    fullNameSimple?: string;
}
