import {
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from 'class-validator';
import { NotFoundException } from '@nestjs/common';

export function IsOneDefined(
    groupName: string[],
    validationOptions?: ValidationOptions,
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsOneDefined',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(_: any, args: ValidationArguments) {
                    const object = args.object as any;
                    const definedProperties = groupName.filter(
                        (property) => object[property] !== undefined,
                    );
                    if (definedProperties.length > 1) {
                        throw new NotFoundException(
                            `Expected only one of the following properties to be defined: ${groupName.join(
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
