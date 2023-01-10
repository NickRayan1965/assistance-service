import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from '@app/auth/dto';
import { ValidRoles } from '@app/auth/interfaces';
import { Encrypter } from '@app/common/utilities/encrypter';
import { Connection } from 'mongoose';
import { getUserAdminStub } from '@app/../test/stubs/auth/userAdmin.stub';
import { validWorkPosition } from '@app/../test/stubs/work-position/correctWorkPosition.stub';
import { UserAndUserCredentials } from '../auth/interfaces/user-userCredentials.interface';
import { UsersAndJwts } from '../interfaces/users-and-jwts.interface';

export const saveInDbAndGetUsersAndJwts = async (
    dbConnection: Connection,
    jwtService: JwtService,
): Promise<UsersAndJwts> => {
    // valid workposition
    const workPosition = validWorkPosition();
    //
    //userAdmin
    const userAdminForTheTest = getUserAdminStub(workPosition._id);

    const userAdminCredentials: LoginUserDto = {
        email: userAdminForTheTest.email,
        password: userAdminForTheTest.password,
    };
    userAdminForTheTest.password = Encrypter.encrypt(
        userAdminForTheTest.password,
    );
    await dbConnection.collection('users').insertOne(userAdminForTheTest);
    const userInDbWithAdminRoles: UserAndUserCredentials = {
        credential: userAdminCredentials,
        user: userAdminForTheTest,
    };
    const jwtWithRoles = jwtService.sign({
        id: userAdminForTheTest._id.toString(),
    });
    //
    //User Without roles
    const userWithoutRoles = getUserAdminStub(workPosition._id);
    userWithoutRoles.roles = [];

    const userWithoutRolesCredentials: LoginUserDto = {
        email: userWithoutRoles.email,
        password: userWithoutRoles.password,
    };
    userWithoutRoles.password = Encrypter.encrypt(userWithoutRoles.password);
    await dbConnection.collection('users').insertOne(userWithoutRoles);
    const userInDbWithoutRoles: UserAndUserCredentials = {
        credential: userWithoutRolesCredentials,
        user: userWithoutRoles,
    };
    const jwtWithoutRoles = jwtService.sign({
        id: userWithoutRoles._id.toString(),
    });
    //
    //User with only employed role
    const userWithOnlyEmployedRole = getUserAdminStub(workPosition._id);
    userWithOnlyEmployedRole.roles = [ValidRoles.employed];
    const userWithOnlyEmployedRoleCredentials: LoginUserDto = {
        email: userWithOnlyEmployedRole.email,
        password: userWithOnlyEmployedRole.password,
    };
    userWithOnlyEmployedRole.password = Encrypter.encrypt(
        userWithOnlyEmployedRole.password,
    );
    await dbConnection.collection('users').insertOne(userWithOnlyEmployedRole);
    const userInDbWithOnlyEmployedRole: UserAndUserCredentials = {
        credential: userWithOnlyEmployedRoleCredentials,
        user: userWithOnlyEmployedRole,
    };
    const jwtWithOnlyEmployedRole = jwtService.sign({
        id: userWithOnlyEmployedRole._id.toString(),
    });
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
