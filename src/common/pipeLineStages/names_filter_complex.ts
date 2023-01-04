import { PipelineStage } from 'mongoose';

export const pipeLinesStageToFilterNamesComplexly = (
    completeNameToFilter: string,
    ...fieldsToConcat: string[]
) => {
    completeNameToFilter = completeNameToFilter.toLowerCase().trim();
    while (completeNameToFilter.includes('  '))
        completeNameToFilter = completeNameToFilter.replace('  ', ' ');

    const namesList = completeNameToFilter.split(' ');

    //["campoPrimerNombre", "campoSegundoNombre", "campoPrimerApellido"] => [{$toLower: "$campoPrimerNombre"}, " " ,{$toLower: "$campoSegundoNombre"}, " " ...]
    const fullNameConcatList = fieldsToConcat
        .join('/ /')
        .split('/')
        .map((field) => (field == ' ' ? field : { $toLower: `$${field}` }));

    const is_in_the_list_of_names_conditions = namesList.map((name: string) => {
        return {
            $cond: {
                if: {
                    $in: [name, `$fullNameArray`],
                },
                then: 1,
                else: 0,
            },
        };
    });

    namesList.push(completeNameToFilter);

    const is_in_the_full_name_comodin_filter = namesList.map((name) => {
        return {
            $cond: {
                if: { $ne: [{ $indexOfBytes: ['$fullName', name] }, -1] },
                then: 1,
                else: 0,
            },
        };
    });
    const pipeLinesStage: PipelineStage[] = [
        {
            $addFields: {
                fullName: { $concat: fullNameConcatList },
            },
        },
        {
            $addFields: {
                fullNameArray: {
                    $split: ['$fullName', ' '],
                },
            },
        },
        {
            $addFields: {
                coincidencias: {
                    $add: [
                        ...is_in_the_list_of_names_conditions,
                        ...is_in_the_full_name_comodin_filter,
                    ],
                },
            },
        },
        {
            $match: {
                coincidencias: { $gt: 0 },
            },
        },
        {
            $sort: { coincidencias: -1 },
        },
        {
            $project: {
                coincidencias: false,
                fullName: false,
                fullNameArray: false,
            },
        },
    ];
    return pipeLinesStage;
};
