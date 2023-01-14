export const toJSON = (anything: any) => {
    return JSON.parse(JSON.stringify(anything));
};
