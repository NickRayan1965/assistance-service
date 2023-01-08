import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserSeed {
    @ApiProperty({
        description: 'UserName para ejecutar la Seed',
        nullable: false,
    })
    @IsString()
    user_seed: string;
    @ApiProperty({
        description: 'Contraseña para ejecutar la Seed',
        nullable: false,
    })
    @IsString()
    pwd_seed: string;
}
