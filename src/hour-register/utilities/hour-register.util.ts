import { WorkPosition } from '@app/work-position/entities/work-position.entity';
import {
    CalculatedTimeFields,
    DEFAULT_EMPY_TIME,
    LUNCH_TIME_DEFAULT,
    TimestampFields,
} from '../entities/hour-register.entity';

export class HourRegisterUtilities {
    static getMinutes(hour_minutes: string): number {
        const list_time = hour_minutes.split(':');
        const minutes = +list_time[0] * 60 + +list_time[1];
        return minutes;
    }
    static getCalculatedTimeFields(
        timestamps_fields: Partial<TimestampFields>,
        work_position: WorkPosition,
    ): CalculatedTimeFields {
        const { start_time, lunch_start_time, lunch_end_time, end_time } =
            timestamps_fields;
        const calculatedTimeFields: CalculatedTimeFields = {
            isWithinWorkingHour: false,
            missing_minutes: 0,
            time_fulfilled: false,
        };
        const start_time_minutes = this.getMinutes(start_time);
        const end_time_minutes = this.getMinutes(end_time);
        const lunch_start_time_minutes =
            lunch_start_time == DEFAULT_EMPY_TIME
                ? 0
                : this.getMinutes(lunch_start_time);
        const lunch_end_time_minutes =
            lunch_end_time == DEFAULT_EMPY_TIME
                ? 0
                : this.getMinutes(lunch_end_time);
        let total_user_time_worked = end_time_minutes - start_time_minutes;

        const start_time_by_work_position = this.getMinutes(
            work_position.work_start_time,
        );
        const end_time_by_work_position = this.getMinutes(
            work_position.work_end_time,
        );
        const total_time_by_work_position =
            end_time_by_work_position -
            start_time_by_work_position -
            LUNCH_TIME_DEFAULT;

        //si marco almuerzo, calcular tiempo, sino, poner que no cumplio su horario
        if (lunch_start_time_minutes && lunch_end_time_minutes) {
            const time_having_lunch =
                lunch_end_time_minutes - lunch_start_time_minutes;
            total_user_time_worked -= time_having_lunch;
            calculatedTimeFields.isWithinWorkingHour = true;
        } else calculatedTimeFields.isWithinWorkingHour = false;

        // se cumplio el tiempo?
        calculatedTimeFields.time_fulfilled =
            total_user_time_worked >= total_time_by_work_position;
        // si no poner cuantos minutos faltaron
        if (!calculatedTimeFields.time_fulfilled)
            calculatedTimeFields.missing_minutes =
                total_time_by_work_position - total_user_time_worked;
        else calculatedTimeFields.missing_minutes = 0;

        if (
            start_time_minutes > start_time_by_work_position ||
            end_time_minutes < end_time_by_work_position
        )
            calculatedTimeFields.isWithinWorkingHour = false;
        else calculatedTimeFields.isWithinWorkingHour = true;
        return calculatedTimeFields;
    }
}
