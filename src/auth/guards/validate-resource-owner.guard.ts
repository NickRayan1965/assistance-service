import { ForbiddenException } from '@nestjs/common';
import { UserDocument } from '../entities/user.entity';
import { ValidRoles } from '../interfaces';
interface MongoObject {
    _id: any;
    [k: string]: any;
}
export const ValidateResourceOwner = (
    user: UserDocument,
    resourse: MongoObject,
    keyUser: string,
) => {
    const rolesWithAccessToOtherResources = [ValidRoles.admin];
    if (
        user._id != resourse[keyUser] &&
        !user.roles.some((role) =>
            rolesWithAccessToOtherResources.includes(role),
        )
    )
        throw new ForbiddenException(
            'El usuario no es el propietario de este recurso ni tiene los permisos para acceder al recurso',
        );
};
