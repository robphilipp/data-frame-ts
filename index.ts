export {
    DataFrame,
    CellValue,
    Index,
    indexFrom
} from './DataFrame';
export type {
    TagCoordinate,
    Tag,
    RowTag, ColumnTag, CellTag,
    TagValue,
    AvailableTagTypes
} from './tags'
export {
    RowCoordinate, ColumnCoordinate, CellCoordinate,
    Tags,
    newTag, newRowTag, newColumnTag, newCellTag,
    tagIdFor,
    isRowTag, isColumnTag, isCellTag
} from './tags'
