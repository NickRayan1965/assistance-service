export const getQueryParamsFromObject = (objectToConvert: object) => {
    let query = '?';
    if (objectToConvert) {
        const keys = Object.keys(objectToConvert);
        for (let i = 0; i < keys.length; i++) {
            query += `${keys[i]}=${objectToConvert[keys[i]].toString()}`;
            if (i != keys.length - 1) query += '&';
        }
    }
    return query;
};
