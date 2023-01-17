import { ValidRoles } from '@app/auth/interfaces';
import { ApiProperty } from '@nestjs/swagger';

export class UserCredentialsDto {
    @ApiProperty()
    email: string;
    @ApiProperty()
    password: string;
    @ApiProperty({ enum: ValidRoles, type: [ValidRoles] })
    roles: ValidRoles[];
}
