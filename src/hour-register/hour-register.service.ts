import { BadRequestException, Injectable } from '@nestjs/common';
import { HourRegisterRepository } from './hour-register.repository';
import {
    HourRegisterDocument,
    TimestampFields,
    DEFAULT_EMPY_TIME,
    HourRegister,
    LUNCH_TIME_DEFAULT,
} from './entities/hour-register.entity';
import { User } from 'src/auth/entities/user.entity';
import { WorkPosition } from 'src/work-position/entities/work-position.entity';

@Injectable()
export class HourRegisterService {
    constructor(
        private readonly hourRegisterRepository: HourRegisterRepository,
    ) {}
    #hoursError = (name_time: string) =>
        new BadRequestException(
            `La hora enviada para el campo '${name_time}' no cumple una de las siguientes condiciones [start_time<=lunch_start_time<=lunch_end_time<=end_time]`,
        );
    getOrCreateByUserIdAndDate(
        userId: string,
        date: Date,
    ): Promise<HourRegisterDocument> {
        return this.hourRegisterRepository.getOrCreateByUserIdAndDate(
            userId,
            date,
        );
    }
    async setTimestampAndGet(
        userId: string,
        date: Date,
        hour_minutes: string,
        name_time: string,
    ) {
        const timestamps_fields = Object.keys({
            lunch_end_time: DEFAULT_EMPY_TIME,
            lunch_start_time: DEFAULT_EMPY_TIME,
            start_time: DEFAULT_EMPY_TIME,
            end_time: DEFAULT_EMPY_TIME,
        } as TimestampFields);
        if (!timestamps_fields.includes(name_time))
            throw new BadRequestException(
                `El nombre del tiempo que desea marcar no existe (${name_time}), envie uno válido [${timestamps_fields.join(
                    ',',
                )}]`,
            );
        const hour_register =
            await this.hourRegisterRepository.getByUserIdAndDate(
                userId,
                date,
                true,
            );

        const number_hour_minutes = +hour_minutes.replace(':', '');
        let list_time: number[];
        const { start_time, lunch_start_time, lunch_end_time, end_time } =
            hour_register;
        if (name_time == 'start_time') {
            list_time = [
                lunch_start_time != DEFAULT_EMPY_TIME
                    ? +lunch_start_time.replace(':', '')
                    : 9999,
                lunch_end_time != DEFAULT_EMPY_TIME
                    ? +lunch_end_time.replace(':', '')
                    : 9999,
                end_time != DEFAULT_EMPY_TIME
                    ? +end_time.replace(':', '')
                    : 9999,
                number_hour_minutes,
            ];
            if (Math.min(...list_time) != number_hour_minutes)
                throw this.#hoursError(name_time);
        }
        if (name_time == 'lunch_start_time') {
            list_time = [
                lunch_end_time != DEFAULT_EMPY_TIME
                    ? +lunch_end_time.replace(':', '')
                    : 9999,
                end_time != DEFAULT_EMPY_TIME
                    ? +end_time.replace(':', '')
                    : 9999,
                number_hour_minutes,
            ];
            const number_start_time =
                start_time != DEFAULT_EMPY_TIME
                    ? +start_time.replace(':', '')
                    : -9999;
            if (
                Math.min(...list_time) != number_hour_minutes ||
                number_start_time > number_hour_minutes
            )
                throw this.#hoursError(name_time);
        }
        if (name_time == 'lunch_end_time') {
            list_time = [
                start_time != DEFAULT_EMPY_TIME
                    ? +start_time.replace(':', '')
                    : -9999,
                lunch_start_time != DEFAULT_EMPY_TIME
                    ? +lunch_start_time.replace(':', '')
                    : -9999,
                number_hour_minutes,
            ];
            const number_end_time =
                end_time != DEFAULT_EMPY_TIME
                    ? +end_time.replace(':', '')
                    : 9999;
            if (
                Math.max(...list_time) != number_hour_minutes ||
                number_end_time < number_hour_minutes
            )
                throw this.#hoursError(name_time);
        }
        if (name_time == 'end_time') {
            list_time = [
                start_time != DEFAULT_EMPY_TIME
                    ? +start_time.replace(':', '')
                    : -9999,
                lunch_start_time != DEFAULT_EMPY_TIME
                    ? +lunch_start_time.replace(':', '')
                    : -9999,
                lunch_end_time != DEFAULT_EMPY_TIME
                    ? +lunch_end_time.replace(':', '')
                    : -9999,
                number_hour_minutes,
            ];

            if (Math.max(...list_time) != number_hour_minutes)
                throw this.#hoursError(name_time);
        }
        hour_register[name_time] = hour_minutes;
        let populatedHourRegister: HourRegister = await (
            await this.hourRegisterRepository.findByIdAndUpdate(
                hour_register._id,
                hour_register,
            )
        ).populate({
            path: 'user',
            populate: { path: 'work_position' },
        });
        if (
            hour_register.start_time != DEFAULT_EMPY_TIME &&
            hour_register.end_time != DEFAULT_EMPY_TIME
        )
            populatedHourRegister = await this.checkFieldsOfHourRegister(
                populatedHourRegister,
            );
        return populatedHourRegister;
    }
    async activate(id: string): Promise<void> {
        await this.hourRegisterRepository.findByIdAndUpdate(
            id,
            { isActive: true },
            true,
        );
    }
    async deleteOne(id: string): Promise<void> {
        await this.hourRegisterRepository.findByIdAndUpdate(
            id,
            { isActive: false },
            true,
        );
    }
    private async checkFieldsOfHourRegister(
        hour_register: HourRegister,
        update = true,
    ): Promise<HourRegister> {
        console.log({ hour_register });
        const { start_time, lunch_start_time, lunch_end_time, end_time } =
            hour_register;
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
        const work_position = (hour_register.user as User)
            .work_position as WorkPosition;
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
        if (lunch_start_time_minutes && lunch_end_time_minutes) {
            const time_having_lunch =
                lunch_end_time_minutes - lunch_start_time_minutes;
            total_user_time_worked -= time_having_lunch;
            hour_register.isWithinWorkingHour = true;
        } else hour_register.isWithinWorkingHour = false;
        hour_register.time_fulfilled =
            total_user_time_worked >= total_time_by_work_position;
        if (!hour_register.time_fulfilled)
            hour_register.missing_minutes =
                total_time_by_work_position - total_user_time_worked;
        else hour_register.missing_minutes = 0;
        if (
            start_time_minutes > start_time_by_work_position ||
            end_time_minutes < end_time_by_work_position
        )
            hour_register.isWithinWorkingHour = false;
        else hour_register.isWithinWorkingHour = true;
        if (update)
            await this.hourRegisterRepository.findByIdAndUpdate(
                hour_register._id,
                {
                    isWithinWorkingHour: hour_register.isWithinWorkingHour,
                    missing_minutes: hour_register.missing_minutes,
                    time_fulfilled: hour_register.time_fulfilled,
                },
            );
        return hour_register;
    }
    private getMinutes(hour_minutes: string): number {
        const list_time = hour_minutes.split(':');
        const minutes = +list_time[0] * 60 + +list_time[1];
        return minutes;
    }
}
