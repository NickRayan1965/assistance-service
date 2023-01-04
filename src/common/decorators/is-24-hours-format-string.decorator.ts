import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
    matches,
} from 'class-validator';

export function Is24hFormatString(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'is24hFormatString',
            target: object.constructor,
            propertyName: propertyName,
            options: {
                message: `${propertyName} should be 24h format string`,
                ...validationOptions,
            },
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const relatedValue = (args.object as any)[propertyName];
                    return (
                        typeof relatedValue === 'string' &&
                        matches(
                            relatedValue,
                            new RegExp('^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
                        )
                    );
                },
            },
        });
    };
}
