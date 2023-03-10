import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HourRegisterRepository } from './hour-register.repository';
import {
    TimestampFields,
    DEFAULT_EMPY_TIME,
    HourRegister,
    CalculatedTimeFields,
} from './entities/hour-register.entity';
import { HourRegisterUtilities } from './utilities/hour-register.util';
import { HourRegisterQueryParamDto } from './dto/hour-register-query-params.dto';
import { pipelineStagesByHourRegisterQ_Params } from './utilities/pipelinesStages-by-hour-register-query-params.util';
import { User } from '@app/auth/entities/user.entity';
import { WorkPosition } from '@app/work-position/entities/work-position.entity';
import { ValidateResourceOwner } from '@app/auth/guards';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class HourRegisterService {
    private readonly logger = new Logger(HourRegister.name);
    constructor(
        private readonly hourRegisterRepository: HourRegisterRepository,
        private readonly schedulerRegistry: SchedulerRegistry,
    ) {}
    #hoursError = (name_time: string) =>
        new BadRequestException(
            `La hora enviada para el campo '${name_time}' no cumple una de las siguientes condiciones [start_time<=lunch_start_time<=lunch_end_time<=end_time]`,
        );
    getOrCreateByUserIdAndDate(
        userId: string,
        date: Date,
        requestingUser: User,
    ): Promise<HourRegister> {
        ValidateResourceOwner(requestingUser, { _id: userId }, '_id');
        return this.hourRegisterRepository.getOrCreateByUserIdAndDate(
            userId,
            date,
        );
    }
    findAll(
        hour_register_query_paramsDto: HourRegisterQueryParamDto,
        requestingUser: User,
    ): Promise<HourRegister[]> {
        if (hour_register_query_paramsDto.userId)
            ValidateResourceOwner(
                requestingUser,
                {
                    _id: hour_register_query_paramsDto.userId,
                },
                '_id',
            );
        const pipelinesStages = pipelineStagesByHourRegisterQ_Params(
            hour_register_query_paramsDto,
        );
        return this.hourRegisterRepository.aggregate<HourRegister>(
            pipelinesStages,
        );
    }
    async setTimestampAndGet(
        userId: string,
        date: Date,
        hour_minutes: string,
        name_time: string,
        requestingUser: User,
    ) {
        ValidateResourceOwner(
            requestingUser,
            {
                _id: userId,
            },
            '_id',
        );
        const timestamps_fields = Object.keys({
            lunch_end_time: DEFAULT_EMPY_TIME,
            lunch_start_time: DEFAULT_EMPY_TIME,
            start_time: DEFAULT_EMPY_TIME,
            end_time: DEFAULT_EMPY_TIME,
        } as TimestampFields);
        if (!timestamps_fields.includes(name_time))
            throw new BadRequestException(
                `El nombre del tiempo que desea marcar no existe (${name_time}), envie uno v??lido [${timestamps_fields.join(
                    ',',
                )}]`,
            );
        let hour_register =
            (await this.hourRegisterRepository.getByUserIdAndDate(
                userId,
                date,
                true,
            )) as HourRegister;

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
        console.log({ populatedHourRegister });
        if (
            hour_register.start_time != DEFAULT_EMPY_TIME &&
            hour_register.end_time != DEFAULT_EMPY_TIME
        ) {
            const updatedFields: CalculatedTimeFields =
                HourRegisterUtilities.getCalculatedTimeFields(
                    populatedHourRegister,
                    (populatedHourRegister.user as User)
                        .work_position as WorkPosition,
                );
            hour_register = {
                ...hour_register,
                ...updatedFields,
            };
            populatedHourRegister = {
                ...populatedHourRegister,
                ...updatedFields,
            };
            await this.hourRegisterRepository.findByIdAndUpdate(
                hour_register._id,
                hour_register,
            );
        }
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

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async deleteExpiredHourRegisters() {
        await this.hourRegisterRepository.deleteMany({ isActive: false });
        this.logger.log('Inactive HourRegister deleted');
    }
}
