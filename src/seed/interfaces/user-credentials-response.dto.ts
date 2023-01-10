import { ValidRoles } from '@app/auth/interfaces';

export interface UserCredentialsDto {
    email: string;
    password: string;
    roles: ValidRoles[];
}
