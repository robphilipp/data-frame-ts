# Typescript DataFrame

(AI generated docs, for now.)

A lightweight, immutable, two-dimensional data structure for TypeScript that allows for manipulation and querying of tabular data.

## Installation

```bash
npm install data-frame-ts
```

## Overview

`DataFrame` is a two-dimensional data structure that stores data in a row-major format. It is designed to be immutable for immutable objects, meaning that modifications to the rows, columns, or elements will not modify the original `DataFrame`, but rather return a modified copy.

Key features:
- Create DataFrames from row or column data
- Access and manipulate rows, columns, and individual elements
- Transform data through mapping operations
- Tag rows, columns, and cells with metadata
- Immutable operations that return new DataFrames

## Basic Usage

### Creating a DataFrame

```typescript
import { DataFrame } from 'data-frame-ts';

// Create a DataFrame from row data
const df = DataFrame.from([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]).getOrThrow();

// Create a DataFrame from column data
const dfFromColumns = DataFrame.fromColumnData([
  [1, 4, 7],  // first column
  [2, 5, 8],  // second column
  [3, 6, 9]   // third column
]).getOrThrow();
```

### Accessing Data

```typescript
// Get dimensions
const rowCount = df.rowCount();  // 3
const colCount = df.columnCount();  // 3

// Access an element
const element = df.elementAt(1, 2).getOrThrow();  // 6

// Get a row
const row = df.rowSlice(0).getOrThrow();  // [1, 2, 3]

// Get a column
const column = df.columnSlice(1).getOrThrow();  // [2, 5, 8]

// Get all rows
const allRows = df.rowSlices();  // [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

// Get all columns
const allColumns = df.columnSlices();  // [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
```

### Modifying Data

```typescript
// Set an element (returns a new DataFrame)
const updatedDf = df.setElementAt(0, 0, 100).getOrThrow();

// Insert a row
const dfWithNewRow = df.insertRowBefore(1, [10, 11, 12]).getOrThrow();

// Add a row at the end
const dfWithAddedRow = df.pushRow([10, 11, 12]).getOrThrow();

// Insert a column
const dfWithNewColumn = df.insertColumnBefore(1, [10, 11, 12]).getOrThrow();

// Add a column at the end
const dfWithAddedColumn = df.pushColumn([10, 11, 12]).getOrThrow();

// Delete a row
const dfWithoutRow = df.deleteRowAt(1).getOrThrow();

// Delete a column
const dfWithoutColumn = df.deleteColumnAt(1).getOrThrow();
```

### Transforming Data

```typescript
// Transpose the DataFrame
const transposed = df.transpose();

// Map a row (returns a new DataFrame)
const mappedRow = df.mapRow(1, value => value * 2).getOrThrow();

// Map a column (returns a new DataFrame)
const mappedColumn = df.mapColumn(1, value => value * 2).getOrThrow();

// Map a row in-place (modifies the original DataFrame)
const mappedRowInPlace = df.mapRowInPlace(1, value => value * 2).getOrThrow();

// Map a column in-place (modifies the original DataFrame)
const mappedColumnInPlace = df.mapColumnInPlace(1, value => value * 2).getOrThrow();
```

## Advanced Features

### Tagging

The DataFrame supports tagging rows, columns, and cells with metadata:

```typescript
// Tag a row
df.tagRow(0, "category", { toString: () => "header" });

// Tag a column
df.tagColumn(1, "dataType", { toString: () => "numeric" });

// Tag a cell
df.tagCell(1, 2, "highlight", { toString: () => "true" });
```

### Error Handling

The library uses a `Result` type from the `result-fn` package for error handling:

```typescript
// Safe handling of operations that might fail
const result = DataFrame.from([
  [1, 2, 3],
  [4, 5]  // Different number of columns will cause validation to fail
]);

if (result.succeeded) {
  const df = result.value;
  // Use the DataFrame
} else {
  console.error(result.error);
}

// Alternative using getOrThrow (will throw an error if operation fails)
try {
  const df = DataFrame.from([
    [1, 2, 3],
    [4, 5, 6]
  ]).getOrThrow();
  // Use the DataFrame
} catch (error) {
  console.error(error);
}
```

## API Reference

### Creation Methods

- `DataFrame.from<V>(data: Array<Array<V>>, rowForm: boolean = true): Result<DataFrame<V>, string>`
- `DataFrame.fromColumnData<V>(data: Array<Array<V>>): Result<DataFrame<V>, string>`

### Data Access Methods

- `rowCount(): number`
- `columnCount(): number`
- `elementAt(rowIndex: number, columnIndex: number): Result<V, string>`
- `rowSlice(rowIndex: number): Result<Array<V>, string>`
- `rowSlices(): Array<Array<V>>`
- `columnSlice(columnIndex: number): Result<Array<V>, string>`
- `columnSlices(): Array<Array<V>>`
- `copy(): DataFrame<V>`
- `equals(other: DataFrame<V>): boolean`

### Data Modification Methods

- `setElementAt(rowIndex: number, columnIndex: number, value: V): Result<DataFrame<V>, string>`
- `insertRowBefore(rowIndex: number, row: Array<V>): Result<DataFrame<V>, string>`
- `pushRow(row: Array<V>): Result<DataFrame<V>, string>`
- `insertColumnBefore(columnIndex: number, column: Array<V>): Result<DataFrame<V>, string>`
- `pushColumn(column: Array<V>): Result<DataFrame<V>, string>`
- `deleteRowAt(rowIndex: number): Result<DataFrame<V>, string>`
- `deleteColumnAt(columnIndex: number): Result<DataFrame<V>, string>`

### Data Transformation Methods

- `transpose(): DataFrame<V>`
- `mapRow(rowIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string>`
- `mapRowInPlace(rowIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string>`
- `mapColumn(columnIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string>`
- `mapColumnInPlace(columnIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string>`

### Tagging Methods

- `tagRow<T extends TagValue>(rowIndex: number, name: string, tag: T): Result<DataFrame<V>, string>`
- `tagColumn<T extends TagValue>(columnIndex: number, name: string, tag: T): Result<DataFrame<V>, string>`
- `tagCell<T extends TagValue>(rowIndex: number, columnIndex: number, name: string, tag: T): Result<DataFrame<V>, string>`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.