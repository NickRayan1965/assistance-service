import { ValidRoles } from 'src/auth/interfaces';

export interface UserCredentialsDto {
    email: string;
    password: string;
    roles: ValidRoles[];
}
