import { BadRequestException } from '@nestjs/common';
import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
    isBooleanString,
} from 'class-validator';
export class ValidationOptionsCustom implements ValidationOptions {
    /**
     * Specifies if validated value is an array and each of its items must be validated.
     */
    each?: boolean;
    /**
     * Error message to be used on validation fail.
     * Message can be either string or a function that returns a string.
     */
    message?: string | ((validationArguments: ValidationArguments) => string);
    /**
     * Validation groups used for this validation.
     */
    /**
     * Group of flags that values must not be true at the same time
     */
    groups?: string[];
    always?: boolean;
    context?: any;
}
/**
 Check if the query param is a flag (url..?flag=<true or false>), if not exists in the query, it makes it false, else if the value is not true or false, return false.
 Note: The data type of the property should be 'string | boolean'
 */
export function IsBooleanFlagOfQueryParams(
    validationOptions?: ValidationOptionsCustom,
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsBooleanFlagOfQueryParams',
            target: object.constructor,
            propertyName,
            options: {
                message: `the query property '${propertyName}' should be a boolean string (true, false)`,
                ...validationOptions,
            },
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const relatedObject = args.object as any;
                    const valueBefore = relatedObject[propertyName];
                    relatedObject[propertyName] =
                        typeof valueBefore == 'string' &&
                        valueBefore === 'true';
                    if (
                        validationOptions &&
                        validationOptions.groups &&
                        relatedObject[propertyName]
                    ) {
                        const values_should_no_includes_true: boolean[] = [];
                        for (const elem of validationOptions.groups) {
                            if (elem == propertyName) continue;
                            const condition =
                                relatedObject[elem] == true ||
                                relatedObject[elem] === 'true';
                            values_should_no_includes_true.push(condition);
                        }
                        if (values_should_no_includes_true.some((val) => val)) {
                            throw new BadRequestException(
                                `Cannot send more than one flag at a time from the next group [${validationOptions.groups}]`,
                            );
                        }
                    }
                    return (
                        isBooleanString(valueBefore) ||
                        typeof valueBefore == 'undefined'
                    );
                },
            },
        });
    };
}
