import { LoginUserDto } from '@app/auth/dto';
import { User } from '@app/auth/entities/user.entity';

export interface UserAndUserCredentials {
    credential: LoginUserDto;
    user: User;
}
