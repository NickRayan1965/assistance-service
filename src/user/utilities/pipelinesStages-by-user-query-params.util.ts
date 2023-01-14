import {
    pipeLinesStageToFilterNamesComplexly,
    pipeLinesStageToFilterSimpleNames,
    pipelineStageToConnectToNestedObject,
} from '@app/common/pipeLineStages';
import { PipelineStage } from 'mongoose';
import { UserQueryParamsDto } from '../dto/user-query-params.dto';

export const pipelineStagesByUserQueryParams = (
    user_query_params: UserQueryParamsDto,
    fromHourRegisterService = false,
) => {
    const pipelinesStages: PipelineStage[] = [{ $match: {} }];
    const {
        all,
        inactive,
        limit,
        offset,
        fullNameComplex,
        workPosition,
        fullNameSimple,
    } = user_query_params;
    if (!all) pipelinesStages[0]['$match'].isActive = true;
    if (inactive) pipelinesStages[0]['$match'].isActive = false;
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
    if (!fromHourRegisterService)
        pipelinesStages.push({ $skip: limit * offset });
    if (!fromHourRegisterService) pipelinesStages.push({ $limit: limit });
    return pipelinesStages;
};
