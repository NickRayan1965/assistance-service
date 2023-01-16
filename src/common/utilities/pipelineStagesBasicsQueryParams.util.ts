import { PipelineStage } from 'mongoose';
import { BasicsQueryParamsDto } from '../dto/basics-query-params.dto';

export const pipelineStagesByQueryParams = (
    basic_query_params: BasicsQueryParamsDto,
    putLimitAndOffSet = true,
) => {
    const { all, inactive, limit, offset } = basic_query_params;
    const pipelinesStages: PipelineStage[] = [{ $match: {} }];
    if (!all) pipelinesStages[0]['$match'].isActive = true;
    if (inactive) pipelinesStages[0]['$match'].isActive = false;
    if (putLimitAndOffSet) {
        pipelinesStages.push({ $skip: limit * offset });
        pipelinesStages.push({ $limit: limit });
    }
    return pipelinesStages;
};
