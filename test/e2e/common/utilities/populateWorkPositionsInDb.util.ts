import { WorkPosition } from '@app/work-position/entities/work-position.entity';
import { Connection } from 'mongoose';
import { stubWorkPosition } from '@app/../test/stubs/work-position/random-work-position.stub';

export const populateWorkPositionInDb = async (
    n_work_positions: number,
    dbConnection: Connection,
) => {
    const work_positions: WorkPosition[] = [];
    for (let i = 0; i < n_work_positions; i++) {
        const work_position: WorkPosition = stubWorkPosition(true);
        work_positions.push(work_position);
    }
    await dbConnection.collection('workpositions').insertMany(work_positions);
    return await dbConnection
        .collection('workpositions')
        .find<WorkPosition>({})
        .toArray();
};
