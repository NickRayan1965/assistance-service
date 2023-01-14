import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from '@app/auth/dto';
import { ValidRoles } from '@app/auth/interfaces';
import { Encrypter } from '@app/common/utilities/encrypter';
import { Connection } from 'mongoose';
import { getUserAdminStub } from '@app/../test/stubs/auth/userAdmin.stub';
import { validWorkPosition } from '@app/../test/stubs/work-position/correctWorkPosition.stub';
import { UserAndUserCredentials } from '../../auth/interfaces/user-userCredentials.interface';
import { UsersAndJwts } from '../interfaces/users-and-jwts.interface';
import { User } from '@app/auth/entities/user.entity';

export const saveInDbAndGetUsersAndJwts = async (
    dbConnection: Connection,
    jwtService: JwtService,
): Promise<UsersAndJwts> => {
    // valid workposition
    const workPosition = validWorkPosition();
    await dbConnection.collection('workpositions').insertOne(workPosition);

    const usersToSave: User[] = [];
    //
    //userAdmin
    const userAdminForTheTest = getUserAdminStub({
        work_position: workPosition._id,
    });

    const userAdminCredentials: LoginUserDto = {
        email: userAdminForTheTest.email,
        password: userAdminForTheTest.password,
    };
    userAdminForTheTest.password = Encrypter.encrypt(
        userAdminForTheTest.password,
    );
    const userInDbWithAdminRoles: UserAndUserCredentials = {
        credential: userAdminCredentials,
        user: userAdminForTheTest,
    };
    usersToSave.push(userAdminForTheTest);
    const jwtWithRoles = jwtService.sign({
        id: userAdminForTheTest._id.toString(),
    });
    //
    //User Without roles
    const userWithoutRoles = getUserAdminStub({
        work_position: workPosition._id,
    });
    userWithoutRoles.roles = [];

    const userWithoutRolesCredentials: LoginUserDto = {
        email: userWithoutRoles.email,
        password: userWithoutRoles.password,
    };
    userWithoutRoles.password = Encrypter.encrypt(userWithoutRoles.password);
    const userInDbWithoutRoles: UserAndUserCredentials = {
        credential: userWithoutRolesCredentials,
        user: userWithoutRoles,
    };
    usersToSave.push(userWithoutRoles);

    const jwtWithoutRoles = jwtService.sign({
        id: userWithoutRoles._id.toString(),
    });
    //
    //User with only employed role
    const userWithOnlyEmployedRole = getUserAdminStub({
        work_position: workPosition._id,
    });
    userWithOnlyEmployedRole.roles = [ValidRoles.employed];
    const userWithOnlyEmployedRoleCredentials: LoginUserDto = {
        email: userWithOnlyEmployedRole.email,
        password: userWithOnlyEmployedRole.password,
    };
    userWithOnlyEmployedRole.password = Encrypter.encrypt(
        userWithOnlyEmployedRole.password,
    );
    const userInDbWithOnlyEmployedRole: UserAndUserCredentials = {
        credential: userWithOnlyEmployedRoleCredentials,
        user: userWithOnlyEmployedRole,
    };
    usersToSave.push(userWithOnlyEmployedRole);
    const jwtWithOnlyEmployedRole = jwtService.sign({
        id: userWithOnlyEmployedRole._id.toString(),
    });
    await dbConnection.collection('users').insertMany(usersToSave);

    return {
        work_position: workPosition._id,
        admin: {
            userInDb: userInDbWithAdminRoles,
            jwt: jwtWithRoles,
        },
        employed: {
            userInDb: userInDbWithOnlyEmployedRole,
            jwt: jwtWithOnlyEmployedRole,
        },
        noRoles: {
            userInDb: userInDbWithoutRoles,
            jwt: jwtWithoutRoles,
        },
    };
};
