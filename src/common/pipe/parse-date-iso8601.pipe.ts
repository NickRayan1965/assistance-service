import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isISO8601 } from 'class-validator';
/**
 Check if the value is a string with the date format: YYYY-MM-DD, else throw a BadRequestException
 */
@Injectable()
export class ParseDateIso8601Pipe implements PipeTransform {
    transform(value: string) {
        if (!isISO8601(value) || value.length != 10)
            throw new BadRequestException(
                `'${value}' no tiene el formato de fecha requerido: YYYY-MM-DD`,
            );
        const date = new Date(value);
        date.setHours(24);
        return date;
    }
}
