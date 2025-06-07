import {DataFrame} from "./DataFrame";

describe("Testing data-frame behavior", () => {
    describe("Creating data-frames", () => {

        test("should create a data-frame when dimensions are valid", () => {
            const result = DataFrame.from<number>([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
            expect(result.succeeded).toBe(true)
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
            const result = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
            expect(result.flatMap((df: DataFrame<number>) => df.elementAt(2, 2)).getOrThrow()).toEqual(9)
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

        test("should retrieve row at row index", () => {
            const result = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
            expect(result.flatMap((df: DataFrame<number>) => df.rowSlice(2)).getOrThrow()).toEqual([7, 8, 9])
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
            const result = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ])
            expect(result.flatMap((df: DataFrame<number>) => df.columnSlice(1)).getOrThrow()).toEqual([2, 5, 8, 11])
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

        test("copy should equal itself", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const copied = dataFrame.copy()
            expect(copied.equals(dataFrame)).toBe(true)
        })
    })

    describe("Testing updates to the data-frame", () => {
        test("should be able to get an updated a data-frame without changing the original", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const updated = dataFrame.setElementAt(1, 3, 1000).getOrThrow()
            expect(updated.elementAt(1, 3).getOrThrow()).toEqual(1000)
            expect(updated.equals(dataFrame)).toBe(false)
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
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const updated = dataFrame.insertRowBefore(3, [100, 200, 300]).getOrThrow()
            expect(updated.rowCount()).toEqual(5)
            const expected = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [100, 200, 300],
                [10, 11, 12]
            ]).getOrThrow()
            expect(updated.equals(expected)).toBe(true)
            expect(updated.equals(dataFrame)).toBe(false)
        })

        test("should be able to insert a row at end", () => {
            const dataFrame = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12]
            ]).getOrThrow()
            const updated = dataFrame.pushRow([100, 200, 300]).getOrThrow()
            expect(updated.rowCount()).toEqual(5)
            const expected = DataFrame.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
                [10, 11, 12],
                [100, 200, 300]
            ]).getOrThrow()
            expect(updated.equals(expected)).toBe(true)
            expect(updated.equals(dataFrame)).toBe(false)
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

            const result = dataFrame
                .tagRow(0, "row-tag", "row-value")
                .getOrThrow()
                .tagColumn(1, "column-tag", "column-value")
                .getOrThrow()
                .tagCell(2, 2, "cell-tag", "cell-value")
                .getOrThrow()

            // Verify the result is a DataFrame
            expect(result).toBeDefined()
            expect(result.rowCount()).toBe(3)
            expect(result.columnCount()).toBe(3)
        })
    })
})
