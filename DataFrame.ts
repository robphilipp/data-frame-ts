import {failureResult, Result, successResult} from "result-fn";
import {
    CellCoordinate, CellTag,
    ColumnCoordinate, ColumnTag, isCellTag, isColumnTag, isRowTag,
    newCellTag,
    newColumnTag,
    newRowTag,
    RowCoordinate, RowTag,
    Tag,
    TagCoordinate,
    Tags,
    TagValue
} from "./tags";

/**
 * Convenience type that holds a value and its coordinates. This is useful
 * when retrieving a set of values based on some query because it associates
 * the value with its coordinates in the {@link DataFrame}
 */
export type CellValue<V> = {
    value: V
    row: number
    column: number
}

/**
 * Represents an index in the data-frame
 */
export type Index = {
    row: number
    column: number
}

export function indexFrom(row: number, column: number): Index {
    return {row, column}
}

/**
 * Represents a two-dimensional data structure, `DataFrame`, that allows for manipulation
 * and querying of tabular data in a row-major format. The `DataFrame` is immutable for
 * immutable objects. Modifications to the rows, columns, or elements will not modify the
 * original `DataFrame`, but rather return a modified copy of the `DataFrame`. However,
 * there are a few functions, `setElementInPlaceAt`, `mapRowInPlace, and `mapColumnInPlace`
 * that mutate the data-frame. Using these "in-place" methods is discouraged but are
 * available for performance reasons and to cover certain edge-cases.
 *
 * @template V Type of the elements stored in the data structure.
 *
 * @example
 * ```typescript
 * // create a DataFrame from row data
 * const result: Result<DataFrame<number>, string> = DataFrame.from<number>([
 *     [ 1,  2,  3],  // row 1
 *     [ 4,  5,  6],  // row 2
 *     [ 7,  8,  9],  // row 3
 *     [10, 11, 12]   // row 4
 * ])
 *
 * // creates a DataFrame from column data
 * const result = DataFrame.fromColumnData([
 *     [ 1,  2,  3], // column 1
 *     [ 4,  5,  6], // column 2
 *     [ 7,  8,  9], // column 3
 *     [10, 11, 12]  // column 4
 * ])
 *
 * // both of these examples return a Result that holds the DataFrame when creating
 * // the data-frame succeeded. If it failed, for example because not all the rows
 * // had the same number of columns, then it returns a failure explaining why the
 * // creation of the DataFrame failed. For example:
 * const result = DataFrame.fromColumnData([
 *     [ 1,  2,  3],      // column 1
 *     [ 4,  5,  6],      // column 2
 *     [ 7,  8,  9],      // column 3
 *     [10, 11, 12, 13]   // column 4, which has 4 rows instead of 3
 * ])
 * expect(result.failed).toBe(true)
 * expect(result.error).toEqual("(DataFrame.validateDimensions) All columns must have the same number of rows; min_num_rows: 3, maximum_rows: 4")
 * ```
 */
export class DataFrame<V> {
    // private readonly data: Array<V>
    // private readonly numColumns: number
    // private readonly numRows: number
    // private tags: Tags<TagValue, TagCoordinate> = Tags.empty()

    /**
     * Constructs an instance of the class with the given data, number of rows, and number of columns.
     *
     * @param data The data to initialize the instance with.
     * @param numRows The number of rows.
     * @param numColumns The number of columns.
     * @param tags The tags associated with the data-frame
     */
    private constructor(
        private readonly data: Array<V>,
        private readonly numRows: number,
        private readonly numColumns: number,
        private tags: Tags<TagValue, TagCoordinate>// = Tags.empty()
    ) {
    }

    /**
     * Creates a DataFrame from a 2D array of data. Returns a {@link Result} containing the {@link DataFrame} if
     * the specified data was for a valid data-frame. Otherwise, returns a failure result with an error message.
     *
     * @param data A two-dimensional array representing the data. When {@link rowForm} is true (the default value),
     * then each inner array represents a row of data, and all the rows must have the same number of elements. When
     * {@link rowForm} is false, then each inner array represents a column of data, and all columns must have the
     * same number of rows.
     * @param [rowForm=true] Whether the matrix is in row-form (each inner vector represents a row), or the matrix
     * @template T the element type
     * @return A Result object containing either a DataFrame constructed from the input data
     * or an error message if the dimensions are invalid.
     *
     * @example
     * ```typescript
     * // create a data-frame with numbers and strings
     * const dataFrame: Result<DataFrame<number | string>, string> = DataFrame.from<number | string>([
     *     [1, "A", 3],
     *     [4, "B", 6],
     *     [7, "C", 9]
     * ])
     * ```
     */
    static from<V>(data: Array<Array<V>>, rowForm: boolean = true): Result<DataFrame<V>, string> {
        if (data.length === 0) {
            return successResult(new DataFrame<V>([], 0, 0, Tags.empty()))
        }
        return validateDimensions(data, rowForm)
            .map(data => new DataFrame<V>(data.flatMap(row => row), data.length, data[0].length, Tags.empty()))
            .map(df => rowForm ? df : df.transpose())
    }

    /**
     * Creates a data-frame instance from the given columnar data. In column-form, each inner array represents
     * a column of data rather than a row of data. Returns a {@link Result} containing the {@link DataFrame} if
     * the specified data was for a valid data-frame. Otherwise, returns a failure result with an error message.
     *
     * @param {Array<Array<V>>} data - An array of arrays, where each inner array represents a column of data.
     * @return {Result<DataFrame<V>, string>} A Result object containing either a DataFrame instance, if
     * successful, or an error message string.
     *
     * @example
     * ```typescript
     * // Returns a result holding a data-frame with the following rows
     * // [[1, 4, 7, 10],
     * //  [2, 5, 8, 11],
     * //  [3, 6, 9, 12]]
     * const result: Result<DataFrame<number>, string> = DataFrame.fromColumnData<number>([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ])
     * ```
     */
    static fromColumnData<V>(data: Array<Array<V>>): Result<DataFrame<V>, string> {
        return DataFrame.from(data, false)
    }

    /**
     * Creates an empty DataFrame. Returns a {@link Result} containing the empty {@link DataFrame}
     *
     * @template T the element type
     * @return A {@link Result} object containing an empty data frame
     *
     * @example
     * ```typescript
     * // create a data-frame with numbers and strings
     * const dataFrame: Result<DataFrame<number | string>, string> = DataFrame.empty<number | string>()
     * ```
     */
    static empty<V>(): Result<DataFrame<V>, string> {
        return DataFrame.from([], false)
    }

    /**
     * @return `true` if the data-frame is empty; `false` if it contains data
     */
    public isEmpty(): boolean {
        return this.data.length === 0
    }

    /**
     * Retrieves the total number of rows.
     * @return The number of rows.
     */
    public rowCount(): number {
        return this.numRows
    }

    /**
     * Retrieves the number of columns.
     * @return The total count of columns.
     */
    public columnCount(): number {
        return this.numColumns
    }

    /**
     * Creates and returns a copy of the current DataFrame instance. Note that it does not copy the
     * data elements, but rather copies their references.
     *
     * @return A new DataFrame instance containing the same data, number of rows, and columns as the original.
     *
     * @example
     * ```typescript
     * const data = [
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]
     * const dataFrame = DataFrame.from(data).getOrThrow()
     * const copied = dataFrame.copy()
     *
     * // the copy and original data-frame should be equal
     * expect(copied).toEqual(dataFrame)
     *
     * // but the copy is not the same object as the original, which
     * // we prove by modifying the copied, and showing that it doesn't
     * // equal the original, and is equal to its original self
     * copied.setElementInPlaceAt(0, 0, 100)
     * expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
     * expect(dataFrame).not.toEqual(copied)
     * ```
     */
    public copy(): DataFrame<V> {
        return new DataFrame(this.data.slice(), this.numRows, this.numColumns, this.tags.copy())
    }

    /**
     * Compares the current DataFrame instance with another DataFrame instance for equality.
     *
     * @param other The DataFrame instance to compare with the current instance.
     * @return A boolean indicating whether the two DataFrame instances are equal. Returns true if both have the
     * same length and identical data, otherwise false.
     *
     * @example
     * ```typescript
     * const dataFrame_4_3 = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const dataFrame_4_3_evens = dataFrame_4_3.mapElements(value => value * 2)
     *
     * // two data-frames with different values are not equal
     * expect(dataFrame_4_3).not.toEqual(dataFrame_4_3_evens)
     *
     * // a data-frame equals itself
     * expect(dataFrame_4_3).toEqual(dataFrame_4_3)
     * })
     * ```
     */
    public equals(other: DataFrame<V>): boolean {
        return this.data.length === other.data.length && this.data.every((value, index) => value === other.data[index])
    }

    /**
     * Extracts a specific row from a 2-dimensional dataset based on the provided row index.
     * @param rowIndex The index of the row to be extracted. Must be within the range of valid row indices (0 to numRows - 1).
     * @template T the element type
     * @return A successful result containing the row data as an array if the index is valid,
     * or a failure result containing an error message if the index is out of bounds.
     *
     * @example
     * ```typescript
     * const data = [
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]
     * const dataFrame = DataFrame.from(data).getOrThrow()
     *
     * // grab a copy of the 3rd row from the data-frame
     * const slice = dataFrame.rowSlice(2).getOrThrow()
     * expect(slice).toEqual([7, 8, 9])
     *
     * // prove that it is a copy by modifying the row-slice and
     * // showing that the original data-frame wasn't modified
     * for (let i = 0; i < slice.length; i++) {
     *     slice[i] = 10 * slice[i]
     * }
     * expect(slice).toEqual([70, 80, 90])
     * expect(dataFrame.rowSlice(2).getOrThrow()).toEqual([7, 8, 9])
     * ```
     */
    public rowSlice(rowIndex: number): Result<Array<V>, string> {
        if (rowIndex >= 0 && rowIndex < this.numRows) {
            return successResult(this.data.slice(rowIndex * this.numColumns, (rowIndex + 1) * this.numColumns))
        }
        return failureResult(`(DataFrame::rowSlice) Row Index out of bounds; row_index: ${rowIndex}; range: (0, ${this.numRows})`)
    }

    /**
     * Retrieves all row slices of a matrix or 2D structure.
     * Each row slice is an array of elements corresponding to a single row.
     *
     * @return An array where each element is an array representing a row slice.
     *
     * @example
     * ```typescript
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12],
     * ]).getOrThrow()
     *
     * // grab a copy of all the rows
     * const rowSlices: Array<Array<number>> = dataFrame.rowSlices()
     *
     * // of which there are 4
     * expect(rowSlices.length).toEqual(4)
     *
     * // and the rows should be the expected rows
     * expect(rowSlices[0]).toEqual([1, 2, 3])
     * expect(rowSlices[1]).toEqual([4, 5, 6])
     * expect(rowSlices[2]).toEqual([7, 8, 9])
     * expect(rowSlices[3]).toEqual([10, 11, 12])
     * ```
     */
    public rowSlices(): Array<Array<V>> {
        const rowSlices: Array<Array<V>> = []
        for (let i = 0; i < this.numRows; i++) {
            rowSlices.push(this.rowSlice(i).getOrThrow())
        }
        return rowSlices
    }

    /**
     * Extracts a slice of the specified column from a 2-dimensional dataset.
     * @param columnIndex The index of the column to extract. Must be within the range [0, this.numColumns).
     * @template T the element type
     * @return Returns a success Result containing the extracted column as an array
     * if the columnIndex is valid. Otherwise, returns a failure Result with an error message.
     *
     * @example
     * ```typescript
     * const data = [
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]
     * const dataFrame = DataFrame.from(data).getOrThrow()
     *
     * // grab a copy of the second column from the data-frame
     * const slice = dataFrame.columnSlice(1).getOrThrow()
     * expect(slice).toEqual([2, 5, 8, 11])
     *
     * // prove that the slice is a copy by modifying the slice
     * // and then showing that it didn't modify the original data-frame
     * for (let i = 0; i < slice.length; i++) {
     *     slice[i] = 10 * slice[i]
     * }
     * expect(slice).toEqual([20, 50, 80, 110])
     * expect(dataFrame.columnSlice(1).getOrThrow()).toEqual([2, 5, 8, 11])
     * ```
     */
    public columnSlice(columnIndex: number): Result<Array<V>, string> {
        if (columnIndex >= 0 && columnIndex <= this.numColumns) {
            const column: Array<V> = []
            for (let i = columnIndex; i < this.data.length; i += this.numColumns) {
                column.push(this.data[i])
            }
            return successResult(column)
        }
        return failureResult(
            `(DataFrame::columnSlice) Column index out of bounds; ` +
            `column_index: ${columnIndex}; range: (0, ${this.numColumns})`
        )
    }

    /**
     * Generates an array of arrays, where each inner array represents a slice of elements from
     * each column of the structure.
     *
     * @return A 2D array representing slices of elements from all columns.
     *
     * @example
     * ```typescript
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     * ]).getOrThrow()
     *
     * // grab an array of all the columns
     * const colSlices: Array<Array<number>> = dataFrame.columnSlices()
     *
     * // of which there are 3
     * expect(colSlices.length).toEqual(3)
     *
     * // and they should be the expected columns
     * expect(colSlices[0]).toEqual([1, 4, 7])
     * expect(colSlices[1]).toEqual([2, 5, 8])
     * expect(colSlices[2]).toEqual([3, 6, 9])
     * ```
     */
    public columnSlices(): Array<Array<V>> {
        const columnSlices: Array<Array<V>> = []
        for (let i = 0; i < this.numColumns; i++) {
            columnSlices.push(this.columnSlice(i).getOrThrow())
        }
        return columnSlices
    }

    /**
     * Returns a `Result` holding a `DataFrame` that is a subset of the original `DataFrame`
     * @param start The start (row, column) index of the selection range
     * @param end The ending (row, column) index of the selection range
     * @return a `Result` holding a `DataFrame` that is a subset of the original `DataFrame` if the
     * range is valid; otherwise a failure explaining the issue.
     * @example
     * ```typescript
     * // sub-frame will be
     * // [[5, 6],
     * //  [8, 9]]
     * const subFrame: DataFrame<number> = DataFrame
     *     .from([
     *         [1, 2, 3],
     *         [4, 5, 6],
     *         [7, 8, 9],
     *         [10, 11, 12],
     *     ])
     *     .flatMap(df => df.subFrame(indexFrom(1, 1), indexFrom(2, 2)))
     *     .getOrThrow()
     * ```
     */
    public subFrame(start: Index, end: Index): Result<DataFrame<V>, string> {
        if (start.row < 0 || start.row >= this.numRows || end.row < 0 || end.row >= this.numRows ||
            start.column < 0 || start.column >= this.numColumns || end.column < 0 || end.column >= this.numColumns) {
            return failureResult(
                `(DataFrame::subFrame) Range out of bounds; ` +
                `start_index: (${start.row}, ${start.column}); end_index: (${end.row}, ${end.column}); ` +
                `valid_range: [[0, ${this.numRows}), [0, ${this.numColumns})]`
            )
        }
        const data: Array<V> = []
        for (let row = start.row; row <= end.row; row++) {
            for (let column = start.column; column <= end.column; column++) {
                data.push(this.data[row * this.numColumns + column])
            }
        }
        const tags = this.tags.subset(start, end)
        return successResult(new DataFrame(data, end.row - start.row + 1, end.column - start.column + 1, tags))
    }

    /**
     * Retrieves an element from the specified row and column indices of a grid-like data structure.
     * @param rowIndex The index of the row from which to retrieve the element.
     * @param columnIndex The index of the column from which to retrieve the element.
     * @template T the element type
     * @return A `Result` object containing the element if the indices are within bounds,
     * or an error message string if the indices are out of bounds.
     *
     * @example
     * ```typescript
     * // create a data-frame, map it to the value of the 3rd row and column
     * const value = DataFrame.from([
     *         [1, 2, 3],
     *         [4, 5, 6],
     *         [7, 8, 9],
     *         [10, 11, 12]
     *     ])
     *     .flatMap(dataFrame => dataFrame.elementAt(2, 2))
     *     .getOrThrow()
     *
     * // and that value should be 9
     * expect(value).toEqual(9)
     * ```
     */
    public elementAt(rowIndex: number, columnIndex: number): Result<V, string> {
        if (rowIndex >= 0 && rowIndex < this.numRows && columnIndex >= 0 && columnIndex <= this.numColumns) {
            return successResult(this.data[rowIndex * this.numColumns + columnIndex])
        }
        return failureResult(
            `(DataFrame::elementAt) Index out of bounds; ` +
            `row: ${rowIndex}, column: ${columnIndex}; range: (${this.numRows}, ${this.numColumns})`
        )
    }

    /**
     * Updates the element at the specified row and column indices in the data frame.
     * If the indices are out of bounds, the operation results in a failure.
     *
     * @param rowIndex The zero-based index of the row to update.
     * @param columnIndex The zero-based index of the column to update.
     * @param value The value to set at the specified row and column indices.
     * @return A result object.
     *         On success, the result contains an updated DataFrame with the new value set.
     *         On failure, the result contains an error message specifying the out-of-bounds issue.
     *
     * @example
     * ```typescript
     * const data = [
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]
     * const dataFrame = DataFrame.from(data).getOrThrow()
     *
     * // change the value of the element in the 4th column of the 2nd row to 1000
     * // and get an updated data-frame
     * const updated = dataFrame.setElementAt(1, 3, 1000).getOrThrow()
     *
     * // which has the value of 1000 for the 4th column of the 2nd row
     * expect(updated.elementAt(1, 3).getOrThrow()).toEqual(1000)
     *
     * // and the original data-frame is unchanged
     * expect(dataFrame.equals(DataFrame.from(data).getOrThrow())).toBe(true)
     * ```
     */
    public setElementAt(rowIndex: number, columnIndex: number, value: V): Result<DataFrame<V>, string> {
        if (rowIndex >= 0 && rowIndex < this.numRows && columnIndex >= 0 && columnIndex <= this.numColumns) {
            const updated = this.data.slice()
            updated[rowIndex * this.numColumns + columnIndex] = value
            return successResult(new DataFrame(updated, this.numRows, this.numColumns, this.tags.copy()))
        }
        return failureResult(
            `(DataFrame::setElementAt) Index out of bounds; ` +
            `row: ${rowIndex}, column: ${columnIndex}; range: (${this.numRows}, ${this.numColumns})`
        )
    }

    /**
     * **has side-effects**
     * <p>
     * Updates the element at the specified row and column indices in the data frame.
     * If the indices are out of bounds, the operation results in a failure.
     *
     * @param rowIndex The zero-based index of the row to update.
     * @param columnIndex The zero-based index of the column to update.
     * @param value The value to set at the specified row and column indices.
     * @return A result object.
     *         On success, the result contains an updated DataFrame with the new value set.
     *         On failure, the result contains an error message specifying the out-of-bounds issue.
     *
     * @example
     * ```typescript
     * const data = [
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]
     * const dataFrame = DataFrame.from(data).getOrThrow()
     *
     * // update the value of the element in the 4th column of the 2nd row to 1000
     * // and get back the original data-frame that has been updated
     * const updated = dataFrame.setElementInPlaceAt(1, 3, 1000).getOrThrow()
     *
     * // the updated and original data-frames are the same
     * expect(dataFrame).toEqual(updated)
     *
     * // the 4th column of the 2nd row now has a value of 1000
     * expect(dataFrame.elementAt(1, 3).getOrThrow()).toEqual(1000)
     *
     * // updated in place, so the data-frame has changed, and so is no longer equal
     * // to the original data
     * expect(dataFrame.equals(DataFrame.from(data).getOrThrow())).toBe(false)
     * ```
     */
    public setElementInPlaceAt(rowIndex: number, columnIndex: number, value: V): Result<DataFrame<V>, string> {
        if (rowIndex >= 0 && rowIndex < this.numRows && columnIndex >= 0 && columnIndex <= this.numColumns) {
            this.data[rowIndex * this.numColumns + columnIndex] = value
            return successResult(this)
        }
        return failureResult(
            `(DataFrame::setElementAt) Index out of bounds; ` +
            `row: ${rowIndex}, column: ${columnIndex}; range: (${this.numRows}, ${this.numColumns})`
        )
    }

    /**
     * Inserts a new row into the DataFrame at the specified row index.
     * If the row index is out of bounds, an error result is returned.
     *
     * @param rowIndex The index at which the new row should be inserted. Must be within the range [0, numRows].
     * @param row The row data to be inserted. It must match the expected structure and length of the existing rows.
     * @return A result object that contains the updated DataFrame if successful
     * or an error message if the operation fails (e.g., due to an out-of-bounds index).
     *
     * @example
     * ```typescript
     * const data = [
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]
     * const dataFrame = DataFrame.from(data).getOrThrow()
     * const expected = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [100, 200, 300],
     *     [10, 11, 12]
     * ]).getOrThrow()
     *
     * // insert a row before the last row and get an updated data-frame
     * const updated = dataFrame.insertRowBefore(3, [100, 200, 300]).getOrThrow()
     *
     * // which has an additional row
     * expect(updated.rowCount()).toEqual(5)
     *
     * // and is equal to the expect data-frame
     * expect(updated.equals(expected)).toBe(true)
     *
     * // and the original data-frame is unchanged
     * expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
     * ```
     */
    public insertRowBefore(rowIndex: number, row: Array<V>): Result<DataFrame<V>, string> {
        if (rowIndex < 0 && rowIndex >= this.numRows) {
            return failureResult(`(DataFrame::insertRowBefore) Index out of bounds; row: ${rowIndex}; range: (0, ${this.numRows})`)
        }
        if (row.length !== this.numColumns) {
            return failureResult(`(DataFrame::insertRowBefore) The row must have the same number of elements as the data has columns. ` +
                `num_rows: ${this.numRows}; num_columns: ${row.length}`)
        }
        const newRows: Array<V> =
            // rows before the insert point
            this.data.slice(0, rowIndex * this.numColumns)
                .concat(row)
                // rows after the insert point
                .concat(this.data.slice(rowIndex * this.numColumns, this.data.length))

        const tags = this.tags.insertRow(rowIndex)
        return successResult(new DataFrame(newRows, this.numRows + 1, this.numColumns, tags))
    }

    /**
     * Adds a new row to the data frame if the row has the correct number of columns.
     *
     * @param row - The new row to be added. It must have the same number of columns as the existing data structure.
     * @return A `Result` object containing the updated `DataFrame` on success or an error message if the
     * dimensions do not match.
     * @see insertRowBefore
     *
     * @example
     * ```typescript
     * const data = [
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]
     * const dataFrame = DataFrame.from(data).getOrThrow()
     * const expected = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12],
     *     [100, 200, 300]
     * ]).getOrThrow()
     *
     * // add a row to the end and get an updated data-frame
     * const updated = dataFrame.pushRow([100, 200, 300]).getOrThrow()
     *
     * // which now has an additional row
     * expect(updated.rowCount()).toEqual(5)
     *
     * // and is equal to the expected data-frame
     * expect(updated.equals(expected)).toBe(true)
     *
     * // the original data-frame is unchanged
     * expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
     * ```
     */
    public pushRow(row: Array<V>): Result<DataFrame<V>, string> {
        if (row.length !== this.numColumns) {
            return failureResult(`(DataFrame::pushRow) The row must have the same number of elements as the data has columns. ` +
                `num_rows: ${this.numRows}; num_columns: ${row.length}`)
        }
        // todo adjust tags and add them to the constructor
        return successResult(new DataFrame(this.data.concat(row), this.numRows + 1, this.numColumns, this.tags.copy()))
    }

    /**
     * Inserts a new column into the DataFrame before the specified column index.
     *
     * @param columnIndex The index at which the new column should be inserted. Must be within the range of existing columns.
     * @param column The column to be inserted. The length of this column must match the number of rows in the DataFrame.
     * @return A result object containing the updated DataFrame on success,
     * or an error message on failure if the index is out of bounds or the column length does not match the number of rows.
     *
     * @example
     * ```typescript
     * const data = [
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]
     * const dataFrame = DataFrame.from(data).getOrThrow()
     * const expected = DataFrame.from([
     *     [100, 1, 2, 3],
     *     [200, 4, 5, 6],
     *     [300, 7, 8, 9],
     *     [400, 10, 11, 12]
     * ]).getOrThrow()
     *
     * // insert a column at the front and get back an updated data-frame
     * const updated = dataFrame.insertColumnBefore(0, [100, 200, 300, 400]).getOrThrow()
     *
     * // the updated data-frame now has 4 columns
     * expect(updated.columnCount()).toEqual(4)
     *
     * // and is equal to the expected
     * expect(updated.equals(expected)).toBe(true)
     *
     * // but the original data-frame is unchanged
     * expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
     * ```
     */
    // todo may be faster to copy the whole array, and then splice based on the indexes of the array (starting at the back)
    public insertColumnBefore(columnIndex: number, column: Array<V>): Result<DataFrame<V>, string> {
        if (columnIndex < 0 && columnIndex >= this.numColumns) {
            return failureResult(
                `(DataFrame::insertColumnBefore) Index out of bounds; ` +
                `column: ${columnIndex}; range: (0, ${this.numColumns})`
            )
        }
        if (column.length !== this.numRows) {
            return failureResult(`(DataFrame::insertColumnBefore) The column must have the same number of rows as the data. ` +
                `num_rows: ${this.numRows}; num_columns: ${column.length}`)
        }

        const rows: Array<Array<V>> = this.rowSlices()
        rows.forEach((row: Array<V>, rowIndex) => row.splice(columnIndex, 0, column[rowIndex]))

        const tags = this.tags.insertColumn(columnIndex)
        return successResult(new DataFrame(rows.flatMap(row => row), this.numRows, this.numColumns + 1, tags))
    }

    /**
     * Adds a column to the DataFrame. The column must have the same number of rows as the existing data in the DataFrame.
     *
     * @param column An array representing the column to be added to the DataFrame. The length of this array
     * must match the number of rows in the DataFrame.
     * @return Returns a success result containing the updated DataFrame if the column is added successfully,
     * or a failure result with an error message if the column length does not match the number of rows.
     *
     * @example
     * ```typescript
     * const data = [
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]
     * const dataFrame = DataFrame.from(data).getOrThrow()
     * const expected = DataFrame.from([
     *     [1, 2, 3, 100],
     *     [4, 5, 6, 200],
     *     [7, 8, 9, 300],
     *     [10, 11, 12, 400]
     * ]).getOrThrow()
     *
     * // add a column to the end and get back an updated data-frame
     * const updated = dataFrame.pushColumn([100, 200, 300, 400]).getOrThrow()
     *
     * // now the updated data-frame has 4 columns
     * expect(updated.columnCount()).toEqual(4)
     *
     * // and the updated data-frame equals the expected
     * expect(updated.equals(expected)).toBe(true)
     *
     * // and the original data-frame remains unchanged
     * expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
     * ```
     */
    public pushColumn(column: Array<V>): Result<DataFrame<V>, string> {
        if (column.length !== this.numRows) {
            return failureResult(`(DataFrame::pushColumn) The column must have the same number of rows as the data. ` +
                `num_rows: ${this.numRows}; num_columns: ${column.length}`)
        }
        const rows: Array<Array<V>> = this.rowSlices()
        rows.forEach((row: Array<V>, rowIndex) => row.push(column[rowIndex]))
        return DataFrame.from(rows)
    }

    /**
     * Deletes a row at the specified index in the DataFrame.
     *
     * @param rowIndex The index of the row to delete. Must be a non-negative integer within the
     * range of existing rows.
     * @return A Result containing a new DataFrame without the specified row if the operation is successful,
     * or an error message if the operation fails.
     *
     * @example
     * ```typescript
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const expected = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     * ]).getOrThrow()
     *
     * // delete the fourth row
     * const updated = dataFrame.deleteRowAt(3).getOrThrow()
     *
     * // now there should only be 3 rows left
     * expect(updated.rowCount()).toEqual(3)
     *
     * // the updated data-frame should be equal to the expected
     * expect(updated.equals(expected)).toBe(true)
     *
     * // and the original data-frame should be unchanged
     * expect(updated.equals(dataFrame)).toBe(false)
     * ```
     */
    public deleteRowAt(rowIndex: number): Result<DataFrame<V>, string> {
        if (this.numRows === 0) {
            failureResult(`(DataFrame::deleteRowAt) Cannot delete row from an empty DataFrame.`)
        }
        if (rowIndex < 0 || rowIndex >= this.numRows) {
            return failureResult(
                `(DataFrame::deleteRowAt) Index out of bounds; row: ${rowIndex}; range: (0, ${this.numRows})`
            )
        }

        const copy = this.data.slice()
        copy.splice(rowIndex * this.numColumns, this.numColumns)

        const tags = this.tags.removeRow(rowIndex)
        return successResult(new DataFrame(copy, this.numRows - 1, this.numColumns, tags))
    }

    /**
     * Deletes the column at the specified index from the DataFrame.
     *
     * @param columnIndex The index of the column to be deleted. Must be within the range of existing columns.
     * @return A `Result` object containing the updated DataFrame if the operation is successful,
     * or an error message if the operation fails.
     *
     * @example
     * ```typescript
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const expected = DataFrame.from([
     *     [2, 3],
     *     [5, 6],
     *     [8, 9],
     *     [11, 12]
     * ]).getOrThrow()
     *
     * // delete the first column
     * const updated = dataFrame.deleteColumnAt(0).getOrThrow()
     *
     * // now there are only 2 columns remaining
     * expect(updated.columnCount()).toEqual(2)
     *
     * // the updated data-frame should equal the expected
     * expect(updated.equals(expected)).toBe(true)
     *
     * // and the origin data-frame remains unchanged
     * expect(updated.equals(dataFrame)).toBe(false)
     * ```
     */
    public deleteColumnAt(columnIndex: number): Result<DataFrame<V>, string> {
        if (this.numColumns === 0) {
            failureResult(`(DataFrame::deleteColumnAt) Cannot delete column from an empty DataFrame.`)
        }
        if (columnIndex < 0 || columnIndex >= this.numColumns) {
            return failureResult(
                `(DataFrame::deleteColumnAt) Index out of bounds; ` +
                `column: ${columnIndex}; range: (0, ${this.numColumns})`
            )
        }
        const rows = this.rowSlices()
        rows.forEach((row: Array<V>) => row.splice(columnIndex, 1))

        const tags = this.tags.removeColumn(columnIndex)
        return successResult(new DataFrame(rows.flatMap(row => row), this.numRows, this.numColumns - 1, tags))
    }

    /**
     * Transposes the current DataFrame, swapping its rows and columns. This method also
     * transposes any tags that have been applied to the DataFrame.
     *
     * @return {DataFrame<V>} A new DataFrame instance where rows and columns of the original DataFrame are swapped.
     *
     * @example
     * ```typescript
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const expected = DataFrame.from([
     *     [1, 4, 7, 10],
     *     [2, 5, 8, 11],
     *     [3, 6, 9, 12]
     * ]).getOrThrow()
     *
     * // transpose the data-frame
     * const transposed = dataFrame.transpose()
     *
     * // the transposed data-frame should equal the expected
     * expect(transposed).toEqual(expected)
     *
     * // and the original data-frame should be unchanged
     * expect(dataFrame).not.toEqual(expected)
     * ```
     */
    transpose(): DataFrame<V> {
        const transposed = this.data.slice()
        for (let row = 0; row < this.numRows; row++) {
            for (let col = 0; col < this.numColumns; col++) {
                transposed[col * this.numRows + row] = this.data[row * this.numColumns + col]
            }
        }
        return new DataFrame(transposed, this.numColumns, this.numRows, this.tags.transpose())
    }

    /**
     * Applies the specified mapper to each element in the data-frame and returns a new data-frame
     * with the updated elements.
     * @param mapper A function that accepts the current value of the element and its (row, column)
     * coordinates, and returns a new value of type U
     * @template U The value type for the elements of the new data-frame
     * @return A new {@link DataFrame} with the updated elements
     *
     * @example
     * ```typescript
     * const data = [
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]
     * const dataFrame = DataFrame.from(data).getOrThrow()
     * const expected = DataFrame.from<string>([
     *     ['1', '2', '3'],
     *     ['4', '5', '6'],
     *     ['7', '8', '9'],
     *     ['10', '11', '12']
     * ]).getOrThrow()
     *
     * // convert each element from a number to a string
     * const updated = dataFrame.mapElements<string>(value => (`${value}`))
     *
     * // the new elements are the ones expected, and the original data-frame
     * // has not changed
     * expect(updated).toEqual(expected)
     * expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
     * ```
     */
    mapElements<U>(mapper: (value: V, rowIndex: number, columnIndex: number) => U): DataFrame<U> {
        const updatedData = this.data.map((value: V, index: number): U => {
            const rowIndex = Math.floor(index / this.numColumns)
            const columnIndex = index % this.numColumns
            return mapper(value, rowIndex, columnIndex)
        })
        return new DataFrame(updatedData, this.numRows, this.numColumns, this.tags.copy())
    }

    /**
     * Maps the data of a specific row in the DataFrame using the provided mapper function and returns
     * a new DataFrame. This method does not update the original DataFrame.
     *
     * @param rowIndex - The index of the row to be mapped. Must be within the bounds of the DataFrame (0 to numRows-1).
     * @param mapper - A function applied to transform each cell value in the specified row.
     * @return A success result containing the updated DataFrame if the operation is successful,
     * or a failure result containing an error message if the row index is invalid.
     * @see mapRowInPlace
     *
     * @example
     * ```typescript
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const expected = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [14, 16, 18],
     *     [10, 11, 12]
     * ]).getOrThrow()
     *
     * // map the row and return a new data-frame
     * const updated = dataFrame.mapRow(2, (value: number) => value * 2).getOrThrow()
     *
     * expect(updated).toEqual(expected)
     *
     * // the original data-frame is unchanged
     * expect(dataFrame).not.toEqual(expected)
     * ```
     */
    public mapRow(rowIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string> {
        if (rowIndex < 0 || rowIndex >= this.numRows) {
            return failureResult(
                `(DataFrame::mapRow) Invalid row index. Row index must be in [0, ${this.numRows}); row_index: ${rowIndex}`
            )
        }
        const updated = this.data.slice()
        for (let i = rowIndex * this.numColumns; i < (rowIndex + 1) * this.numColumns; i++) {
            updated[i] = mapper(updated[i])
        }
        return successResult(new DataFrame(updated, this.numRows, this.numColumns, this.tags.copy()))
    }

    /**
     * **Has side-effect**
     * <p>Maps the data of a specific row in the DataFrame using the provided mapper function and returns
     * a new DataFrame. This method **DOES** update the original DataFrame.
     *
     * @param rowIndex - The index of the row to be mapped. Must be within the bounds of the DataFrame (0 to numRows-1).
     * @param mapper - A function applied to transform each cell value in the specified row.
     * @return A success result containing the updated DataFrame if the operation is successful,
     * or a failure result containing an error message if the row index is invalid.
     * @see mapRow
     *
     * @example
     * ```typescript
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const expected = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [14, 16, 18],
     *     [10, 11, 12]
     * ]).getOrThrow()
     *
     * // updated the data-frame in-place
     * const updated = dataFrame.mapRowInPlace(2, (value: number) => value * 2).getOrThrow()
     *
     * expect(updated).toEqual(expected)
     * expect(dataFrame).toEqual(updated)
     * ```
     */
    public mapRowInPlace(rowIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string> {
        if (rowIndex < 0 || rowIndex >= this.numRows) {
            return failureResult(
                `(DataFrame::mapRowInPlace) Invalid row index. Row index must be in [0, ${this.numRows}); row_index: ${rowIndex}`
            )
        }
        for (let i = rowIndex * this.numColumns; i < (rowIndex + 1) * this.numColumns; i++) {
            this.data[i] = mapper(this.data[i])
        }
        return successResult(this)
    }

    /**
     * Maps the values of a specified column in the DataFrame using a given function and returns
     * a new DataFrame. This method does not update the original DataFrame.
     *
     * @param columnIndex - The index of the column to be mapped. Must be within the range [0, numColumns).
     * @param mapper - A function that takes a column value and returns a new value.
     * @return A success result containing the updated DataFrame if the column index is valid,
     * or a failure result containing an error message if the column index is invalid.
     * @see mapColumnInPlace
     * @example
     * ```typescript
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const expected = DataFrame.from([
     *     [1, 4, 3],
     *     [4, 10, 6],
     *     [7, 16, 9],
     *     [10, 22, 12]
     * ]).getOrThrow()
     *
     * // multiply all the values in the second column by 2 and return a new data-frame,
     * // leaving the original data-frame untouched
     * const updated = dataFrame.mapColumn(1, (value: number) => value * 2).getOrThrow()
     * expect(updated).toEqual(expected)
     * expect(dataFrame).not.toEqual(expected)
     * ```
     */
    public mapColumn(columnIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string> {
        if (columnIndex < 0 || columnIndex >= this.numColumns) {
            return failureResult(
                `(DataFrame::mapColumn) Invalid column index. Column index must be in [0, ${this.numColumns}); row_index: ${columnIndex}`
            )
        }
        const updated = this.data.slice()
        for (let i = columnIndex; i < this.data.length; i += this.numColumns) {
            updated[i] = mapper(updated[i])
        }
        return successResult(new DataFrame(updated, this.numRows, this.numColumns, this.tags.copy()))
    }

    /**
     * **Has side-effect**
     * Maps the values of a specified column in the DataFrame using a given function and returns
     * a new DataFrame. This method **DOES** update the original DataFrame.
     *
     * @param columnIndex - The index of the column to be mapped. Must be within the range [0, numColumns).
     * @param mapper - A function that takes a column value and returns a new value.
     * @return A success result containing the updated DataFrame if the column index is valid,
     * or a failure result containing an error message if the column index is invalid.
     * @see mapColumn
     * @example
     * ```typescript
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const expected = DataFrame.from([
     *     [1, 4, 3],
     *     [4, 10, 6],
     *     [7, 16, 9],
     *     [10, 22, 12]
     * ]).getOrThrow()
     *
     * // multiply all the values in the second column by 2 in the original data-frame
     * const updated = dataFrame.mapColumnInPlace(1, (value: number) => value * 2).getOrThrow()
     * expect(updated).toEqual(expected)
     * expect(dataFrame).toEqual(updated)
     * ```
     */
    public mapColumnInPlace(columnIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string> {
        if (columnIndex < 0 || columnIndex >= this.numColumns) {
            return failureResult(
                `(DataFrame::mapColumnInPlace) Invalid column index. Column index must be in [0, ${this.numColumns}); row_index: ${columnIndex}`
            )
        }
        for (let i = columnIndex; i < this.data.length; i += this.numColumns) {
            this.data[i] = mapper(this.data[i])
        }
        return successResult(this)
    }

    /**
     * Tags a specific row in the DataFrame with a name-value pair.
     *
     * @param rowIndex The index of the row to tag. Must be within the range [0, numRows).
     * @param name The name of the tag to associate with the row.
     * @param tag The value of the tag to associate with the row.
     * @template T The type of the tag value, which must extend TagValue.
     * @return A success result containing the updated DataFrame if the row index is valid,
     * or a failure result containing an error message if the row index is invalid.
     * @example
     * ```typescript
     * const taggedDataFrame = DataFrame.from([
     *       [1, 2, 3],
     *       [4, 5, 6],
     *       [7, 8, 9]
     *   ])
     *   .flatMap(df => df.tagRow(1, "row-tag", "row-value"))
     *   .getOrThrow()
     *
     * // Verify the result is a DataFrame
     * expect(taggedDataFrame).toBeDefined()
     * expect(taggedDataFrame.rowCount()).toBe(3)
     * expect(taggedDataFrame.columnCount()).toBe(3)
     * expect(taggedDataFrame.hasRowTagFor(1)).toBeTruthy()
     * expect(taggedDataFrame.hasRowTagFor(2)).toBeFalsy()
     * ```
     */
    public tagRow<T extends TagValue>(rowIndex: number, name: string, tag: T): Result<DataFrame<V>, string> {
        if (rowIndex < 0 || rowIndex >= this.numRows) {
            return failureResult(
                `(DataFrame::tagRow) Row index for row tag is out of bounds; row_index: ${rowIndex}; tag_name: ${name}; 
                tag_value: ${tag.toString()}; valid_index_range: (0, ${this.numRows - 1}).`
            )
        }
        this.tags = this.tags.addOrReplace(newRowTag(name, tag, RowCoordinate.of(rowIndex)))
        return successResult(this as DataFrame<V>)
    }

    /**
     * Tags a specific column in the DataFrame with a name-value pair.
     *
     * @param columnIndex The index of the column to tag. Must be within the range [0, numColumns).
     * @param name The name of the tag to associate with the column.
     * @param tag The value of the tag to associate with the column.
     * @template T The type of the tag value, which must extend TagValue.
     * @return A success result containing the updated DataFrame if the column index is valid,
     * or a failure result containing an error message if the column index is invalid.
     * @example
     * ```typescript
     * const taggedDataFrame = DataFrame.from([
     *       [1, 2, 3],
     *       [4, 5, 6],
     *       [7, 8, 9]
     *   ])
     *   .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *   .getOrThrow()
     *
     * // Verify the result is a DataFrame
     * expect(taggedDataFrame).toBeDefined()
     * expect(taggedDataFrame.rowCount()).toBe(3)
     * expect(taggedDataFrame.columnCount()).toBe(3)
     * ```
     */
    public tagColumn<T extends TagValue>(columnIndex: number, name: string, tag: T): Result<DataFrame<V>, string> {
        if (columnIndex < 0 || columnIndex >= this.numColumns) {
            return failureResult(
                `(DataFrame::tagColumn) Column index for column tag is out of bounds; column_index: ${columnIndex}; tag_name: ${name}; 
                tag_value: ${tag.toString()}; valid_index_range: (0, ${this.numColumns - 1}).`
            )
        }
        this.tags = this.tags.addOrReplace(newColumnTag(name, tag, ColumnCoordinate.of(columnIndex)))
        return successResult(this as DataFrame<V>)
    }

    /**
     * Tags a specific cell in the DataFrame with a name-value pair.
     *
     * @param rowIndex The index of the row containing the cell to tag. Must be within the range [0, numRows).
     * @param columnIndex The index of the column containing the cell to tag. Must be within the range [0, numColumns).
     * @param name The name of the tag to associate with the cell.
     * @param tag The value of the tag to associate with the cell.
     * @template T The type of the tag value, which must extend TagValue.
     * @return A success result containing the updated DataFrame if the indices are valid,
     * or a failure result containing an error message if either index is invalid.
     * @example
     * ```typescript
     * const taggedDataFrame = DataFrame.from([
     *       [1, 2, 3],
     *       [4, 5, 6],
     *       [7, 8, 9]
     *   ])
     *   .flatMap(df => df.tagCell(1, 2, "cell-tag", "cell-value"))
     *   .getOrThrow()
     *
     * // Verify the result is a DataFrame
     * expect(taggedDataFrame).toBeDefined()
     * expect(taggedDataFrame.rowCount()).toBe(3)
     * expect(taggedDataFrame.columnCount()).toBe(3)
     * ```
     */
    public tagCell<T extends TagValue>(rowIndex: number, columnIndex: number, name: string, tag: T): Result<DataFrame<V>, string> {
        if (rowIndex < 0 || rowIndex >= this.numRows) {
            return failureResult(
                `(DataFrame::tagCell) Row index for cell tag is out of bounds; row_index: ${rowIndex}; tag_name: ${name}; 
                tag_value: ${tag.toString()}; valid_index_range: (0, ${this.numRows - 1}).`
            )
        }
        if (columnIndex < 0 || columnIndex >= this.numColumns) {
            return failureResult(
                `(DataFrame::tagCell) Column index for cell tag is out of bounds; column_index: ${columnIndex}; tag_name: ${name}; `
            )
        }
        this.tags = this.tags.addOrReplace(newCellTag(name, tag, CellCoordinate.of(rowIndex, columnIndex)))
        return successResult(this as DataFrame<V>)
    }

    /**
     * Returns an array of {@link Tag} object that meet the criteria specified in the {@link predicate}
     * @param predicate A function that returns `true` if the supplied {@link Tag} meets the criteria; otherwise returns `false`
     * @return An array of {@link Tag} objects that meet the specified predicate
     * @example
     * ```typescript
     * // create a simple data-frame
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9]
     * ]).getOrThrow()
     *
     * // add a row tag, a column tag, and a cell tag
     * const taggedDataFrame = dataFrame
     *     .tagRow(0, "row-tag", "row-value")
     *     .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *     .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
     *     .getOrThrow()
     *
     * // the row tag has a name "row-tag", so filter by that name
     * const rowTags = taggedDataFrame.filterTags(tag => tag.name === "row-tag")
     *
     * // there should only be one tag, with the name "row-tag", the value
     * // "row-value", that is a RowTag for the 0th row.
     * expect(rowTags.length).toBe(1)
     * expect(rowTags[0].name).toBe("row-tag")
     * expect(rowTags[0].value).toBe("row-value")
     * expect((rowTags[0] as RowTag<string>).isRowTag()).toBeTruthy()
     * expect((rowTags[0] as RowTag<string>).coordinate.toString()).toBe("(0, *)")
     * ```
     */
    public filterTags(predicate: (tag: Tag<TagValue, TagCoordinate>) => boolean): Array<Tag<TagValue, TagCoordinate>> {
        return this.tags.filter(predicate)
    }

    /**
     * Returns an Array of {@link Tag}s that are tagged with the specified tag. When the tag is a
     * {@link RowTag} then all the cells in that row that are tagged with a matching row are
     * returned. When the tag is a {@link ColumnTag} then all the cells in that column that are
     * tagged with a matching tag are returned. And when the tag is a {@link CellTag}, then the
     * cell at that location is returned if it has a matching tag.
     * @param tag The {@link Tag} for which to find matching cells.
     * @return An array of {@link CellValue} objects associated with the specified tag
     * @example
     * ```typescript
     * // given a tagged data-frame
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const taggedDataFrame = dataFrame
     *     .tagRow(0, "row-tag", "row-value")
     *     .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *     .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
     *     .getOrThrow()
     *
     * // we can retrieve all the cells in a tagged row, in this case the
     * // first row
     * const tag = newRowTag("row-tag", "row-value", RowCoordinate.of(0))
     * const cellValues = taggedDataFrame.cellsTaggedWith(tag).getOrThrow()
     *
     * // there are three values, and are the first row in the data-frame
     * expect(cellValues).toHaveLength(3)
     * expect(cellValues[0]).toEqual({"row": 0, "column": 0, "value": 1})
     * expect(cellValues[1]).toEqual({"row": 0, "column": 1, "value": 2})
     * expect(cellValues[2]).toEqual({"row": 0, "column": 2, "value": 3})
     * ```
     */
    public cellsTaggedWith(tag: Tag<TagValue, TagCoordinate>): Result<Array<CellValue<V>>, string> {
        const [row, column] = tag.coordinate.coordinate()
        if (row < 0 || row >= this.numRows) {
            return failureResult(
                `(DataFrame::cellsTaggedWith) Invalid row index. Row index must be in [0, ${this.numRows}); row_index: ${row}`
            )
        }
        if (column < 0 || column >= this.numColumns) {
            return failureResult(
                `(DataFrame::cellsTaggedWith) Invalid column index. Column index must be in [0, ${this.numColumns}); column_index: ${column}`
            )
        }
        if (isRowTag(tag)) {
            if (this.rowTagsFor(row).some(tg => tg.equals(tag))) {
                return this.rowSlice(row)
                    .map(values => values
                        .map((value, index) => ({value, row, column: index} as CellValue<V>))
                    )
            }
            return successResult([])
        }
        if (isColumnTag(tag)) {
            if (this.columnTagsFor(column).some(tg => tg.equals(tag))) {
                return this.columnSlice(column)
                    .map(values => values
                        .map((value, index) => ({value, row: index, column} as CellValue<V>))
                    )
            }
            return successResult([])
        }
        if (isCellTag(tag)) {
            if (this.cellTagsFor(row, column).some(tg => tg.equals(tag))) {
                return this.elementAt(row, column).map(value => [value])
                    .map(values => values
                        .map(value => ({value, row, column} as CellValue<V>))
                    )
            }
            return successResult([])
        }
        // catch-all for any tag types.
        if (this.tagsFor(row, column).some(tg => tg.equals(tag))) {
            return this.elementAt(row, column).map(value => [value])
                .map(values => values
                    .map(value => ({value, row, column} as CellValue<V>))
                )
        }
        return successResult([])
        // return failureResult(
        //     `(DataFrame::cellsTaggedWith) Invalid tag type. Tag must be a RowTag, ColumnTag, or CellTag` +
        //     `tag: ${tag.toString()}`
        // )
    }

    // public cellsTaggedWith(tag: Tag<TagValue, TagCoordinate>): Result<Array<CellValue<V>>, string> {
    //     const [row, column] = tag.coordinate.coordinate()
    //     if (isRowTag(tag)) {
    //         if (this.rowTagsFor(row).some(tg => tg.equals(tag))) {
    //             return this.rowSlice(row)
    //                 .map(values => values
    //                     .map((value, index) => ({value, row, column: index} as CellValue<V>))
    //                 )
    //         }
    //         return successResult([])
    //     }
    //     if (isColumnTag(tag)) {
    //         if (this.columnTagsFor(column).some(tg => tg.equals(tag))) {
    //             return this.columnSlice(column)
    //                 .map(values => values
    //                     .map((value, index) => ({value, row: index, column} as CellValue<V>))
    //                 )
    //         }
    //         return successResult([])
    //     }
    //     if (isCellTag(tag)) {
    //         if (this.cellTagsFor(row, column).some(tg => tg.equals(tag))) {
    //             return this.elementAt(row, column).map(value => [value])
    //                 .map(values => values
    //                     .map(value => ({value, row, column} as CellValue<V>))
    //                 )
    //         }
    //         return successResult([])
    //     }
    //     if (this.tagsFor(row, column).some(tg => tg.equals(tag))) {
    //         return this.elementAt(row, column).map(value => [value])
    //             .map(values => values
    //                 .map(value => ({value, row, column} as CellValue<V>))
    //             )
    //     }
    //     return failureResult(
    //         `(DataFrame::cellsTaggedWith) Invalid tag type. Tag must be a RowTag, ColumnTag, or CellTag` +
    //         `tag: ${tag.toString()}`
    //     )
    // }

    /**
     * Retrieves all the {@link RowTag} objects associated with the specified row index
     * @param rowIndex The index of the row to which the row tags apply
     * @return An array of the {@link RowTag} objects associated with the specified row index
     * @example
     * ```typescript
     * // create a tagged data-frame
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const taggedDataFrame = dataFrame
     *     .tagRow(0, "row-tag", "row-value")
     *     .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *     .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
     *     .flatMap(df => df.tagRow(0, "row-tag-2", "row-value"))
     *     .flatMap(df => df.tagRow(1, "row-tag-2", "row-value"))
     *     .getOrThrow()
     *
     * // retrieve the row-tags for the first row, of which there are two
     * const tags = taggedDataFrame.rowTagsFor(0)
     *
     * expect(tags).toHaveLength(2)
     * expect(tags[0].name).toEqual("row-tag")
     * expect(tags[0].value).toEqual("row-value")
     * expect(tags[1].name).toEqual("row-tag-2")
     * expect(tags[1].value).toEqual("row-value")
     * ```
     */
    public rowTagsFor(rowIndex: number): Array<Tag<TagValue, RowCoordinate>> {
        return this.tags.filter(tag => {
            const [row,] = tag.coordinate.coordinate()
            return isRowTag(tag) && row === rowIndex
        }) as Array<Tag<TagValue, RowCoordinate>>
    }

    /**
     * Retrieves all the {@link ColumnTag} objects associated with the specified column index
     * @param columnIndex The index of the column to which the column tags apply
     * @return An array of the {@link ColumnTag} objects associated with the specified column index
     * @example
     * ```typescript
     * // create a tagged data-frame
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const taggedDataFrame = dataFrame
     *     .tagRow(0, "row-tag", "row-value")
     *     .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *     .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
     *     .flatMap(df => df.tagRow(0, "row-tag-2", "row-value"))
     *     .flatMap(df => df.tagRow(1, "row-tag-2", "row-value"))
     *     .getOrThrow()
     *
     * // retrieve the column-tag for the second column, of which there is one
     * const tags = taggedDataFrame.columnTagsFor(1)
     * expect(tags).toHaveLength(1)
     * expect(tags[0].name).toEqual("column-tag")
     * expect(tags[0].value).toEqual("column-value")
     * ```
     */
    public columnTagsFor(columnIndex: number): Array<Tag<TagValue, ColumnCoordinate>> {
        return this.tags.filter(tag => {
            const [, column] = tag.coordinate.coordinate()
            return isColumnTag(tag) && column === columnIndex
        }) as Array<Tag<TagValue, ColumnCoordinate>>
    }

    /**
     * Retrieves all the {@link CellTag} objects associated with the specified (row, column) index
     * @param rowIndex The index of the row to which the row tags apply
     * @param columnIndex The index of the column to which the column tags apply
     * @return An array of the {@link CellTag} objects associated with the specified (row, column) index
     * @example
     * ```typescript
     * // create a tagged data-frame
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const taggedDataFrame = dataFrame
     *     .tagRow(0, "row-tag", "row-value")
     *     .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *     .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
     *     .flatMap(df => df.tagRow(0, "row-tag-2", "row-value"))
     *     .flatMap(df => df.tagRow(1, "row-tag-2", "row-value"))
     *     .getOrThrow()
     *
     * // retrieve the cell-tag for the third row and third column, of which there is one
     * let tags = taggedDataFrame.cellTagsFor(2, 2)
     * expect(tags).toHaveLength(1)
     * expect(tags[0].name).toEqual("cell-tag")
     * expect(tags[0].value).toEqual("cell-value")
     * expect(isCellTag(tags[0])).toBeTruthy()
     *
     * // there is no cell-tag at (1, 2), although there is a row-tag
     * tags = taggedDataFrame.cellTagsFor(1, 2)
     * expect(tags).toHaveLength(0)
     * ```
     */
    public cellTagsFor(rowIndex: number, columnIndex: number): Array<Tag<TagValue, CellCoordinate>> {
        return this.tags.filter(tag => {
            const [row, column] = tag.coordinate.coordinate()
            return isCellTag(tag) && row === rowIndex && column === columnIndex
        }) as Array<Tag<TagValue, CellCoordinate>>
    }

    /**
     * Retrieves all the {@link RowTag}, {@link ColumnTag}, or {@link CellTag} objects associated with the
     * specified (row, column) index
     * @param rowIndex The index of the row to which the row tags apply
     * @param columnIndex The index of the column to which the column tags apply
     * @return An array of the {@link RowTag}, {@link ColumnTag}, or {@link CellTag} objects associated
     * with the specified (row, column) index
     * @example
     * ```typescript
     * // create a tagged data-frame
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const taggedDataFrame = dataFrame
     *     .tagRow(0, "row-tag", "row-value")
     *     .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *     .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
     *     .flatMap(df => df.tagRow(0, "row-tag-2", "row-value"))
     *     .flatMap(df => df.tagRow(1, "row-tag-2", "row-value"))
     *     .getOrThrow()
     *
     * // retrieve the cell-tag for the third row and third column, of which there is one
     * let tags = taggedDataFrame.tagsFor(2, 2)
     * expect(tags).toHaveLength(1)
     * expect(tags[0].name).toEqual("cell-tag")
     * expect(tags[0].value).toEqual("cell-value")
     *
     * // retrieve the row-tag for the cell in the second row and third column
     * tags = taggedDataFrame.tagsFor(1, 2)
     * expect(tags).toHaveLength(1)
     * expect(tags[0].name).toEqual("row-tag-2")
     * expect(tags[0].value).toEqual("row-value")
     * expect(isRowTag(tags[0])).toBeTruthy()
     * ```
     */
    public tagsFor(rowIndex: number, columnIndex: number): Array<Tag<TagValue, TagCoordinate>> {
        if (rowIndex < 0 || rowIndex >= this.numRows || columnIndex < 0 || columnIndex >= this.numColumns) {
            return []
        }
        return this.tags.tagsFor(rowIndex, columnIndex)
    }

    /**
     * Reports whether the row with the specified index has a row-tag. When specifying
     * row-indexes that are out of bounds, reports that no tag exists but doesn't fail.
     * Because there are no rows with out-of-bound indexes, there are no tags.
     * @param rowIndex The index of the row to check for tags.
     * @return `true` if the specified row has one or more row-tags;`false` otherwise
     * @example
     * ```typescript
     * // create a tagged data-frame
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const taggedDataFrame = dataFrame
     *     .tagRow(0, "row-tag", "row-value")
     *     .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *     .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
     *     .flatMap(df => df.tagRow(0, "row-tag-2", "row-value"))
     *     .flatMap(df => df.tagRow(1, "row-tag-2", "row-value"))
     *     .getOrThrow()
     *
     * // ask about which rows are tagged with a row-tag
     * expect(taggedDataFrame.hasRowTagFor(0)).toBeTruthy()  // row-tag, row-tag2
     * expect(taggedDataFrame.hasRowTagFor(1)).toBeTruthy()  // row-tag2
     * expect(taggedDataFrame.hasRowTagFor(2)).toBeFalsy()
     * expect(taggedDataFrame.hasRowTagFor(3)).toBeFalsy()
     *
     * expect(taggedDataFrame.hasRowTagFor(-4)).toBeFalsy() // row doesn't exist
     * expect(taggedDataFrame.hasRowTagFor(400)).toBeFalsy() // row doesn't exist
     * ```
     */
    public hasRowTagFor(rowIndex: number): boolean {
        return this.rowTagsFor(rowIndex).length > 0
    }

    /**
     * Reports whether the column with the specified index has a column-tag. When specifying
     * column-indexes that are out of bounds, reports that no tag exists but doesn't fail.
     * Because there are no columns with out-of-bound indexes, there are no tags.
     * @param columnIndex The index of the column to check for tags.
     * @return `true` if the specified row has one or more column-tags; `false` otherwise
     * @example
     * ```typescript
     * // create a tagged data-frame
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const taggedDataFrame = dataFrame
     *     .tagRow(0, "row-tag", "row-value")
     *     .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *     .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
     *     .flatMap(df => df.tagRow(0, "row-tag-2", "row-value"))
     *     .flatMap(df => df.tagRow(1, "row-tag-2", "row-value"))
     *     .getOrThrow()
     *
     * // ask about which columns are tagged with a column-tag
     * expect(taggedDataFrame.hasColumnTagFor(0)).toBeFalsy()  // column-tag
     * expect(taggedDataFrame.hasColumnTagFor(1)).toBeTruthy()
     * expect(taggedDataFrame.hasColumnTagFor(2)).toBeFalsy()
     *
     * expect(taggedDataFrame.hasColumnTagFor(-4)).toBeFalsy() // column doesn't exist
     * expect(taggedDataFrame.hasColumnTagFor(400)).toBeFalsy() // column doesn't exist
     * ```
     */
    public hasColumnTagFor(columnIndex: number): boolean {
        return this.columnTagsFor(columnIndex).length > 0
    }

    /**
     * Reports whether the cell with the specified index has a cell-tag. When specifying
     * indexes that are out of bounds, reports that no tag exists but doesn't fail.
     * Because there are no cells with out-of-bound indexes, there are no tags.
     * @param columnIndex The index of the column to check for tags.
     * @param rowIndex The index of the row to check for tags.
     * @return `true` if the specified row has one or more row-tags;`false` otherwise
     * @example
     * ```typescript
     * // create a tagged data-frame
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const taggedDataFrame = dataFrame
     *     .tagRow(0, "row-tag", "row-value")
     *     .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *     .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
     *     .flatMap(df => df.tagRow(0, "row-tag-2", "row-value"))
     *     .flatMap(df => df.tagRow(1, "row-tag-2", "row-value"))
     *     .getOrThrow()
     *
     * // ask about which cells are tagged with a cell-tag
     * expect(taggedDataFrame.hasCellTagFor(2, 2)).toBeTruthy()  // cell-tag
     * expect(taggedDataFrame.hasCellTagFor(1, 2)).toBeFalsy()
     * expect(taggedDataFrame.hasCellTagFor(2, 1)).toBeFalsy()
     *
     * expect(taggedDataFrame.hasCellTagFor(-4, 1)).toBeFalsy() // cell doesn't exist
     * expect(taggedDataFrame.hasCellTagFor(400, 1)).toBeFalsy() // cell doesn't exist
     * ```
     */
    public hasCellTagFor(rowIndex: number, columnIndex: number): boolean {
        return this.cellTagsFor(rowIndex, columnIndex).length > 0
    }

    /**
     * Reports whether the cell with the specified index has a tag. In this case, the
     * tag could be a {@link RowTag}, {@link ColumnTag} , or a {@link CellTag}. When specifying
     * indexes that are out of bounds, reports that no tag exists but doesn't fail.
     * Because there are no cells with out-of-bound indexes, there are no tags.
     * @param columnIndex The index of the column to check for tags.
     * @param rowIndex The index of the row to check for tags.
     * @return `true` if the specified row has one or more row-tags;`false` otherwise
     * @example
     * ```typescript
     * // create a tagged data-frame
     * const dataFrame = DataFrame.from([
     *     [1, 2, 3],
     *     [4, 5, 6],
     *     [7, 8, 9],
     *     [10, 11, 12]
     * ]).getOrThrow()
     * const taggedDataFrame = dataFrame
     *     .tagRow(0, "row-tag", "row-value")
     *     .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
     *     .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
     *     .flatMap(df => df.tagRow(0, "row-tag-2", "row-value"))
     *     .flatMap(df => df.tagRow(1, "row-tag-2", "row-value"))
     *     .getOrThrow()
     *
     * // ask about which cells are tagged
     * expect(taggedDataFrame.hasTagFor(2, 2)).toBeTruthy()  // cell-tag
     * expect(taggedDataFrame.hasTagFor(1, 2)).toBeTruthy()  // row-tag-2
     * expect(taggedDataFrame.hasTagFor(2, 1)).toBeTruthy()   // column-tag
     *
     * expect(taggedDataFrame.hasTagFor(-4, 1)).toBeFalsy() // cell doesn't exist
     * expect(taggedDataFrame.hasTagFor(400, 1)).toBeFalsy() // cell doesn't exist
     * ```
     */
    public hasTagFor(rowIndex: number, columnIndex: number): boolean {
        return this.tagsFor(rowIndex, columnIndex).length > 0
    }
}

type Bounds = { min: number, max: number }

/**
 * Validates that all rows in the provided two-dimensional array have the same number of columns.
 * If the rows have matching dimensions and are non-empty, the validation succeeds.
 * Otherwise, it returns a failure result indicating the discrepancy.
 *
 * @param data A two-dimensional array where each row represents an array of elements.
 * @param [rowForm=true] Whether the matrix is in row-form (each inner vector represents a row), or the matrix
 * is in column-form (each inner vector represents a column).
 * @template T Type of the elements stored in the data structure.
 * @return A success result containing the original data if all rows have the same number of columns and are non-empty.
 *         Otherwise, a failure result contains a descriptive error message.
 */
function validateDimensions<T>(data: Array<Array<T>>, rowForm: boolean = true): Result<Array<Array<T>>, string> {
    const minMax = data.reduce((bounds: Bounds, row: Array<T>) => ({
            min: (row.length < bounds.min) ? row.length : bounds.min,
            max: (row.length > bounds.max) ? row.length : bounds.max
        }), {min: Infinity, max: -Infinity}
    )
    if (minMax.min === minMax.max && minMax.min > 0) {
        return successResult(data)
    }
    const condition = rowForm ?
        `(DataFrame.validateDimensions) All rows must have the same number of columns; min_num_columns: ${minMax.min}, maximum_columns: ${minMax.max}` :
        `(DataFrame.validateDimensions) All columns must have the same number of rows; min_num_rows: ${minMax.min}, maximum_rows: ${minMax.max}`
    return failureResult(condition)
}
