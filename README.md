# Typescript DataFrame

A TypeScript library for working with two-dimensional data structures with tagging capabilities.

A lightweight, immutable, two-dimensional data structure for TypeScript that allows for manipulation and querying of tabular data.

## Table of Contents
- [Installation](#installation)
- [Overview](#overview)
- [Basic Usage](#basic-usage)
  - [Creating a DataFrame](#creating-a-dataframe)
  - [Accessing Data](#accessing-data)
  - [Modifying Data](#modifying-data)
  - [Transforming Data](#transforming-data)
- [Advanced Features](#advanced-features)
  - [Tagging](#tagging)
    - [Adding Tags](#adding-tags)
    - [Retrieving Tags](#retrieving-tags)
    - [Retrieving Cells That Are Tagged](#retrieving-cells-that-are-tagged)
  - [Error Handling](#error-handling)
- [API Reference](#api-reference)
  - [DataFrame Creation Methods](#dataframe-creation-methods)
  - [Data Access Methods](#data-access-methods)
  - [Data Modification Methods](#data-modification-methods)
  - [Data Transformation Methods](#data-transformation-methods)
  - [Tagging Methods](#tagging-methods)
- [Contributing](#contributing)
- [License](#license)

## Installation

[(toc)](#table-of-contents)

```bash
npm install data-frame-ts
```

## Overview

[(toc)](#table-of-contents)

`DataFrame` is a two-dimensional data structure that stores data in a row-major format. It is designed to be immutable for immutable objects, meaning that modifications to the rows, columns, or elements will not modify the original `DataFrame`, but rather return a modified copy.

Key features:
- Create DataFrames from row or column data
- Access and manipulate rows, columns, and individual elements
- Transform data through mapping operations
- Tag rows, columns, and cells with metadata
- Immutable operations that return new DataFrames

## Basic Usage

[(toc)](#table-of-contents)

### Creating a DataFrame

[(toc)](#table-of-contents)

The `DataFrame` class provides two factory functions for creating a `DataFrame` object. Both of these factory methods are `static` (and remain part of the class for namespacing). The constructor is `private` and cannot be accessed directly.
1. `DataFrame.from<V>(data: Array<Array<V>>, rowForm: boolean = true): Result<DataFrame<V>, string>`
2. `fromColumnData<V>(data: Array<Array<V>>): Result<DataFrame<V>, string>`

```typescript
import { DataFrame } from 'data-frame-ts';

// Create a DataFrame from row data and get back a [Result](https://github.com/robphilipp/result) holding the
// data-frame when the data matrix is valid. For example, if not all 
// the rows have the same number of elements, then the `Result` holds
// a failure describing the issue.
const result = DataFrame.from([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
])

// You also create a `DataFrame` from column data and get back a `Result` holding the new data-frame.
// In this case, the data-frame's first row will be `[1, 2, 3]`, the second row will be `[4, 5, 6]`,
// and the third row will be `[7, 8, 9]`.
const result2 = DataFrame.fromColumnData([
  [1, 4, 7],  // first column
  [2, 5, 8],  // second column
  [3, 6, 9]   // third column
])
```

The first function, `from(...)` accepts an array of rows, where each row is represented by an array of values of type `V`. The second function, `fromColumnData(...)` accepts an array of columns, where each column is represented by an array of values of type, you guessed it, `V`. In both cases, the `DataFrame` converts the data to its internal representation, and all methods behave identically, regardless of the factory function used to instantiate the `DataFrame` object.

### Accessing Data

[(toc)](#table-of-contents)

Once you've created a `DataFrame`, you may want to ask questions about the data that it holds. 

> These are examples, and so the usage of the `Result` class isn't idiomatic. Please see [Result documentation](https://github.com/robphilipp/result/blob/main/README.md) for how to use the `Result` class correctly. 

```typescript
// After creating a `DataFrame` you can ask questions about it.
// Here, we grab the data-frame directly from the result. (Normally, 
// you would use the `Result` class' map method, but this is just 
// and example.) See the [Result](https://github.com/robphilipp/result) class
// documentation for more information on `Result`.
const dataFrom = DataFrame.from([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]).getOrThrow()

// Get dimensions
const rowCount = dataFrom.rowCount();  // 3
const colCount = dataFrom.columnCount();  // 3

// Access an element
const element = dataFrom.elementAt(1, 2).getOrThrow();  // 6

// Get a row
const row = dataFrom.rowSlice(0).getOrThrow();  // [1, 2, 3]

// Get a column
const column = dataFrom.columnSlice(1).getOrThrow();  // [2, 5, 8]

// Get all rows (doesn't need to return a `Result`)
const allRows = dataFrom.rowSlices();  // [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

// Get all columns (doesn't need to return a `Result`)
const allColumns = dataFrom.columnSlices();  // [[1, 4, 7], [2, 5, 8], [3, 6, 9]]

// grab a sub-frame for a range
const subFrame = dataFrame.subFrame(indexFrom(1, 1), indexFrom(2, 2)).getOrThrow() // [[5, 6], [8, 9]]
```

As another example, let's find all the rows in a data-frame that contain the same value as a some chosen element. Then let's create a new data-frame containing only those rows.

```typescript
// the data contains two rows that contain the value 7. 
const data = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 7, 12]
]

// create a new data-frame with only the rows that contain the value found at (row, column) = (2, 0), or
// the value of 7.
const filteredDataFrame = DataFrame
        // create a data-frame from the data
        .from(data)
        // grab the value of the element at (2, 0), and then return a tuple with the original
        // data-frame and the value.
        .flatMap(dataFrame => dataFrame.elementAt(2, 0).map(value => ({dataFrame, value})))
        // run through all the rows of the data-frame, filtering out all the rows that do NOT
        // contain a value of 7
        .map(pair => pair.dataFrame.rowSlices().filter(row => row.some(value => value === pair.value)))
        // create a new data-frame from those filtered rows
        .flatMap(rows => DataFrame.from(rows))
        // unwrap the filtered data-frame (though in you code, this could go on... :)
        .getOrThrow()

// the expected data-frame has only the last two rows of the original data-frame
const expectedDataFrame = DataFrame.from([
  [7, 8, 9],
  [10, 7, 12]
]).getOrThrow()

expect(filteredDataFrame).toEqual(expectedDataFrame)
```

### Modifying Data

[(toc)](#table-of-contents)

Now that we can create data-frames, and get basic information from them, we may also want to transform or update the data-frame. The idiomatic way of updating or transforming a data-frame leaves the original data-frame unmodified, and returns a copy of the original data-frame with the updated values. When performance is an issue, there are also methods for updating and transforming the data-frame in-place.

```typescript
// Create a data-frame
const dataFrame = DataFrame.from([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]).getOrThrow()

//
// The following examples returns a `Result` because, for example, 
// the rowIndex and/or the columnIndex could be out of bounds. 
// Notice that the original `dataFrame` is not modified. 
//

// Set the value of element (0, 0) (returns a new DataFrame).
const updatedDf = dataFrame.setElementAt(0, 0, 100).getOrThrow();

// Add a row after the last row. Returns a `Result` because the specified 
// row length may not equal the row lengths in the data-frame.
const dfWithAddedRow = dataFrame.pushRow([10, 11, 12]).getOrThrow();

// Insert a column
const dfWithNewColumn = dataFrame.insertColumnBefore(1, [10, 11, 12]).getOrThrow();

// Add a column at the end
const dfWithAddedColumn = dataFrame.pushColumn([10, 11, 12]).getOrThrow();

// Delete a row
const dfWithoutRow = dataFrame.deleteRowAt(1).getOrThrow();

// Delete a column
const dfWithoutColumn = dataFrame.deleteColumnAt(1).getOrThrow();

//
// These calls modify the original dataFrame object, and return the original
// modified dataFrame
//

// Set an element in-place (modifies the original DataFrame). In this case,
// `dataFrame` and `updatedInPlace` are the same data-frame. Only use this
// method when performance matters.
const originalDataFrame = dataFrame.setElementInPlaceAt(0, 0, 100).getOrThrow();

// Insert a row before the second row in the `dataFrame`. Returns a `Result` 
// because the specified row length may not equal the row lengths in the 
// data-frame, and the row-index may be out of bounds. 
const stillOriginalDataFrame = dataFrame.insertRowBefore(1, [10, 11, 12]).getOrThrow();
```


### Transforming Data

[(toc)](#table-of-contents)

The previous section should an example of modifying the data-frames. This sections gives examples of transforming data-frames.

```typescript

// Create a data-frame
const dataFrame = DataFrame.from([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]).getOrThrow()

//
// each of these examples leaves the original `dataFrame` unmodified and returns a new `DataFrame` instance.
//

// Transpose the DataFrame
const transposed = dataFrame.transpose();

// Map all elements in the DataFrame
const stringDF = dataFrame.mapElements(value => value.toString());  // Convert all numbers to strings

// Map a row (returns a new DataFrame)
const mappedRow = dataFrame.mapRow(1, value => value * 2).getOrThrow();

// Map a column (returns a new DataFrame)
const mappedColumn = dataFrame.mapColumn(1, value => value * 2).getOrThrow();

//
// these two examples modifies the original `dataFrame` and returns it
//

// Map a row in-place (modifies the original DataFrame)
const mappedRowInPlace = dataFrame.mapRowInPlace(1, value => value * 2).getOrThrow();

// Map a column in-place (modifies the original DataFrame)
const mappedColumnInPlace = dataFrame.mapColumnInPlace(1, value => value * 2).getOrThrow();
```

The previous example showed simple transformations of the `dataFrame`. The next examples show how to do multiple transformations on a data-frame idiomatically and get back the resultant transformed data.

```typescript
// suppose we have some data that we want to transform
const data = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 7, 12]
]

// create a `DataFrame` and manipulate it idiomatically, thanks to the `Result` class
const dataFrame = DataFrame
        // create a row-form data-frame
        .from(data)
        // grab the value (7) of the data element at row 2, column 0. return the value
        // and the original data-frame a tuple. (flatMap because elementAt returns a Result)
        .flatMap(dataFrame => dataFrame.elementAt(2, 0).map(value => ({dataFrame, value})))
        // retrieve only the rows that contain the value 7 (simple map because rowSlices returns
        // an array of rows)
        .map(pair => pair.dataFrame.rowSlices().filter(row => row.some(value => value === pair.value)))
        // and then create a new `DataFrame` from the filtered rows
        .flatMap(rows => DataFrame.from(rows))
        // transform each element by adding the product of the row-index and column-index to the value
        .map(dataFrame => dataFrame.mapElements((value, rowIndex, columnIndex) => value + rowIndex * columnIndex))
        // tranpose the data-frame
        .map(dataFrame => dataFrame.transpose())
        .getOrThrow()

// the values in the `dataFrame` are now        
// [[7, 10],
// [8, 7 + 1],
// [9, 12 + 2]]
```

## Advanced Features

[(toc)](#table-of-contents)

The `DataFrame` class supports tagging rows, columns, and cells. AI calls this an advanced feature. Who am I to argue with AI? According to AI, the other "advanced feature" is the use of the [Result](https://github.com/robphilipp/result) class for error handling. See below.

### Tagging

[(toc)](#table-of-contents)

Tags can be used to store metadata about the DataFrame's structure, such as column headers, row labels, or cell-specific information. The tagging system allows for flexible annotation of data and can be used for filtering, highlighting, or providing additional context to your data.

The `DataFrame` class supports tagging rows, columns, and cells with metadata. Tags are name-value pairs associated with specific coordinates in the `DataFrame`. 

#### Adding Tags

[(toc)](#table-of-contents)

Tagging elements in a `DataFrame` is achieved by using the `tagRow(...)`, `tagColumn(...)`, and `tagCell(...)` methods. 
1. Tagging a row means that all the elements (cells) in that row have that tag. 
2. Tagging a column means that all the elements (cells) in that column have that tag. 
3. Tagging a cell, only tags the cell at the specified (row, column) coordinates.

A row, column, and cell can be tagged with any data type that implements the `TagValue` interface. Essentially, the data type must implement a `toString()` method. Not a high bar.

There is an **important** difference between modifying data in a data-frame, and adding tags. Recall that (except for the "in-place" methods) when modifying data in a data-frame, the original data-frame is unmodified. Instead of modifying the original data-frame, a modified copy is returned. Togging is different. When using tagging operations, the original data-frame is modified and returned. The difference is that tagging updates metadata describing aspects of the data-frame rather than the data in the data-frame. 

```typescript
const dataFrame = DataFrame.from([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]).getOrThrow()

// Tag a row
dataFrame.tagRow(0, "category", "header").getOrThrow();

// Tag a column
dataFrame.tagColumn(1, "dataType", "numeric").getOrThrow();

// Tag a cell
dataFrame.tagCell(1, 2, "highlight", {color: "orange", opacity: 0.3}).getOrThrow();


// Chain multiple tag operations
const taggedDataFrame = dataFrame.tagRow(0, "category", "header")
        .flatMap(df => df.tagColumn(1, "dataType", "numeric"))
        .flatMap(df => df.tagCell(1, 2, "highlight", {color: "orange", opacity: 0.3}))
        .getOrThrow()

// taggedDataFrame and the original dataFrame are the same object
```

#### Retrieving Tags

[(toc)](#table-of-contents)

Presumably, data-frames are tagged so that we can use the information in the tag later. The next examples show how to retrieve tags based on their type (row, column, cell). There are some important distinctions in the behavior of the tag retrieval methods.

The `tagsFor(rowIndex: number, columnIndex: number)` method returns **all** tags on that cell. This means that if the cell is in a row that has a row-tag, that row-tag would also be returned. Likewise, if the cell is in a column that has a column-tag, it is also returned. This is the expected use case. However, if you really only want cell-tags, you can use the `cellTagsFor(rowIndex: number, columnIndex: number)` method.

The `cellTagsFor(rowIndex: number, columnIndex: number)` returns **only** cell-tags that apply to the element in the (rowIndex, columnIndex) of the data-frame.

The `rowTagsFor(rowIndex: number)` returns **only** row-tags for any cell in that row. And the `columnTagsFor(columnIndex: number)` returns only the column-tags for cells in that column.

```typescript
// Create a tagged DataFrame
const dataFrame = DataFrame.from([
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [10, 11, 12]
]).getOrThrow();

const taggedDataFrame = dataFrame.tagRow(0, "row-tag", "row-value")
    .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
    .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
    .flatMap(df => df.tagRow(0, "row-tag-2", "row-value"))
    .flatMap(df => df.tagRow(1, "row-tag-2", "row-value"))
    .getOrThrow();

// Retrieve row tags
const rowTags = taggedDataFrame.rowTagsFor(0);
// rowTags contains two tags: "row-tag" and "row-tag-2"

// Retrieve column tags
const columnTags = taggedDataFrame.columnTagsFor(1);
// columnTags contains one tag: "column-tag"

// Retrieve cell tags for the third row and fourth column
const cellTags = taggedDataFrame.cellTagsFor(2, 2);

// Retrieve all tags for the third row and fourth column, including
// row and column tags if the cell is in a row or column that is tagged.
const allTags = taggedDataFrame.tagsFor(2, 2);

// Check if a row has tags
const hasRowTag = taggedDataFrame.hasRowTagFor(0);  // true
const hasNoRowTag = taggedDataFrame.hasRowTagFor(2);  // false
```

In some cases, you may not want to retrieve the tag for a cell, row, or column. Instead, you may only need to know **if** there is a tag on that cell. The following example shows how to do that.

```typescript
// Filter tags based on a predicate
const rowTags = taggedDataFrame.filterTags(tag => tag.name === "row-tag");
// rowTags contains all tags with the name "row-tag"

// Get cells tagged with a specific tag
const tag = newRowTag("row-tag", "row-value", RowCoordinate.of(0));
const cellValues = taggedDataFrame.cellsTaggedWith(tag).getOrThrow();
// cellValues contains all cells in the row tagged with "row-tag"

// Check if a column has tags
const hasColumnTag = taggedDataFrame.hasColumnTagFor(1);  // true if column 1 has tags

// Check if a cell has tags
const hasCellTag = taggedDataFrame.hasCellTagFor(2, 2);  // true if cell at (2,2) has tags

// Check if a position has any tags (row, column, or cell)
const hasAnyTag = taggedDataFrame.hasTagFor(1, 1);  // true if position (1,1) has any tags
```

#### Retrieving Cells That Are Tagged

[(toc)](#table-of-contents)

The previous example demonstrated how to retrieve tags and determine whether a cell is tagged. In this section we demonstrate retrieving the cells that are tagged. The `cellsTaggedWith(tag: Tag<TagValue, TagCoordinate>): Result<Array<CellValue<V>>, string>` method provides a means for doing this. When handed a tag, it returns a `Result` holding a array of `CellValue<T>` objects of the shape

```typescript
{
  value: V
  row: number
  column: number
}
```
The reason that the `cellsTaggedWith(...)` method returns a `Result` is that a tag has associated coordinates. The coordinates must be valid. When they are out of bounds, the `Result` has an error message that explains the reason.

```typescript
const dataFrame = DataFrame
        .from([
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
          [10, 11, 12]
        ])
        .tagRow(0, "row-tag", "row-value")
        .flatMap(df => df.tagColumn(1, "column-tag", "column-value"))
        .flatMap(df => df.tagCell(2, 2, "cell-tag", "cell-value"))
        .getOrThrow()

// Retrieve cells tagged with a row-tag that is name "row-tag", has a value" 
// "row_value", and is in the first row. We expect to get back the array:
// [{"row": 0, "column": 0, "value": 1}, 
//  {"row": 0, "column": 1, "value": 2}, 
//  {"row": 0, "column": 2, "value": 3}]
const cellValues = dataFrame
        .cellsTaggedWith(newRowTag("row-tag", "row-value", RowCoordinate.of(0)))
        .getOrThrow()
```

### Error Handling

[(toc)](#table-of-contents)

The library uses a [Result](https://github.com/robphilipp/result) class from the [result-fn](https://www.npmjs.com/package/result-fn) package for error handling. In a nutshell, the `Result` class is returned from a function that could fail. The `Result` holds either a `success` or a `failure`, depending on the outcome. The value of the `success` is the successful execution of the function. The value of the `failure` is an error object, that could be a string or some other more complex object. `Result`s can be chained. In a results chain, the evaluation in the chain is only performed if the previous evaluation resulted in a `success`, otherwise it drops through. Here are some examples.

```typescript
const dataFrame = DataFrame
        // create a row-form data-frame
        .from(data)
        // grab the value (7) of the data element at row 2, column 0. return the value
        // and the original data-frame a tuple. (flatMap because elementAt returns a Result)
        .flatMap(dataFrame => dataFrame.elementAt(2, 0).map(value => ({dataFrame, value})))
        // retrieve only the rows that contain the value 7 (simple map because rowSlices returns
        // an array of rows)
        .map(pair => pair.dataFrame.rowSlices().filter(row => row.some(value => value === pair.value)))
        // and then create a new `DataFrame` from the filtered rows
        .flatMap(rows => DataFrame.from(rows))
        // transform each element by adding the product of the row-index and column-index to the value
        .map(dataFrame => dataFrame.mapElements((value, rowIndex, columnIndex) => value + rowIndex * columnIndex))
        // tranpose the data-frame
        .map(dataFrame => dataFrame.transpose())
        // when there is an error, this will return an empty data-frame (see also getOrThrow)
        .getOrElse(DataFrame.empty())
```

## API Reference

[(toc)](#table-of-contents)

### DataFrame Creation Methods

[(toc)](#table-of-contents)

- `DataFrame.from<V>(data: Array<Array<V>>, rowForm: boolean = true): Result<DataFrame<V>, string>` - Creates a DataFrame from a 2D array of data
- `DataFrame.fromColumnData<V>(data: Array<Array<V>>): Result<DataFrame<V>, string>` - Creates a DataFrame from column-oriented data
- `DataFrame.empty<V>(): Result<DataFrame<V>, string>` - Creates an empty DataFrame

### Data Access Methods

[(toc)](#table-of-contents)

- `isEmpty(): boolean` - Returns true if the DataFrame is empty, false otherwise
- `rowCount(): number` - Returns the number of rows in the DataFrame
- `columnCount(): number` - Returns the number of columns in the DataFrame
- `elementAt(rowIndex: number, columnIndex: number): Result<V, string>` - Returns the element at the specified row and column
- `rowSlice(rowIndex: number): Result<Array<V>, string>` - Returns a copy of the specified row
- `rowSlices(): Array<Array<V>>` - Returns all rows as a 2D array
- `columnSlice(columnIndex: number): Result<Array<V>, string>` - Returns a copy of the specified column
- `columnSlices(): Array<Array<V>>` - Returns all columns as a 2D array
- `subFrame(start: Index, end: Index): Result<DataFrame<V>, string>` - Returns a sub-frame for the specified range
- `copy(): DataFrame<V>` - Creates a copy of the DataFrame
- `equals(other: DataFrame<V>): boolean` - Checks if this DataFrame equals another DataFrame

### Data Modification Methods

[(toc)](#table-of-contents)

- `setElementAt(rowIndex: number, columnIndex: number, value: V): Result<DataFrame<V>, string>` - Sets the value at the specified row and column
- `setElementInPlaceAt(rowIndex: number, columnIndex: number, value: V): Result<DataFrame<V>, string>` - Sets the value at the specified row and column and modifies the original DataFrame
- `insertRowBefore(rowIndex: number, row: Array<V>): Result<DataFrame<V>, string>` - Inserts a row before the specified index
- `pushRow(row: Array<V>): Result<DataFrame<V>, string>` - Adds a row at the end of the DataFrame
- `insertColumnBefore(columnIndex: number, column: Array<V>): Result<DataFrame<V>, string>` - Inserts a column before the specified index
- `pushColumn(column: Array<V>): Result<DataFrame<V>, string>` - Adds a column at the end of the DataFrame
- `deleteRowAt(rowIndex: number): Result<DataFrame<V>, string>` - Deletes the row at the specified index
- `deleteColumnAt(columnIndex: number): Result<DataFrame<V>, string>` - Deletes the column at the specified index

### Data Transformation Methods

[(toc)](#table-of-contents)

- `transpose(): DataFrame<V>` - Transposes the DataFrame (rows become columns and columns become rows)
- `mapElements<U>(mapper: (value: V, rowIndex: number, columnIndex: number) => U): DataFrame<U>` - Applies a function to each element in the DataFrame and returns a new DataFrame
- `mapRow(rowIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string>` - Maps a function over a row and returns a new DataFrame
- `mapRowInPlace(rowIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string>` - Maps a function over a row and modifies the original DataFrame
- `mapColumn(columnIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string>` - Maps a function over a column and returns a new DataFrame
- `mapColumnInPlace(columnIndex: number, mapper: (value: V) => V): Result<DataFrame<V>, string>` - Maps a function over a column and modifies the original DataFrame

### Tagging Methods

[(toc)](#table-of-contents)

- `tagRow<T extends TagValue>(rowIndex: number, name: string, tag: T): Result<DataFrame<V>, string>` - Tags a specific row with a name-value pair
- `tagColumn<T extends TagValue>(columnIndex: number, name: string, tag: T): Result<DataFrame<V>, string>` - Tags a specific column with a name-value pair
- `tagCell<T extends TagValue>(rowIndex: number, columnIndex: number, name: string, tag: T): Result<DataFrame<V>, string>` - Tags a specific cell with a name-value pair
- `rowTagsFor(rowIndex: number): Array<Tag<TagValue, RowCoordinate>>` - Retrieves all row tags associated with the specified row index
- `columnTagsFor(columnIndex: number): Array<Tag<TagValue, ColumnCoordinate>>` - Retrieves all column tags associated with the specified column index
- `cellTagsFor(rowIndex: number, columnIndex: number): Array<Tag<TagValue, CellCoordinate>>` - Retrieves all cell-specific tags associated with the specified (row, column) index
- `tagsFor(rowIndex: number, columnIndex: number): Array<Tag<TagValue, TagCoordinate>>` - Retrieves all tags (row, column, and cell) associated with the specified (row, column) index
- `hasRowTagFor(rowIndex: number): boolean` - Reports whether the row with the specified index has any row tags
- `hasColumnTagFor(columnIndex: number): boolean` - Reports whether the column with the specified index has any column tags
- `hasCellTagFor(rowIndex: number, columnIndex: number): boolean` - Reports whether the cell with the specified (row, column) index has any cell tags
- `hasTagFor(rowIndex: number, columnIndex: number): boolean` - Reports whether the cell with the specified (row, column) index has any tags (row, column, or cell)
- `filterTags(predicate: (tag: Tag<TagValue, TagCoordinate>) => boolean): Array<Tag<TagValue, TagCoordinate>>` - Returns an array of tags that meet the criteria specified in the predicate
- `cellsTaggedWith(tag: Tag<TagValue, TagCoordinate>): Result<Array<CellValue<V>>, string>` - Returns an array of cell values that are tagged with the specified tag

The `TagValue` type represents values that can be used as tags. The library includes several coordinate types:
- `RowCoordinate` - Represents a coordinate for a tag on an entire row
- `ColumnCoordinate` - Represents a coordinate for a tag on an entire column
- `CellCoordinate` - Represents a coordinate for a tag on a specific cell

The `Tags` class provides methods for managing collections of tags:
- `Tags.with<T>(...tag: Array<Tag<T, TagCoordinate>>)` - Creates a Tags object with the specified tags
- `Tags.empty<T, C>()` - Creates an empty Tags object
- `add(name, value, coordinate)` - Adds a new tag if it doesn't already exist
- `replace(name, value, coordinate)` - Replaces an existing tag
- `addOrReplace(name, value, coordinate)` - Adds a new tag or replaces an existing one
- `remove(id)` - Removes a tag by ID

## Contributing

[(toc)](#table-of-contents)

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[(toc)](#table-of-contents)

This project is licensed under the MIT License - see the LICENSE file for details.
