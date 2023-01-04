import { PipelineStage, Types } from 'mongoose';
export interface LookupOptions {
    from: string;
    localField: string;
    foreignField?: string;
    as?: string;
    id_match?: string;
}
export const pipelineStageToConnectToNestedObject = ({
    from,
    localField,
    foreignField = '_id',
    as = localField,
    id_match,
}: LookupOptions): PipelineStage[] => {
    const pipeLineStages: PipelineStage[] = [
        {
            $lookup: {
                from,
                localField,
                foreignField,
                as,
            },
        },
        {
            $unwind: `$${as}`,
        },
    ];
    if (id_match) {
        pipeLineStages.push({
            $match: {
                [as + `.${foreignField}`]: new Types.ObjectId(foreignField),
            },
        });
    }
    return pipeLineStages;
};
