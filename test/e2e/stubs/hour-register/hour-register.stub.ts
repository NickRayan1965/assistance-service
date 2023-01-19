import { User } from '@app/auth/entities/user.entity';
import { hourRandomGenerator } from '@app/common/utilities/hour-random-generator.util';
import { getRandomInt } from '@app/common/utilities/random-int.util';
import { HourRegister } from '@app/hour-register/entities/hour-register.entity';
import { HourRegisterUtilities } from '@app/hour-register/utilities/hour-register.util';
import { ValidTimes } from '@app/seed/interfaces/valid-times';
import { WorkPosition } from '@app/work-position/entities/work-position.entity';
import { Types } from 'mongoose';

export const stubHourRegister = (
    user: User,
    date: Date,
    isActiveRandom = false,
): HourRegister => {
    const start_time = hourRandomGenerator(ValidTimes.START_TIME);
    const end_time = hourRandomGenerator(ValidTimes.END_TIME);
    const lunch_start_time = hourRandomGenerator(ValidTimes.LUNCH_START);
    const lunch_end_time = hourRandomGenerator(ValidTimes.LUNCH_END);
    const calculatedTimeFields = HourRegisterUtilities.getCalculatedTimeFields(
        { start_time, end_time, lunch_end_time, lunch_start_time },
        user.work_position as WorkPosition,
    );
    return {
        _id: new Types.ObjectId(),
        date,
        end_time,
        start_time,
        lunch_start_time,
        lunch_end_time,
        user: new Types.ObjectId(user._id),
        isActive: isActiveRandom ? getRandomInt(0, 2) == 1 : false,
        ...calculatedTimeFields,
    };
};
