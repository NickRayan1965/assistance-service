import { hourRandomGenerator } from '@app/common/utilities/hour-random-generator.util';
import { getRandomInt } from '@app/common/utilities/random-int.util';
import { ValidTimes } from '@app/seed/interfaces/valid-times';
import { WorkPosition } from '@app/work-position/entities/work-position.entity';
import { Types } from 'mongoose';
export const stubWorkPosition = (isActiveRandom = false): WorkPosition => {
    const _id = new Types.ObjectId();
    return {
        _id,
        description: 'DESCRIPCION DE LA POSICIÓN DE TRABAJO',
        name: `POSICION DE TRABAJO ${_id}`,
        work_end_time: hourRandomGenerator(ValidTimes.END_TIME),
        work_start_time: hourRandomGenerator(ValidTimes.START_TIME),
        isActive: isActiveRandom ? getRandomInt(0, 2) == 1 : false,
    };
};
