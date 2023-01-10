import { Types } from 'mongoose';
import { UserAndUserCredentials } from '../auth/interfaces/user-userCredentials.interface';

export interface UsersAndJwts {
    work_position: Types.ObjectId;
    admin: {
        userInDb: UserAndUserCredentials;
        jwt: string;
    };
    employed: {
        userInDb: UserAndUserCredentials;
        jwt: string;
    };
    noRoles: {
        userInDb: UserAndUserCredentials;
        jwt: string;
    };
}
