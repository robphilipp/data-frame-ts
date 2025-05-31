import {failureResult, Result, successResult} from "result-fn";

/**
 * Represents a coordinate in a data frame.
 * A coordinate can be a row, column, or cell coordinate.
 */
export interface TagCoordinate {
    /**
     * Determines whether this coordinate equals another coordinate.
     * @param other The other coordinate to compare with
     * @return `true` if the coordinates are equal; `false` otherwise
     */
    equals: (other: TagCoordinate) => boolean

    /**
     * Returns a string representation of this coordinate.
     * @return A string representation of the coordinate
     */
    toString: () => string
}

/**
 * Represents a value that can be associated with a tag.
 * A tag value must be able to be converted to a string.
 */
export interface TagValue {
    /**
     * Returns a string representation of this value.
     * @return A string representation of the value
     */
    toString: () => string
}

/**
 * Represents a tag with a name, value, and coordinate.
 * A tag is used to associate metadata with a specific location in a data frame.
 * @template V The type of the tag's value
 * @template C The type of the tag's coordinate
 */
export type Tag<V extends TagValue, C extends TagCoordinate> = {
    /**
     * The unique identifier of the tag
     */
    readonly id: string

    /**
     * The name of the tag
     */
    readonly name: string

    /**
     * The value associated with the tag
     */
    readonly value: V

    /**
     * The coordinate where the tag is located
     */
    readonly coordinate: C

    // meetsCondition: (predicate: TagPredicate<V, C>) => boolean

    /**
     * Returns a string representation of this tag
     * @return A string representation of the tag
     */
    toString: () => string

    // meetsCondition: (predicate: (value: TagValue) => boolean) => TagValue | undefined
    // map: <T>(transform: (value: TagValue) => T) => T
    // equals: (other: TagValue) => boolean
}

/**
 * Represents a tag associated with a row in a data frame.
 * @template T The type of the tag's value
 */
export type RowTag<T extends TagValue> = Tag<T, RowCoordinate>

/**
 * Represents a tag associated with a column in a data frame.
 * @template T The type of the tag's value
 */
export type ColumnTag<T extends TagValue> = Tag<T, ColumnCoordinate>

/**
 * Represents a tag associated with a cell in a data frame.
 * @template T The type of the tag's value
 */
export type CellTag<T extends TagValue> = Tag<T, CellCoordinate>

/**
 * Creates a new tag with the specified name, value, and coordinate.
 * @param name The tag's name
 * @param value The tag's value
 * @param coordinate The tag's coordinate
 * @return A new tag with the specified properties
 */
export function newTag<V extends TagValue, C extends TagCoordinate>(
    name: string,
    value: V,
    coordinate: C
): Tag<V, C> {

    return {
        id: `tag-${name}-${coordinate.toString().replace(/ /g, "")}`,
        name,
        value,
        coordinate,
        // meetsCondition: predicate => predicate(name, value, coordinate),
        toString: () => `${name}:${value.toString()}:${coordinate.toString().replace(/ /g, "")}`
    }
}

/**
 * Creates a new row tag with the specified name, value, and coordinate.
 * @param name The tag's name
 * @param value The tag's value
 * @param coordinate The row coordinate
 * @return A new row tag with the specified properties
 */
export function newRowTag<T extends TagValue>(name: string, value: T, coordinate: RowCoordinate): RowTag<T> {
    return newTag<T, RowCoordinate>(name, value, coordinate)
}

/**
 * Creates a new column tag with the specified name, value, and coordinate.
 * @param name The tag's name
 * @param value The tag's value
 * @param coordinate The column coordinate
 * @return A new column tag with the specified properties
 */
export function newColumnTag<T extends TagValue>(name: string, value: T, coordinate: ColumnCoordinate): ColumnTag<T> {
    return newTag<T, ColumnCoordinate>(name, value, coordinate)
}

/**
 * Creates a new cell tag with the specified name, value, and coordinate.
 * @param name The tag's name
 * @param value The tag's value
 * @param coordinate The cell coordinate
 * @return A new cell tag with the specified properties
 */
export function newCellTag<T extends TagValue>(name: string, value: T, coordinate: CellCoordinate): CellTag<T> {
    return newTag<T, CellCoordinate>(name, value, coordinate)
}

/**
 * Represents an immutable collection of tags.
 * @template T The type of the tags' values
 * @template C The type of the tags' coordinates
 */
export class Tags<T extends TagValue, C extends TagCoordinate> {
    private readonly tags: Array<Tag<T, C>>

    /**
     * Creates a new empty collection of tags.
     * @see Tags.with
     */
    private constructor(tags: Array<Tag<T, C>> = []) {
        this.tags = tags
    }

    /**
     * Creates a {@link Tags} object based on the specified {@link Tag} objects.
     *
     * @param tag The tags to be combined into the Tags instance.
     * @return A new Tags instance containing the provided tags.
     */
    public static with<T extends TagValue>(...tag: Array<Tag<T, TagCoordinate>>): Tags<T, TagCoordinate> {
        return new Tags<T, TagCoordinate>(tag)
    }

    /**
     * Creates an empty {@link Tags} object.
     * @return An empty {@link Tags} object.
     */
    public static empty<T extends TagValue, C extends TagCoordinate>(): Tags<T, C> {
        return new Tags<T, C>()
    }

    /**
     * Creates a copy of this {@link Tags} object.
     * @return A copy of this {@link Tags} object.
     */
    private copy(): Tags<T, C> {
        const tags: Array<Tag<T, C>> = this.tags.slice()
        return new Tags<T, C>(tags)
    }

    /**
     * @return The number of tags
     */
    public length(): number {
        return this.tags.length
    }

    /**
     * Return all the tags that meet the condition of the specified predicate
     * @param predicate The predicate that determines which tags are returned
     * @return An array of {@link Tag}s that meet the condition in the specified predicate
     */
    public filter(predicate: (tag: Tag<T, C>) => boolean): Array<Tag<T, C>> {
        return this.tags.filter(tag => predicate(tag))
    }

    /**
     * Finds the ID of the unique tag with the specified name and coordinate.
     * @param name The tag's name
     * @param coordinate The tag's coordinate
     * @return A Result containing the ID of the unique tag if exactly one is found, or an error message if none or multiple are found
     */
    public idForTag(name: string, coordinate: C): Result<string, string> {
        return this.uniqueTagFor(name, coordinate).map(tag => tag.id)
    }

    /**
     * Adds a new tag with the specified name, value, and coordinate if it doesn't already exist.
     *
     * If the tag is added successfully, then returns a {@link Result} holding the updated {@link Tags} object.
     * If the tag could not be added, then returns a failure result with a message indicating the reason for the failure.
     *
     * @param name The tag's name
     * @param value The tag's value
     * @param coordinate The tag's coordinate
     * @return The a {@link Result} holding the updated {@link Tags} object or a failure message if the tag could not be added.
     * @see replace
     * @see addOrReplace
     *
     * @example
     * ```typescript
     * const result = Tags.empty<number, CellCoordinate>().add("name", 314, CellCoordinate.of(0, 0))
     * expect(result.map(tags => tags.hasUniqueTagFor("name", CellCoordinate.of(0, 0)))).toBe(true)
     * ```
     */
    public add(name: string, value: T, coordinate: C): Result<Tags<T, C>, string> {
        const tagsObject: Tags<T, C> = this.copy()
        if (this.hasTagFor(name, coordinate)) {
            return failureResult(
                `(Tags::add) Cannot add tag because a tag with the same name and coordinate already exists; ` +
                `name: ${name}, coordinate: ${coordinate.toString()}`
            )
        }
        tagsObject.tags.push(newTag(name, value, coordinate))
        return successResult(tagsObject)
    }

    /**
     * Replaces the tag with the specified name and coordinate with a new tag with the specified value.
     * <p>
     * If a tag with the same name and coordinate exists, then replaces the tag and returns a {@link Result}
     * holding the updated {@link Tags} object.
     * <p>
     * If no tag with the same name and coordinate exists, then returns a failure result with a message
     * indicating the reason for the failure.
     *
     * @param name The tag's name
     * @param value The tag's value
     * @param coordinate The tag's coordinate
     * @return The a {@link Result} holding the updated {@link Tags} object or a failure message if the tag could not be replaced.
     * @see add
     * @see addOrReplace
     *
     * @example
     * ```typescript
     * let result = Tags.empty<number, CellCoordinate>().add("name", 314, CellCoordinate.of(0, 0))
     * expect(result.map(tags => tags.hasUniqueTagFor("name", CellCoordinate.of(0, 0)))).toBe(true)
     *
     * result = Tags.empty<number, CellCoordinate>().replace("name", 314159, CellCoordinate.of(0, 0))
     * expect(result.map(tags => tags.hasUniqueTagFor("name", CellCoordinate.of(0, 0)))).toBe(true)
     * expect(result.map(tags => tags.uniqueTagFor("name", CellCoordinate.of(0, 0)).map(tag => tag.value).getOrDefault(0))).toBe(314159)
     *
     * result = Tags.empty<number, CellCoordinate>().replace("no-name", 314, CellCoordinate.of(0, 0))
     * expect(result.failed).toBe(true)
     * ```
     */
    public replace(name: string, value: T, coordinate: C): Result<Tags<T, C>, string> {
        const tagsObject: Tags<T, C> = this.copy()
        if (!this.hasUniqueTagFor(name, coordinate)) {
            return failureResult(
                `(Tags::replace) Cannot replace tag because no unique tag with name and coordinate was found; ` +
                `name: ${name}, coordinate: ${coordinate.toString()}`
            )
        }
        const index = tagsObject.tags.findIndex(tag => tag.name === name && tag.coordinate.equals(coordinate))
        tagsObject.tags[index] = newTag(name, value, coordinate)
        return successResult(tagsObject)
    }

    /**
     * Adds a new tag with the specified name, value, and coordinate if it doesn't already exist. If the tag
     * already exists, then replaces the tag with a new tag using the specified specified name, value, and coordinate.
     *
     * This is a convenience function in cases where the more string {@link add} and {@link replace} methods are not
     * necessary.
     * @param name The tag's name
     * @param value The tag's value
     * @param coordinate The tag's coordinate
     * @return An updated copy of the {@link Tags} object.
     * @see add
     * @see replace
     */
    public addOrReplace(name: string, value: T, coordinate: C): Tags<T, C> {
        const tagsObject: Tags<T, C> = this.copy()
        return tagsObject.add(name, value, coordinate)
            .mapFailure(_ => tagsObject.replace(name, value, coordinate))
            .getOrDefault(tagsObject)
    }

    /**
     * Removes the tag with the specified ID from the collection of tags.
     * If no tag with the specified ID exists, this method does nothing.
     * @param id The ID of the tag to remove
     * @return A {@link Result} whose success value is a new {@link Tags} object with the
     * tag removed. When the specified ID is not found, then returns a failure.
     */
    public remove(id: string): Result<Tags<T, C>, string> {
        const index = this.tags.findIndex(tag => tag.id === id)
        if (index >= 0) {
            // make a copy of the tags object and remove the tag
            const tagsObject: Tags<T, C> = this.copy()
            tagsObject.tags.splice(index, 1)
            return successResult(tagsObject)
        }
        return failureResult(
            `Unable to remove tag with specified tag ID because no tag with this ID was found; tag_id: ${id}`
        )
    }

    /**
     * Determines whether at least one tag has the specified name and coordinates.
     * @param name The tag's name
     * @param coordinate The tag's coordinate
     * @return `true` if there is at least one tag that matches the specified name and coordinate.
     * If there are no matches, then returns `false`.
     */
    public hasTagFor(name: string, coordinate: C): boolean {
        return this.tags.some(tag => tag.name === name && tag.coordinate.equals(coordinate))
    }

    /**
     * Determines whether there is one and only one tag that has the specified name and coordinates.
     * @param name The tag's name
     * @param coordinate The tag's coordinate
     * @return `true` if there is exactly one tag that matches the specified name and coordinate.
     * If there are no matches, or more tha one match, then returns `false`.
     */
    public hasUniqueTagFor(name: string, coordinate: C): boolean {
        return this.tags.filter(tag => tag.name === name && tag.coordinate.equals(coordinate)).length === 1
    }

    /**
     * Determines whether there exists a tag with the specified name
     * @param name The tag's name
     * @return `true` if there exists at least one tag with the specified name; `false` otherwise
     */
    public hasTagWithName(name: string): boolean {
        return this.tags.some(tag => tag.name === name)
    }

    /**
     * Finds all the tags that have the specified coordinate and returns them.
     * @param coordinate The coordinate on which to filter the tags
     * @return An array of tags that match the specified coordinate
     */
    public tagsForCoordinate(coordinate: C): Array<Tag<T, C>> {
        return this.filter(tag => tag.coordinate.equals(coordinate))
    }

    /**
     * Finds the unique tag with the specified name and coordinate.
     * @param name The tag's name
     * @param coordinate The tag's coordinate
     * @return A Result containing the unique tag if exactly one is found, or an error message if none or multiple are found
     */
    public uniqueTagFor(name: string, coordinate: C): Result<Tag<T, C>, string> {
        const tags = this.tags.filter(tag => tag.name === name && tag.coordinate.equals(coordinate))
        if (tags.length === 0) {
            return failureResult(`No tag with name ${name} found for coordinate ${coordinate.toString}`)
        }
        if (tags.length > 1) {
            return failureResult(`Multiple tags with name ${name} found for coordinate ${coordinate.toString}`)
        }
        return successResult(tags[0])
    }
}

/**
 * Represents a collection of tags associated with rows in a data frame.
 * @template T The type of the tags' values
 */
export type RowTags<T extends TagValue> = Tags<T, RowCoordinate>

/**
 * Represents a collection of tags associated with columns in a data frame.
 * @template T The type of the tags' values
 */
export type ColumnTags<T extends TagValue> = Tags<T, ColumnCoordinate>

/**
 * Represents a collection of tags associated with cells in a data frame.
 * @template T The type of the tags' values
 */
export type CellTags<T extends TagValue> = Tags<T, CellCoordinate>

/**
 * Class that represents a coordinate for a tag on an entire row. Use the
 * {@link RowCoordinate.of} method to construct a row-coordinate object.
 * @see CellCoordinate
 * @see ColumnCoordinate
 */
export class RowCoordinate implements TagCoordinate {

    private constructor(private readonly row: number) {
    }

    /**
     * Creates a new RowCoordinate with the specified row index.
     * @param row The row index
     * @return A new RowCoordinate
     */
    public static of(row: number): RowCoordinate {
        return new RowCoordinate(row)
    }

    /**
     * Determines whether this coordinate equals another coordinate.
     * @param other The other coordinate to compare with
     * @return `true` if the other coordinate is a RowCoordinate with the same row index; `false` otherwise
     */
    public equals(other: TagCoordinate): boolean {
        return other instanceof RowCoordinate && this.row === other.row
    }

    /**
     * Returns a string representation of this coordinate.
     * @return A string in the format "(row, *)"
     */
    public toString(): string {
        return `(${this.row}, *)`
    }
}

/**
 * Class that represents a coordinate for a tag on an entire column. Use the
 * {@link ColumnCoordinate.of} method to construct a column-coordinate object.
 * @see CellCoordinate
 * @see RowCoordinate
 */
export class ColumnCoordinate implements TagCoordinate {
    private constructor(private readonly column: number) {
    }

    /**
     * Creates a new ColumnCoordinate with the specified column index.
     * @param column The column index
     * @return A new ColumnCoordinate
     */
    public static of(column: number): ColumnCoordinate {
        return new ColumnCoordinate(column)
    }

    /**
     * Determines whether this coordinate equals another coordinate.
     * @param other The other coordinate to compare with
     * @return `true` if the other coordinate is a ColumnCoordinate with the same column index; `false` otherwise
     */
    public equals(other: TagCoordinate): boolean {
        return other instanceof ColumnCoordinate && this.column === other.column
    }

    /**
     * Returns a string representation of this coordinate.
     * @return A string in the format "(*, column)"
     */
    public toString(): string {
        return `(*, ${this.column})`
    }
}

/**
 * Class that represents a coordinate for a tag on an individual cell. Use the
 * {@link CellCoordinate.of} method to construct a cell-coordinate object.
 * @see RowCoordinate
 * @see ColumnCoordinate
 */
export class CellCoordinate implements TagCoordinate {

    private constructor(private readonly row: number, private readonly column: number) {
    }

    /**
     * Creates a new CellCoordinate with the specified row and column indices.
     * @param row The row index
     * @param column The column index
     * @return A new CellCoordinate
     */
    public static of(row: number, column: number): CellCoordinate {
        return new CellCoordinate(row, column)
    }

    /**
     * Determines whether this coordinate equals another coordinate.
     * @param other The other coordinate to compare with
     * @return `true` if the other coordinate is a CellCoordinate with the same row and column indices; `false` otherwise
     */
    public equals(other: TagCoordinate): boolean {
        return other instanceof CellCoordinate && this.row === other.row && this.column === other.column
    }

    /**
     * Returns a string representation of this coordinate.
     * @return A string in the format "(row, column)"
     */
    public toString(): string {
        return `(${this.row}, ${this.column})`
    }
}
