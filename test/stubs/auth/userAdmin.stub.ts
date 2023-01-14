import { faker } from '@faker-js/faker';
import { User } from '@app/auth/entities/user.entity';
import { ValidRoles } from '@app/auth/interfaces';
import { Types } from 'mongoose';
import { getRandomInt } from '@app/common/utilities/random-int.util';
import { Encrypter } from '@app/common/utilities/encrypter';
export class UserAdminStubOptions {
    work_position: Types.ObjectId;
    isActiveRandom: boolean;
    encrypt: boolean;
}
export const getUserAdminStub = ({
    work_position,
    encrypt = false,
    isActiveRandom = false,
}: Partial<UserAdminStubOptions>): User => {
    const _id = new Types.ObjectId();
    const sex = getRandomInt(0, 2) == 1 ? 'female' : 'male';
    const pwd = 'contraseñaAdmin1234';
    return {
        _id,
        email: `${_id}@gmail.com`,
        password: encrypt ? Encrypter.encrypt(pwd) : pwd,
        roles: [ValidRoles.admin, ValidRoles.employed],
        birth_date: new Date(2003, 5, 6),
        createdAt: new Date(),
        updatedAt: new Date(),
        dni: faker.random.numeric(8, { allowLeadingZeros: true }),
        firstnames: faker.name.firstName(sex).toUpperCase(),
        lastnames: 'APELLIDOS',
        phone_number: '+51 999 999 999',
        salary: 4447,
        sex: sex == 'male' ? 'M' : 'F',
        work_position,
        isActive: isActiveRandom ? getRandomInt(0, 2) == 1 : true,
    };
};
