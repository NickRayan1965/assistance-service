import {
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from 'class-validator';
import { NotFoundException } from '@nestjs/common';

export function IsOneDefined(
    groupName: string,
    validationOptions?: ValidationOptions,
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsOneDefined',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [groupName],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const object = args.object as any;
                    const groupProperties = args.constraints[0] as string[];
                    console.log({ argsConstraints: args.constraints });
                    const definedProperties = groupProperties.filter(
                        (property) => object[property] !== undefined,
                    );
                    if (definedProperties.length > 1) {
                        throw new NotFoundException(
                            `Expected only one of the following properties to be defined: ${groupProperties.join(
                                ', ',
                            )}`,
                        );
                    }
                    return true;
                },
            },
        });
    };
}
