import {
    IsDate,
    IsEmail,
    IsEmpty,
    IsEnum,
    IsMongoId,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsUppercase,
    Length,
    Min,
    MinLength,
} from 'class-validator';
import { Sex, ValidRoles } from '../interfaces';
import { ApiProperty } from '@nestjs/swagger';
import {
    DEFAULT_MIN_SALARY,
    DEFAULT_USER_ROLES,
} from '../entities/user.entity';
import { Types } from 'mongoose';

export class CreateUserDto {
    @ApiProperty({
        description: "Email para el usuario, solo email's válidos",
        uniqueItems: true,
        required: true,
    })
    @IsString()
    @IsEmail()
    readonly email: string;

    @ApiProperty({
        description: 'Contraseña para el usuario',
        minLength: 6,
        required: true,
    })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ minLength: 1, required: true })
    @IsString()
    @MinLength(1)
    @IsUppercase()
    firstnames: string;

    @ApiProperty({ minLength: 1, required: true })
    @IsString()
    @MinLength(1)
    @IsUppercase()
    lastnames: string;

    @ApiProperty({ minLength: 8, maxLength: 8, required: true })
    @IsString()
    @Length(8, 8)
    dni: string;

    @ApiProperty({ enum: Sex, required: true })
    @IsEnum(Sex)
    sex: string;

    @ApiProperty({
        required: true,
        format: 'Iso8601',
    })
    @IsDate()
    birth_date: Date;

    @ApiProperty({
        required: true,
        description: 'Números telefónicos peruanos',
        examples: [
            '999 999 999',
            '01 734 9342',
            '+51 999 999 999',
            '990990990',
        ],
    })
    @IsPhoneNumber('PE', {
        message: 'phone_number must be a valid peruvian phone number',
    })
    phone_number: string;

    @ApiProperty({ required: true, minimum: DEFAULT_MIN_SALARY })
    @IsNumber()
    @Min(DEFAULT_MIN_SALARY)
    salary: number;

    @ApiProperty({
        description: 'Lista de roles del usuario',
        type: [String],
        enum: ValidRoles,
        required: false,
        default: DEFAULT_USER_ROLES,
    })
    @IsOptional()
    @IsEnum(ValidRoles, { each: true })
    roles?: ValidRoles[];

    @IsMongoId()
    work_position: Types.ObjectId;

    @IsEmpty()
    createdAt: Date;

    @IsEmpty()
    updatedAt: Date;
}
