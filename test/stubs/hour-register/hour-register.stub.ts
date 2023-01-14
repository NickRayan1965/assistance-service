import { hourRandomGenerator } from '@app/common/utilities/hour-random-generator.util';
import { getRandomInt } from '@app/common/utilities/random-int.util';
import { HourRegister } from '@app/hour-register/entities/hour-register.entity';
import { ValidTimes } from '@app/seed/interfaces/valid-times';
import { Types } from 'mongoose';

export const getHourRegisterStub = (userId: Types.ObjectId, date: Date, isActiveRandom = false): HourRegister => {
    const start_time = hourRandomGenerator(ValidTimes.START_TIME);
    const 
    return {
        _id: new Types.ObjectId(),
        date,
        end_time,
        start_time,
        lunch_start_time,
        lunch_end_time
        user: userId,
        isActive: isActiveRandom ? getRandomInt(0, 2) == 1 : false,

    }
};