import { PipelineStage } from 'mongoose';

export const pipeLinesStageToFilterSimpleNames = (
    userNameToFilter: string,
    ...fieldsToConcat: string[]
): PipelineStage[] => {
    userNameToFilter = userNameToFilter.toLowerCase().trim();
    while (userNameToFilter.includes('  '))
        userNameToFilter = userNameToFilter.replace('  ', ' ');
    if (userNameToFilter == ' ') return [];
    const fullNameConcatList = fieldsToConcat
        .join('/ /')
        .split('/')
        .map((field) => (field == ' ' ? field : { $toLower: `$${field}` }));
    const pipeLinesStage: PipelineStage[] = [
        {
            $addFields: {
                fullName: { $concat: fullNameConcatList },
            },
        },
        {
            $match: { fullName: { $regex: userNameToFilter } },
        },
        {
            $project: { fullName: false },
        },
    ];
    return pipeLinesStage;
};
