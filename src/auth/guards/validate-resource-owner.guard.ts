import { ForbiddenException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { ValidRoles } from '../interfaces';
interface MongoObject {
    _id: any;
    [k: string]: any;
}
export const ValidateResourceOwner = (
    requestingUser: User,
    resourse: MongoObject,
    keyUser: string,
) => {
    const rolesWithAccessToOtherResources = [ValidRoles.admin];
    if (
        requestingUser._id.toString() != resourse[keyUser].toString() &&
        !requestingUser.roles.some((role) =>
            rolesWithAccessToOtherResources.includes(role),
        )
    )
        throw new ForbiddenException(
            'El usuario no es el propietario de este recurso ni tiene los permisos para acceder al recurso',
        );
};
