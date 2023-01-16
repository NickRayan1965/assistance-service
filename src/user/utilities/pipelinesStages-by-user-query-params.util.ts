import {
    pipeLinesStageToFilterNamesComplexly,
    pipeLinesStageToFilterSimpleNames,
    pipelineStageToConnectToNestedObject,
} from '@app/common/pipeLineStages';
import { pipelineStagesByQueryParams } from '@app/common/utilities/pipelineStagesBasicsQueryParams.util';
import { PipelineStage } from 'mongoose';
import { UserQueryParamsDto } from '../dto/user-query-params.dto';

export const pipelineStagesByUserQueryParams = (
    user_query_params: UserQueryParamsDto,
    fromHourRegisterService = false,
) => {
    const pipelinesStages: PipelineStage[] = pipelineStagesByQueryParams(
        user_query_params,
        false,
    );
    const { fullNameComplex, workPosition, fullNameSimple } = user_query_params;

    const workPositionPipelinesStages = pipelineStageToConnectToNestedObject({
        from: 'workpositions',
        localField: fromHourRegisterService
            ? 'user.work_position'
            : 'work_position',
        id_match: workPosition,
    });
    pipelinesStages.push(...workPositionPipelinesStages);

    if (fullNameComplex) {
        pipelinesStages.push(
            ...pipeLinesStageToFilterNamesComplexly(
                fullNameComplex,
                'firstnames',
                'lastnames',
            ),
        );
    }
    if (fullNameSimple) {
        pipelinesStages.push(
            ...pipeLinesStageToFilterSimpleNames(
                fullNameSimple,
                'firstnames',
                'lastnames',
            ),
        );
    }
    if (!fromHourRegisterService) {
        const { limit, offset } = user_query_params;
        pipelinesStages.push({ $skip: limit * offset });
        pipelinesStages.push({ $limit: limit });
    }
    return pipelinesStages;
};
