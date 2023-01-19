import {
    populateUsersInDbAndGetRelated,
    UserPopulatedOptions,
} from './populateUsersInDB.util';
import { HourRegister } from '@app/hour-register/entities/hour-register.entity';
import { stubHourRegister } from 'test/e2e/stubs/hour-register/hour-register.stub';
import { pipelineStageToConnectToNestedObject } from '@app/common/pipeLineStages';
export class HourRegisterPopulateOptions extends UserPopulatedOptions {
    minDate: Date;
    maxDate: Date;
}

export const populateHourRegistersInDbAndGetRelated = async ({
    n_work_positions,
    n_users,
    minDate,
    maxDate,
    dbConnection,
}: HourRegisterPopulateOptions) => {
    const users = await populateUsersInDbAndGetRelated({
        dbConnection,
        n_users,
        n_work_positions,
    });
    const hourRegisters: HourRegister[] = [];
    while (minDate < maxDate) {
        for (const user of users) {
            const hour_register: HourRegister = stubHourRegister(
                user,
                minDate,
                true,
            );
            hourRegisters.push(hour_register);
        }
        minDate.setDate(minDate.getDate() + 1);
    }

    await dbConnection.collection('hourregisters').insertMany(hourRegisters);
    const hourRegistersRelatedToReturn = await dbConnection
        .collection('hourregisters')
        .aggregate<HourRegister>([
            ...pipelineStageToConnectToNestedObject({
                from: 'users',
                localField: 'user',
            }),
            ...pipelineStageToConnectToNestedObject({
                from: 'workpositions',
                localField: 'user.work_position',
            }),
        ])
        .toArray();
    return hourRegistersRelatedToReturn;
};
