import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

/**
 Check if the string has a valid 24h format --:--
 */
@Injectable()
export class ParseHoursMinutes24FPipe implements PipeTransform {
    transform(value: string) {
        const expFormat = new RegExp('^([01]?[0-9]|2[0-3]):[0-5][0-9]$');
        if (!value.match(expFormat))
            throw new BadRequestException(
                'Las horas enviadas deben tener el formato de 24h: --:--',
            );
        return value;
    }
}
