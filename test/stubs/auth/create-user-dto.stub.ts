import { faker } from '@faker-js/faker';
import { CreateUserDto } from '@app/auth/dto';
import { ValidRoles } from '@app/auth/interfaces';
import { Types } from 'mongoose';

export const getCreateUserDtoStub = (
    work_position: Types.ObjectId,
): CreateUserDto => {
    return {
        email: faker.internet.email(
            faker.random.numeric(8, { allowLeadingZeros: true }),
            faker.name.lastName(),
        ),
        password: 'contraseñaAdmin1234',
        roles: [ValidRoles.admin, ValidRoles.employed],
        birth_date: new Date(2003, 0, 1),
        dni: faker.random.numeric(8, { allowLeadingZeros: true }),
        firstnames: 'NICK RAYAN',
        lastnames: 'CERRON OBREGON',
        phone_number: '999 999 888',
        salary: 1234,
        sex: 'M',
        work_position,
    };
};
