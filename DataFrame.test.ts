import {DataFrame} from "./DataFrame";
import {
    CellCoordinate,
    CellTag,
    ColumnCoordinate,
    ColumnTag,
    isCellTag,
    isColumnTag,
    isRowTag, newCellTag, newColumnTag,
    newRowTag,
    RowCoordinate,
    RowTag, Tag, TagValue
} from "./tags";

describe("Testing data-frame behavior", () => {
    describe("Creating data-frames", () => {

        test("should create a data-frame when dimensions are valid", () => {
            const result = DataFrame.from<number>([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            expect(result.rowCount()).toBe(4)
            expect(result.columnCount()).toBe(3)
            expect(result.elementAt(0, 0).getOrThrow()).toBe(1)
            expect(result.elementAt(2, 2).getOrThrow()).toBe(9)
        })

        test("should not create a data-frame when dimensions are invalid", () => {
            const result = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12, 13]
            ])
            expect(result.failed).toBe(true)
        })

        test("should be able to create a data-frame for a 2D array in columnar form", () => {
            const result = DataFrame.fromColumnData([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const expected = DataFrame.from([
                [1, 4, 7, 10],
                [2, 5, 8, 11],
                [3, 6, 9, 12]
            ]).getOrThrow()
            expect(result.equals(expected)).toBe(true)
            expect(result.rowCount()).toEqual(3)
            expect(result.columnCount()).toEqual(4)
        })

        test("should not be able to create a data-frame for a 2D array in columnar form with invalid dimensions", () => {
            const result = DataFrame.fromColumnData([
                [1, 2, 3], // column 1
                [4, 5, 6], // column 2
                [7, 8, 9], // column 3
                [10, 11, 12, 13]  // column 4, which has 4 rows instead of 3
            ])
            expect(result.failed).toBe(true)
            expect(result.error).toEqual("(DataFrame.validateDimensions) All columns must have the same number of rows; min_num_rows: 3, maximum_rows: 4")
        })

        test("should be able to create a table with various data types", () => {
            const dataFrame = DataFrame.from<number | string>([
                [1, "2", 3],
                [4, "5", 6],
                [7, "8", 9],
                [10, "11", 12]
            ]).getOrThrow()
            expect(dataFrame.rowCount()).toEqual(4)
            expect(dataFrame.columnCount()).toEqual(3)
            expect(dataFrame.elementAt(0, 0).getOrThrow()).toEqual(1)
            expect(typeof dataFrame.elementAt(0, 0).getOrThrow()).toEqual("number")
            expect(dataFrame.elementAt(0, 1).getOrThrow()).toEqual("2")
            expect(typeof dataFrame.elementAt(0, 1).getOrThrow()).toEqual("string")

            const transposed = dataFrame.transpose()
            expect(transposed.rowCount()).toEqual(3)
            expect(transposed.columnCount()).toEqual(4)
            expect(transposed.elementAt(0, 0).getOrThrow()).toEqual(1)
            expect(typeof transposed.elementAt(0, 0).getOrThrow()).toEqual("number")
            expect(transposed.elementAt(1, 0).getOrThrow()).toEqual("2")
            expect(typeof transposed.elementAt(1, 0).getOrThrow()).toEqual("string")
        })
    })

    describe("Testing data-frame equality", () => {
        const dataFrame_4_3 = DataFrame.from([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
            [10, 11, 12]
        ]).getOrThrow()
        const dataFrame_4_3_evens = dataFrame_4_3.mapElements(value => value * 2)
        const dataFrame_4_4 = DataFrame.from([
            [1, 2, 3, 31],
            [4, 5, 6, 61],
            [7, 8, 9, 91],
            [10, 11, 12, 121]
        ]).getOrThrow()

        test("should be able to compare two data-frames", () => {
            expect(dataFrame_4_3).not.toEqual(dataFrame_4_3_evens)
            expect(dataFrame_4_3).not.toEqual(dataFrame_4_4)
        })

        test("a data-frame should be equal to itself", () => {
            expect(dataFrame_4_3).toEqual(dataFrame_4_3)
            expect(dataFrame_4_3_evens).toEqual(dataFrame_4_3_evens)
            expect(dataFrame_4_4).toEqual(dataFrame_4_4)
        })
    })

    describe("Getting data from data-frames", () => {

        test("should get dimensions from a data-frame", () => {
            const result = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
            expect(result.map((df: DataFrame<number>) => df.rowCount()).getOrThrow()).toEqual(4)
            expect(result.map((df: DataFrame<number>) => df.columnCount()).getOrThrow()).toEqual(3)
        })

        test("should retrieve element values when dimensions are valid (2, 2)", () => {
            const value = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
                .flatMap(dataFrame => dataFrame.elementAt(2, 2))
                .getOrThrow()
            expect(value).toEqual(9)
        })

        test("should retrieve element values when dimensions are valid (0, 0)", () => {
            const result = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
            expect(result.flatMap((df: DataFrame<number>) => df.elementAt(0, 0)).getOrThrow()).toEqual(1)
        })

        test("should retrieve element values when dimensions are valid (0, 2)", () => {
            const result = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
            expect(result.flatMap((df: DataFrame<number>) => df.elementAt(0, 2)).getOrThrow()).toEqual(3)
        })

        test("should retrieve element values when dimensions are valid (3, 0)", () => {
            const result = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
            expect(result.flatMap((df: DataFrame<number>) => df.elementAt(3, 0)).getOrThrow()).toEqual(10)
        })

        test("should retrieve element values when dimensions are valid (3, 2)", () => {
            const result = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
            expect(result.flatMap((df: DataFrame<number>) => df.elementAt(3, 2)).getOrThrow()).toEqual(12)
        })

        test("should retrieve row slice at row index", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const slice = dataFrame.rowSlice(2).getOrThrow()
            expect(slice).toEqual([7, 8, 9])

            for (let i = 0; i < slice.length; i++) {
                slice[i] = 10 * slice[i]
            }
            expect(slice).toEqual([70, 80, 90])
            expect(dataFrame.rowSlice(2).getOrThrow()).toEqual([7, 8, 9])
            // const result = DataFrame.from([
            //     [1, 2, 3],
            //     [4, 5, 6],
            //     [7, 8, 9],
            //     [10, 11, 12]
            // ])
            // expect(result.flatMap((df: DataFrame<number>) => df.rowSlice(2)).getOrThrow()).toEqual([7, 8, 9])
        })

        test("should not retrieve row if the row index is out of bounds", () => {
            const result = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
            expect(result.flatMap((df: DataFrame<number>) => df.rowSlice(10)).failed).toBe(true)
        })

        test("should retrieve column at column index", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const slice = dataFrame.columnSlice(1).getOrThrow()
            expect(slice).toEqual([2, 5, 8, 11])
            for (let i = 0; i < slice.length; i++) {
                slice[i] = 10 * slice[i]
            }
            expect(slice).toEqual([20, 50, 80, 110])
            expect(dataFrame.columnSlice(1).getOrThrow()).toEqual([2, 5, 8, 11])
        })

        test("should be able to retrieve all the columns as slices", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ]).getOrThrow()
            const colSlices: Array<Array<number>> = dataFrame.columnSlices()
            expect(colSlices.length).toEqual(3)
            expect(colSlices[0]).toEqual([1, 4, 7])
            expect(colSlices[1]).toEqual([2, 5, 8])
            expect(colSlices[2]).toEqual([3, 6, 9])
        })

        test("should be able to retrieve all the rows as slices", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12],
            ]).getOrThrow()
            const rowSlices: Array<Array<number>> = dataFrame.rowSlices()
            expect(rowSlices.length).toEqual(4)
            expect(rowSlices[0]).toEqual([1, 2, 3])
            expect(rowSlices[1]).toEqual([4, 5, 6])
            expect(rowSlices[2]).toEqual([7, 8, 9])
            expect(rowSlices[3]).toEqual([10, 11, 12])
        })

        test("copy should equal itself", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const copied = dataFrame.copy()
            expect(copied).toEqual(dataFrame)

            copied.setElementInPlaceAt(0, 0, 100)
            expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
            expect(dataFrame).not.toEqual(copied)
        })
    })

    describe("Testing updates to the data-frame", () => {
        test("should be able to get an updated a data-frame without changing the original", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const updated = dataFrame.setElementAt(1, 3, 1000).getOrThrow()
            expect(updated.elementAt(1, 3).getOrThrow()).toEqual(1000)
            expect(dataFrame.equals(DataFrame.from(data).getOrThrow())).toBe(true)
        })

        test("should be able to update a data-frame in-place", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const updated = dataFrame.setElementInPlaceAt(1, 3, 1000).getOrThrow()
            expect(dataFrame).toEqual(updated)
            expect(updated.elementAt(1, 3).getOrThrow()).toEqual(1000)
            // updated in place, so the data-frame has changed
            expect(dataFrame.equals(DataFrame.from(data).getOrThrow())).toBe(false)
        })

        test("should be able to insert a row at beginning", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const updated = dataFrame.insertRowBefore(0, [100, 200, 300]).getOrThrow()
            expect(updated.rowCount()).toEqual(5)
            const expected = DataFrame.from([
                [100, 200, 300],
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            expect(updated.equals(expected)).toBe(true)
            expect(updated.equals(dataFrame)).toBe(false)
        })

        test("should be able to insert a row before end", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const expected = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [100, 200, 300],
                [10, 11, 12]
            ]).getOrThrow()
            const updated = dataFrame.insertRowBefore(3, [100, 200, 300]).getOrThrow()
            expect(updated.rowCount()).toEqual(5)
            expect(updated.equals(expected)).toBe(true)
            expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
        })

        test("should be able to insert a row at end", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const expected = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12],
                [100, 200, 300]
            ]).getOrThrow()
            const updated = dataFrame.pushRow([100, 200, 300]).getOrThrow()
            expect(updated.rowCount()).toEqual(5)
            expect(updated.equals(expected)).toBe(true)
            expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
        })

        test("should be able to delete a row from front", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const updated = dataFrame.deleteRowAt(0).getOrThrow()
            expect(updated.rowCount()).toEqual(3)
            const expected = DataFrame.from([
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            expect(updated.equals(expected)).toBe(true)
            expect(updated.equals(dataFrame)).toBe(false)
        })

        test("should be able to delete a row from middle", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const updated = dataFrame.deleteRowAt(2).getOrThrow()
            expect(updated.rowCount()).toEqual(3)
            const expected = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [10, 11, 12]
            ]).getOrThrow()
            expect(updated.equals(expected)).toBe(true)
            expect(updated.equals(dataFrame)).toBe(false)
        })

        test("should be able to delete a row from end", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const expected = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ]).getOrThrow()
            const updated = dataFrame.deleteRowAt(3).getOrThrow()
            expect(updated.rowCount()).toEqual(3)
            expect(updated.equals(expected)).toBe(true)
            expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
        })

        test("should be able to insert a column at beginning", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const expected = DataFrame.from([
                [100, 1, 2, 3],
                [200, 4, 5, 6],
                [300, 7, 8, 9],
                [400, 10, 11, 12]
            ]).getOrThrow()
            const updated = dataFrame.insertColumnBefore(0, [100, 200, 300, 400]).getOrThrow()
            expect(updated.columnCount()).toEqual(4)
            expect(updated.equals(expected)).toBe(true)
            expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
        })

        test("should be able to insert a column at the end", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const expected = DataFrame.from([
                [1, 2, 3, 100],
                [4, 5, 6, 200],
                [7, 8, 9, 300],
                [10, 11, 12, 400]
            ]).getOrThrow()
            const updated = dataFrame.pushColumn([100, 200, 300, 400]).getOrThrow()
            expect(updated.columnCount()).toEqual(4)
            expect(updated.equals(expected)).toBe(true)
            expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
        })

        test("should be able to delete a column from beginning", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const expected = DataFrame.from([
                [2, 3],
                [5, 6],
                [8, 9],
                [11, 12]
            ]).getOrThrow()
            const updated = dataFrame.deleteColumnAt(0).getOrThrow()
            expect(updated.columnCount()).toEqual(2)
            expect(updated.equals(expected)).toBe(true)
            expect(updated.equals(dataFrame)).toBe(false)
        })
    })

    describe("Manipulating data-frames", () => {
        test("should be able to transpose a data-frame", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const expected = DataFrame.from([
                [1, 4, 7, 10],
                [2, 5, 8, 11],
                [3, 6, 9, 12]
            ]).getOrThrow()
            const transposed = dataFrame.transpose()
            expect(transposed).toEqual(expected)
        })

        test("should be able to apply a map to each element in the data-frame", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const expected = DataFrame.from<string>([
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['10', '11', '12']
            ]).getOrThrow()
            const updated = dataFrame.mapElements<string>(value => (`${value}`))
            expect(updated).toEqual(expected)
            expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
        })

        test("should be able to apply a map to each element in the data-frame based on its coordinates", () => {
            const data = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]
            const dataFrame = DataFrame.from(data).getOrThrow()
            const expected = DataFrame.from<string>([
                ['0', '1', '2'],
                ['4', '6', '8'],
                ['14', '17', '20'],
                ['30', '34', '38']
            ]).getOrThrow()
            const updated = dataFrame
                .mapElements<string>((value, row, column) => (`${value * row + column}`))
            expect(updated).toEqual(expected)
            expect(dataFrame).toEqual(DataFrame.from(data).getOrThrow())
        })
    })

    describe("Row and column functions", () => {
        test("should be able to map a row in the data-frame", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const expected = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [14, 16, 18],
                [10, 11, 12]
            ]).getOrThrow()
            const updated = dataFrame.mapRow(2, (value: number) => value * 2).getOrThrow()
            expect(updated).toEqual(expected)
            expect(dataFrame).not.toEqual(expected)
        })

        test("should be able to map a row in the data-frame in-place", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const expected = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [14, 16, 18],
                [10, 11, 12]
            ]).getOrThrow()
            const updated = dataFrame.mapRowInPlace(2, (value: number) => value * 2).getOrThrow()
            expect(updated).toEqual(expected)
            expect(dataFrame).toEqual(updated)
        })

        test("should be able to map a column in the data-frame", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const expected = DataFrame.from([
                [1, 4, 3],
                [4, 10, 6],
                [7, 16, 9],
                [10, 22, 12]
            ]).getOrThrow()
            const updated = dataFrame.mapColumn(1, (value: number) => value * 2).getOrThrow()
            expect(updated).toEqual(expected)
            expect(dataFrame).not.toEqual(expected)
        })

        test("should be able to map a column in the data-frame in-place", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const expected = DataFrame.from([
                [1, 4, 3],
                [4, 10, 6],
                [7, 16, 9],
                [10, 22, 12]
            ]).getOrThrow()
            const updated = dataFrame.mapColumnInPlace(1, (value: number) => value * 2).getOrThrow()
            expect(updated).toEqual(expected)
            expect(dataFrame).toEqual(updated)
        })
    })

    describe("Testing tagging functionality", () => {
        test("should be able to tag a row", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]).getOrThrow()

            const result = dataFrame.tagRow(1, "row-tag", "row-value").getOrThrow()

            // Verify the result is a DataFrame
            expect(result).toBeDefined()
            expect(result.rowCount()).toBe(3)
            expect(result.columnCount()).toBe(3)
            expect(result.hasRowTagFor(1)).toBeTruthy()
            expect(result.hasRowTagFor(2)).toBeFalsy()
        })

        test("should return error when tagging row with invalid index", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]).getOrThrow()

            const result = dataFrame.tagRow(5, "row-tag", "row-value")

            expect(result.failed).toBe(true)
            expect(result.error).toContain("Row index for row tag is out of bounds")
        })

        test("should be able to tag a column", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]).getOrThrow()

            const result = dataFrame.tagColumn(1, "column-tag", "column-value").getOrThrow()

            // Verify the result is a DataFrame
            expect(result).toBeDefined()
            expect(result.rowCount()).toBe(3)
            expect(result.columnCount()).toBe(3)
        })

        test("should return error when tagging column with invalid index", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]).getOrThrow()

            const result = dataFrame.tagColumn(5, "column-tag", "column-value")

            expect(result.failed).toBe(true)
            expect(result.error).toContain("Column index for column tag is out of bounds")
        })

        test("should be able to tag a cell", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]).getOrThrow()

            const result = dataFrame.tagCell(1, 2, "cell-tag", "cell-value").getOrThrow()

            // Verify the result is a DataFrame
            expect(result).toBeDefined()
            expect(result.rowCount()).toBe(3)
            expect(result.columnCount()).toBe(3)
        })

        test("should return error when tagging cell with invalid row index", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]).getOrThrow()

            const result = dataFrame.tagCell(5, 1, "cell-tag", "cell-value")

            expect(result.failed).toBe(true)
            expect(result.error).toContain("Row index for cell tag is out of bounds")
        })

        test("should return error when tagging cell with invalid column index", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]).getOrThrow()

            const result = dataFrame.tagCell(1, 5, "cell-tag", "cell-value")

            expect(result.failed).toBe(true)
            expect(result.error).toContain("Column index for cell tag is out of bounds")
        })

        test("should be able to chain multiple tag operations", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]).getOrThrow()

            const taggedDataFrame = dataFrame
                .tagRow(0, "row-tag", "row-value")
                .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
                .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
                .getOrThrow()

            // Verify the result is a DataFrame
            expect(taggedDataFrame).toBeDefined()
            expect(taggedDataFrame.rowCount()).toBe(3)
            expect(taggedDataFrame.columnCount()).toBe(3)
            expect(taggedDataFrame.hasTagFor(2, 2)).toBe(true)
            expect(taggedDataFrame.hasColumnTagFor(1)).toBe(true)
            expect(taggedDataFrame.hasRowTagFor(0)).toBe(true)
        })

        describe("Retrieving cells based on tags", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()

            const taggedDataFrame = dataFrame
                .tagRow(0, "row-tag", "row-value")
                .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
                .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
                .getOrThrow()

            test("should be able to retrieve all cells for a specific row tag", () => {
                const tag = newRowTag("row-tag", "row-value", RowCoordinate.of(0))
                const cellValues = taggedDataFrame.cellsTaggedWith(tag).getOrThrow()
                expect(cellValues).toHaveLength(3)
                expect(cellValues[0]).toEqual({"row": 0, "column": 0, "value": 1})
                expect(cellValues[1]).toEqual({"row": 0, "column": 1, "value": 2})
                expect(cellValues[2]).toEqual({"row": 0, "column": 2, "value": 3})
            })

            test("should not retrieve cells for a row tag that doesn't match any tags", () => {
                const tag = newRowTag("row-tag", "not-row-value", RowCoordinate.of(0))
                const cellValues = taggedDataFrame.cellsTaggedWith(tag).getOrThrow()
                expect(cellValues).toHaveLength(0)
            })

            test("should be able to retrieve all cells for a specific column tag", () => {
                const tag = newColumnTag("column-tag", "column-value", ColumnCoordinate.of(1))
                const cellValues = taggedDataFrame.cellsTaggedWith(tag).getOrThrow()
                expect(cellValues).toHaveLength(4)
                expect(cellValues[0]).toEqual({"row": 0, "column": 1, "value": 2})
                expect(cellValues[1]).toEqual({"row": 1, "column": 1, "value": 5})
                expect(cellValues[2]).toEqual({"row": 2, "column": 1, "value": 8})
                expect(cellValues[3]).toEqual({"row": 3, "column": 1, "value": 11})
            })

            test("should not retrieve cells for a column tag that doesn't match any tags", () => {
                const tag = newColumnTag("column-tag", "not-column-value", ColumnCoordinate.of(1))
                const cellValues = taggedDataFrame.cellsTaggedWith(tag).getOrThrow()
                expect(cellValues).toHaveLength(0)
            })

            test("should be able to retrieve all cells for a specific cell tag", () => {
                const tag = newCellTag("cell-tag", "cell-value", CellCoordinate.of(2, 2))
                const cellValues = taggedDataFrame.cellsTaggedWith(tag).getOrThrow()
                expect(cellValues).toHaveLength(1)
                expect(cellValues[0]).toEqual({"row": 2, "column": 2, "value": 9})
            })

            test("should not retrieve cells for a cell tag that doesn't match any tags", () => {
                const tag = newCellTag("cell-tag", "not-cell-value", CellCoordinate.of(2, 2))
                const cellValues = taggedDataFrame.cellsTaggedWith(tag).getOrThrow()
                expect(cellValues).toHaveLength(0)
            })

            test("should fail if tag type is not an AvailableTagType object", () => {
                class MySpecialTag<T extends TagValue> extends Tag<T, RowCoordinate> {
                    constructor(readonly name: string, readonly value: T, readonly coordinate: RowCoordinate) {
                        super(name, value, coordinate)
                    }
                    getCoordinate(): RowCoordinate {
                        return super.getCoordinate();
                    }
                }
                const tag = new MySpecialTag("special-tag", "special-value", RowCoordinate.of(0))
                const cellValues = taggedDataFrame.cellsTaggedWith(tag)
                expect(cellValues.failed).toBe(true)
                expect(cellValues.error).toEqual("(DataFrame::cellsTaggedWith) Invalid tag type. Tag must be a RowTag, ColumnTag, or CellTagtag: special-tag:special-value:(0, *)")
            })
        })

        describe("Retrieving cells based on tags", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()

            const taggedDataFrame = dataFrame
                .tagRow(0, "row-tag", "row-value")
                .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
                .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
                .flatMap(df => df.tagRow(0, "row-tag-2", "row-value"))
                .flatMap(df => df.tagRow(1, "row-tag-2", "row-value"))
                .getOrThrow()

            test("should be able to retrieve both row tags for the first row", () => {
                const tags = taggedDataFrame.rowTagsFor(0)
                expect(tags).toHaveLength(2)
                expect(tags[0].name).toEqual("row-tag")
                expect(tags[0].value).toEqual("row-value")
                expect(tags[1].name).toEqual("row-tag-2")
                expect(tags[1].value).toEqual("row-value")
            })

            test("should be able to retrieve the row tag for the second row", () => {
                const tags = taggedDataFrame.rowTagsFor(1)
                expect(tags).toHaveLength(1)
                expect(tags[0].name).toEqual("row-tag-2")
                expect(tags[0].value).toEqual("row-value")
            })
        })

        describe("Testing categorization functions", () => {
            const rowTag = newRowTag("row-tag", "row-value", RowCoordinate.of(3))
            const columnTag = newColumnTag("column-tag", "column-value", ColumnCoordinate.of(3))
            const cellTag = newCellTag("row-tag", "row-value", CellCoordinate.of(3, 4))

            test("should be able to determine if a tag is a row-tag", () => {
                expect(isRowTag(rowTag)).toBeTruthy()
                expect(isRowTag(columnTag)).toBeFalsy()
                expect(isRowTag(cellTag)).toBeFalsy()
            })
        })

        test("should be able to filter by tag", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]).getOrThrow()
            const taggedDataFrame = dataFrame
                .tagRow(0, "row-tag", "row-value")
                .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
                .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
                .getOrThrow()
            const rowTags = taggedDataFrame.filterTags(tag => tag.name === "row-tag")
            expect(rowTags.length).toBe(1)
            expect(rowTags[0].name).toBe("row-tag")
            expect(rowTags[0].value).toBe("row-value")
            expect((rowTags[0] as RowTag<string>).isRowTag()).toBeTruthy()
            expect((rowTags[0] as RowTag<string>).coordinate.toString()).toBe("(0, *)")
            expect(isRowTag(rowTags[0])).toBeTruthy()

            const columnTags = taggedDataFrame.filterTags(tag => tag.name === "column-tag")
            expect(columnTags.length).toBe(1)
            expect(columnTags[0].name).toBe("column-tag")
            expect(columnTags[0].value).toBe("column-value")
            expect((columnTags[0] as ColumnTag<string>).isColumnTag()).toBeTruthy()
            expect((columnTags[0] as ColumnTag<string>).coordinate.toString()).toBe("(*, 1)")
            expect(isColumnTag(columnTags[0])).toBeTruthy()

            const cellTags = taggedDataFrame.filterTags(tag => tag.name === "cell-tag")
            expect(cellTags.length).toBe(1)
            expect(cellTags[0].name).toBe("cell-tag")
            expect(cellTags[0].value).toBe("cell-value")
            expect((cellTags[0] as CellTag<string>).isCellTag()).toBeTruthy()
            expect((cellTags[0] as CellTag<string>).coordinate.toString()).toBe("(2, 2)")
            expect(isCellTag(cellTags[0])).toBeTruthy()
        })
    })
})
