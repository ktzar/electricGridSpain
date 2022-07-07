export type FieldEntity = Record<string, any>;
export const sortByField = (field: string) =>
    (a: FieldEntity, b: FieldEntity) =>
        a[field] > b[field] ? 1 : -1;
