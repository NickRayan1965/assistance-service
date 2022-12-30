export const replaceDoubleSpacesAndTrim = (
    text: string | undefined,
): string | undefined => {
    if (text) {
        text = text.trim();
        while (text.includes('  ')) text = text.replace('  ', ' ');
    }
    return text;
};
