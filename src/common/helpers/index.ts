export const parseJsonField = (value: string | any, defaultValue: any): any => {
    if (!value) return defaultValue;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        // If it's a comma-separated string, split it
        if (Array.isArray(defaultValue)) {
            return value.split(',').map(item => item.trim());
        }
        return defaultValue;
    }
}