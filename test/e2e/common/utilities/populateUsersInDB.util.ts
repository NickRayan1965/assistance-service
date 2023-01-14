import { User } from '@app/auth/entities/user.entity';
import { getRandomInt } from '@app/common/utilities/random-int.util';
import { WorkPosition } from '@app/work-position/entities/work-position.entity';
import { Connection, Types } from 'mongoose';
import { getUserAdminStub } from '@app/../test/stubs/auth/userAdmin.stub';
import { populateWorkPositionInDb } from './populateWorkPositionsInDb.util';
export class UserPopulatedOptions {
    n_work_positions: number;
    n_users: number;
    dbConnection: Connection;
}
/**
 * Create a user for a work position and if the number of users is greater than
 * the number of work positions, it assigns them random work position
 */
export const populateUsersInDbAndGetRelated = async ({
    n_work_positions,
    n_users,
    dbConnection,
}: UserPopulatedOptions) => {
    const work_positions: WorkPosition[] = await populateWorkPositionInDb(
        n_work_positions,
        dbConnection,
    );
    const users: User[] = [];
    for (let i = 0; i < work_positions.length; i++) {
        const user: User = getUserAdminStub({
            work_position: new Types.ObjectId(work_positions[i]._id),
            isActiveRandom: true,
            encrypt: true,
        });
        users.push(user);
    }
    for (let i = users.length; i < n_users; i++) {
        const user: User = getUserAdminStub({
            work_position: new Types.ObjectId(
                work_positions[getRandomInt(0, work_positions.length)]._id,
            ),
            isActiveRandom: true,
            encrypt: true,
        });
        users.push(user);
    }
    await dbConnection.collection('users').insertMany(users);
    const usersToReturn = await dbConnection
        .collection('users')
        .aggregate<User>([
            {
                $lookup: {
                    from: 'workpositions',
                    localField: 'work_position',
                    foreignField: '_id',
                    as: 'work_position',
                },
            },
            { $unwind: '$work_position' },
        ])
        .toArray();
    return usersToReturn;
};
