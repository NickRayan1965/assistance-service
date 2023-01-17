import { pipelineStageToConnectToNestedObject } from '@app/common/pipeLineStages';
import { pipelineStagesByUserQueryParams } from '@app/user/utilities/pipelinesStages-by-user-query-params.util';
import { PipelineStage } from 'mongoose';
import { HourRegisterQueryParamDto } from '../dto/hour-register-query-params.dto';

export const pipelineStagesByHourRegisterQ_Params = (
    hour_register_query_params: HourRegisterQueryParamDto,
) => {
    const { limit, offset, maxDate, minDate, userId } =
        hour_register_query_params;
    let { isWithinWorkingHour, time_fulfilled } = hour_register_query_params;
    const pipelinesStages: PipelineStage[] =
        pipelineStageToConnectToNestedObject({
            from: 'users',
            localField: 'user',
            id_match: userId,
        });
    pipelinesStages.push(
        ...pipelineStagesByUserQueryParams(hour_register_query_params, true),
    );
    console.log({ maxDate, minDate });
    if (maxDate)
        pipelinesStages.push({ $match: { date: { $lte: new Date(maxDate) } } });
    if (minDate)
        pipelinesStages.push({ $match: { date: { $gte: new Date(minDate) } } });
    if (isWithinWorkingHour) {
        isWithinWorkingHour = isWithinWorkingHour === 'true';
        pipelinesStages.push({ $match: { isWithinWorkingHour } });
    }
    if (time_fulfilled) {
        time_fulfilled = time_fulfilled === 'true';
        pipelinesStages.push({ $match: { time_fulfilled } });
    }
    pipelinesStages.push({ $skip: limit * offset });
    pipelinesStages.push({ $limit: limit });
    return pipelinesStages;
};
