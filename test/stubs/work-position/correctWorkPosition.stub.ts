import { WorkPosition } from '@app/work-position/entities/work-position.entity';
import { Types } from 'mongoose';
export const validWorkPosition = (): WorkPosition => {
    return {
        _id: new Types.ObjectId(),
        description: 'Posicion de trabajo correcta',
        name: 'Gerente General Valido',
        work_end_time: '17:00',
        work_start_time: '08:00',
        isActive: true,
    };
};
