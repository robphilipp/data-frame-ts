import {failureResult, Result, successResult} from "result-fn";

/**
 * Represents a coordinate in a data frame to which the tag applies.
 * A coordinate can be a row, column, or cell coordinate.
 */
export interface TagCoordinate {
    /**
     * @return The coordinate of the tag as a named tuple. When
     * one of the coordinates is not defined, for example, the column
     * coordinate of a {@link RowCoordinate}, or the row coordinate
     * of a {@link ColumnCoordinate}, then that coordinate value is
     * `NaN`.
     */
    coordinate: () => [row: number, column: number]

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
export abstract class Tag<V extends TagValue, C extends TagCoordinate> {
    /**
     * The unique identifier of the tag
     */
    readonly id: string

    /**
     * Constructor for a base tag
     * @param name The name of the tag
     * @param value The value associated with the tag
     * @param coordinate The coordinate (in the data-frame) to which the tag applies
     * @protected
     */
    protected constructor(readonly name: string, readonly value: V, readonly coordinate: C) {
        this.id = `tag-${name}-${coordinate.toString().replace(/ /g, "")}`
    }

    /**
     * Retrieves the coordinate value (in the data-frame) to which the tag applies
     * @return The coordinate to which the tag applies.
     */
    getCoordinate(): C {
        return this.coordinate
    }

    /**
     * Compares this {@link Tag} instance with another {@link Tag} instance for equality.
     * Two {@link Tag} object are considered equal if their `name`, `value`, and `coordinate`
     * are equal.
     *
     * @param other - The Tag instance to compare with.
     * @return `true` if both {@link Tag} instances are equal, `false` otherwise.
     */
    equals(other: Tag<V, C>): boolean {
        return this.name === other.name && this.value.toString() === other.value.toString() && this.coordinate.equals(other.coordinate)
    }

    /**
     * Returns a string representation of this tag
     * @return A string representation of the tag
     */
    toString(): string {
        return `${this.name}:${this.value.toString()}:${this.coordinate.toString()}`
    }
}

/**
 * Defines the available {@link Tag} types that are available. This is used for determining the
 * type of individual tags.
 * <p>
 * **Note** that when adding a new {@link Tag} type, add that tag type to this list
 */
export type AvailableTagTypes<V extends TagValue, C extends TagCoordinate> = RowTag<V> | ColumnTag<V> | CellTag<V> | Tag<V, C>

/**
 * Represents a tag associated with a row in a data frame.
 * @template T The type of the tag's value
 */
export class RowTag<T extends TagValue> extends Tag<T, RowCoordinate> {
    /**
     * Constructor for a row tag
     * @param name The name of the tag
     * @param value The value associated with the tag
     * @param coordinate The coordinate (in the data-frame) to which the tag applies
     * @protected
     */
    constructor(readonly name: string, readonly value: T, readonly coordinate: RowCoordinate) {
        super(name, value, coordinate)
    }

    /**
     * Method used to narrow {@link Tag} objects to determine their type
     * @return `true`
     */
    isRowTag(): this is RowTag<T> {
        return true
    }

    /**
     * Retrieves the coordinate value (in the data-frame) to which the tag applies
     * @return The coordinate to which the tag applies.
     */
    getCoordinate(): RowCoordinate {
        return super.getCoordinate();
    }
}

/**
 * Given a tag that is one of the {@link AvailableTagTypes}, determines whether the tag is a {@link RowTag}
 * @param tag An tag that is one of the {@link AvailableTagTypes}
 * @return `true` if the tag is a {@link RowTag}; `false` otherwise
 */
export function isRowTag<V extends TagValue>(tag: AvailableTagTypes<V, TagCoordinate>): tag is RowTag<V> {
    return (tag as RowTag<V>).isRowTag !== undefined
}

/**
 * Represents a tag associated with a column in a data frame.
 * @template T The type of the tag's value
 */
export class ColumnTag<T extends TagValue> extends Tag<T, ColumnCoordinate> {
    /**
     * Constructor for a column tag
     * @param name The name of the tag
     * @param value The value associated with the tag
     * @param coordinate The coordinate (in the data-frame) to which the tag applies
     * @protected
     */
    constructor(readonly name: string, readonly value: T, readonly coordinate: ColumnCoordinate) {
        super(name, value, coordinate)
    }

    /**
     * Method used to narrow {@link Tag} objects to determine their type
     * @return `true`
     */
    isColumnTag(): this is ColumnTag<T> {
        return true
    }

    /**
     * Retrieves the coordinate value (in the data-frame) to which the tag applies
     * @return The coordinate to which the tag applies.
     */
    getCoordinate(): ColumnCoordinate {
        return super.getCoordinate();
    }
}

/**
 * Given a tag that is one of the {@link AvailableTagTypes}, determines whether the tag is a {@link ColumnTag}
 * @param tag An tag that is one of the {@link AvailableTagTypes}
 * @return `true` if the tag is a {@link ColumnTag}; `false` otherwise
 */
export function isColumnTag<V extends TagValue>(tag: AvailableTagTypes<V, TagCoordinate>): tag is ColumnTag<V> {
    return (tag as ColumnTag<V>).isColumnTag !== undefined
}


/**
 * Represents a tag associated with a cell in a data frame.
 * @template T The type of the tag's value
 */
export class CellTag<T extends TagValue> extends Tag<T, CellCoordinate> {
    /**
     * Constructor for a cell tag
     * @param name The name of the tag
     * @param value The value associated with the tag
     * @param coordinate The coordinate (in the data-frame) to which the tag applies
     * @protected
     */
    constructor(readonly name: string, readonly value: T, readonly coordinate: CellCoordinate) {
        super(name, value, coordinate)
    }

    /**
     * Method used to narrow {@link Tag} objects to determine their type
     * @return `true`
     */
    isCellTag(): this is CellTag<T> {
        return true
    }

    /**
     * Retrieves the coordinate value (in the data-frame) to which the tag applies
     * @return The coordinate to which the tag applies.
     */
    getCoordinate(): CellCoordinate {
        return super.getCoordinate();
    }
}

/**
 * Given a tag that is one of the {@link AvailableTagTypes}, determines whether the tag is a {@link CellTag}
 * @param tag An tag that is one of the {@link AvailableTagTypes}
 * @return `true` if the tag is a {@link CellTag}; `false` otherwise
 */
export function isCellTag<V extends TagValue>(tag: AvailableTagTypes<V, TagCoordinate>): tag is CellTag<V> {
    return (tag as CellTag<V>).isCellTag !== undefined
}

/**
 * Creates a new tag with the specified name, value, and coordinate.
 * @param tag A constructor object for a tag
 * @param name The tag's name
 * @param value The tag's value
 * @param coordinate The tag's coordinate
 * @return A new tag with the specified properties
 * @example
 * ```typescript
 * // create a new RowTag using the tag function (there is also a newRowTag function)
 * const tag: RowTag<string> = newTag(RowTag, "mytag", "nicetag", RowCoordinate.of(0))
 * expect(tag.id).toBe("tag-mytag-(0,*)")
 * expect(tag.name).toBe("mytag")
 * expect(tag.value).toBe("nicetag")
 * expect(tag.coordinate).toEqual(RowCoordinate.of(0))
 * expect(tag.toString()).toBe("mytag:nicetag:(0, *)")
 * ```
 */
export function newTag<V extends TagValue, C extends TagCoordinate, T extends Tag<V, C>>(
    tag: new (name: string, value: V, coordinate: C) => T,
    name: string,
    value: V,
    coordinate: C
): T {
    return new tag(name, value, coordinate)
}

/**
 * Creates a new row tag with the specified name, value, and coordinate.
 * @param name The tag's name
 * @param value The tag's value
 * @param coordinate The row coordinate
 * @return A new row tag with the specified properties
 */
export function newRowTag<T extends TagValue>(name: string, value: T, coordinate: RowCoordinate): RowTag<T> {
    return newTag<T, RowCoordinate, RowTag<T>>(RowTag<T>, name, value, coordinate)
}

/**
 * Creates a new column tag with the specified name, value, and coordinate.
 * @param name The tag's name
 * @param value The tag's value
 * @param coordinate The column coordinate
 * @return A new column tag with the specified properties
 */
export function newColumnTag<T extends TagValue>(name: string, value: T, coordinate: ColumnCoordinate): ColumnTag<T> {
    return newTag<T, ColumnCoordinate, ColumnTag<T>>(ColumnTag<T>, name, value, coordinate)
}

/**
 * Creates a new cell tag with the specified name, value, and coordinate.
 * @param name The tag's name
 * @param value The tag's value
 * @param coordinate The cell coordinate
 * @return A new cell tag with the specified properties
 */
export function newCellTag<T extends TagValue>(name: string, value: T, coordinate: CellCoordinate): CellTag<T> {
    return newTag<T, CellCoordinate, CellTag<T>>(CellTag<T>, name, value, coordinate)
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
        // de-dup the list where elements later in the let overwrite earlier ones
        // todo make this more efficient, kinda grody
        const deDupedTags = tag.slice().reverse().reduce(
            (accumulatedTags, currentTag) => {
                if (!accumulatedTags.some(tg => tg.name === currentTag.name && tg.coordinate.equals(currentTag.coordinate))) {
                    accumulatedTags.push(currentTag)
                }
                return accumulatedTags
            },
            [] as Array<Tag<T, TagCoordinate>>
        )
        return new Tags<T, TagCoordinate>(deDupedTags.reverse())
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
        return new Tags<T, C>(this.tags.slice())
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
     *
     * @example
     * ```typescript
     * // find all the tags that end with a number
     * const rowTags = tags.filter(tag => /[0-9]+$/.test(tag.name))
     * expect(rowTags.length).toBe(1)
     * expect(rowTags[0].name).toBe("my-row-tag-1")
     * ```
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
     * @param tag The tag to add
     * @return The a {@link Result} holding the updated {@link Tags} object or a failure message if the tag could not be added.
     * @see replace
     * @see addOrReplace
     *
     * @example
     * ```typescript
     * const result = Tags.empty<number, CellCoordinate>().add(newCellTag("name", 314, CellCoordinate.of(0, 0)))
     * expect(result.map(tags => tags.hasUniqueTagFor("name", CellCoordinate.of(0, 0)))).toBe(true)
     * ```
     */
    public add(tag: Tag<T, C>): Result<Tags<T, C>, string> {
        const tagsObject: Tags<T, C> = this.copy()
        if (this.hasTagFor(tag.name, tag.coordinate)) {
            return failureResult(
                `(Tags::add) Cannot add tag because a tag with the same name and coordinate already exists; ` +
                `name: ${tag.name}, coordinate: ${tag.coordinate.toString()}`
            )
        }
        tagsObject.tags.push(tag)
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
     * @param tag The tag to replace
     * @return The a {@link Result} holding the updated {@link Tags} object or a failure message if the tag could not be replaced.
     * @see add
     * @see addOrReplace
     *
     * @example
     * ```typescript
     * // create a tags object with one tag
     * const tags = Tags.with<string>(newRowTag("existing-tag", "existing-value", RowCoordinate.of(0)));
     *
     * // replace the existing-tag with a new one
     * const result = tags.replace(newRowTag("existing-tag", "new-value", RowCoordinate.of(0)))
     *
     * // there should still only be one tag, and it should have a new-value
     * expect(tags.length()).toBe(1);
     * expect(result.map(tags => tags.hasUniqueTagFor("existing-tag", RowCoordinate.of(0))).getOrThrow()).toBe(true)
     * expect(result.map(tags => tags.filter(tag => tag.name === "existing-tag")).getOrThrow()).toHaveLength(1)
     * expect(result.map(tags => tags.filter(tag => tag.name === "existing-tag")[0].value).getOrThrow()).toBe("new-value")
     * ```
     */
    public replace(tag: Tag<T, C>): Result<Tags<T, C>, string> {
        const tagsObject: Tags<T, C> = this.copy()
        const {name, coordinate} = tag
        if (!this.hasUniqueTagFor(name, coordinate)) {
            return failureResult(
                `(Tags::replace) Cannot replace tag because no unique tag with name and coordinate was found; ` +
                `name: ${name}, coordinate: ${coordinate.toString()}`
            )
        }
        const index = tagsObject.tags.findIndex(tag => tag.name === name && tag.coordinate.equals(coordinate))
        tagsObject.tags[index] = tag
        return successResult(tagsObject)
    }

    /**
     * Adds a new tag with the specified name, value, and coordinate if it doesn't already exist. If the tag
     * already exists, then replaces the tag with a new tag using the specified name, value, and coordinate.
     *
     * This is a convenience function in cases where the more string {@link add} and {@link replace} methods are not
     * necessary.
     * @param tag The tag to add if it doesn't already exist, or to replace if it does exist
     * @return An updated copy of the {@link Tags} object.
     * @see add
     * @see replace
     * @example
     * ```typescript
     * const tags = Tags.empty<string, TagCoordinate>()
     *     .addOrReplace(newRowTag("test-tag-1", "test-value-1", RowCoordinate.of(0)))
     *     .addOrReplace(newRowTag("test-tag-2", "test-value-2", RowCoordinate.of(0)))
     *     .addOrReplace(newRowTag("test-tag-3", "test-value-3", RowCoordinate.of(1)))
     *     .addOrReplace(newRowTag("test-tag-3", "test-value-3", RowCoordinate.of(2)))
     * ```
     */
    public addOrReplace(tag: Tag<T, C>): Tags<T, C> {
        if (this.hasTagFor(tag.name, tag.coordinate)) {
            return this.replace(tag).getOrElse(this.copy())
        }
        return this.add(tag).getOrElse(this.copy())
    }

    /**
     * Removes the tag with the specified ID from the collection of tags.
     * If no tag with the specified ID exists, this method does nothing.
     * @param id The ID of the tag to remove
     * @return A {@link Result} whose success value is a new {@link Tags} object with the
     * tag removed. When the specified ID is not found, then returns a failure.
     * @example
     * ```typescript
     * const tag = newRowTag("removable-tag", "value", RowCoordinate.of(0));
     * const tags = Tags.with<string>(tag);
     *
     * const removeResult = tags.remove(tag.id);
     *
     * expect(removeResult.succeeded).toBe(true);
     * expect(removeResult.map(tags => tags.length()).getOrElse(-1)).toBe(0);
     * ```
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
            `(Tags::remove) Unable to remove tag with specified tag ID because no tag with this ID was found; tag_id: ${id}`
        )
    }

    /**
     * Returns an array of {@link Tag} objects that are associated with a coordinate
     * @param rowIndex The row index
     * @param columnIndex The column index
     * @return An array of {@link Tag} objects that are associated with a coordinate
     * @example
     * ```typescript
     * const tags = Tags.with<string>(
     *     newRowTag("my-row-tag", "nice-row-tag", RowCoordinate.of(0)),
     *     newRowTag("my-row-tag-1", "nice-row-tag-1", RowCoordinate.of(1)),
     *     newColumnTag("my-column-tag", "nice-column-tag", ColumnCoordinate.of(0)),
     *     newCellTag("my-cell-tag", "nice-cell-tag", CellCoordinate.of(0, 4)),
     * )
     * expect(tags.tagsFor(0, 4)).toHaveLength(2) // my-row-tag, my-cell-tag
     * expect(tags.tagsFor(1, 4)).toHaveLength(1) // my-row-tag
     * expect(tags.tagsFor(0, 0)).toHaveLength(2) // my-row-tag, my-column-tag
     * ```
     */
    public tagsFor(rowIndex: number, columnIndex: number): Array<Tag<T, C>> {
        return this.tags.filter(tag => {
            const [c1, c2] = tag.coordinate.coordinate() as [number, number]
            if (tag.coordinate instanceof RowCoordinate && isNaN(c2)) {
                return c1 === rowIndex
            }
            if (tag.coordinate instanceof ColumnCoordinate && isNaN(c1)) {
                return c2 === columnIndex
            }
            if (tag.coordinate instanceof CellCoordinate) {
                return c1 === rowIndex && c2 === columnIndex
            }
            return false
        })
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
            return failureResult(
                `(Tags::uniqueTagFor) No tag with specified name and coordinate found; ` +
                `name: ${name}; coordinate: ${coordinate.toString()}`
            )
        }
        if (tags.length > 1) {
            return failureResult(
                `(Tags::uniqueTagFor) Multiple tags with specified name and coordinate found; ` +
                `name: ${name}; coordinate: ${coordinate.toString()}`
            )
        }
        return successResult(tags[0])
    }
}

/**
 * Class that represents a coordinate for a tag on an entire row. Use the
 * {@link RowCoordinate.of} method to construct a row-coordinate object.
 * @see CellCoordinate
 * @see ColumnCoordinate
 */
export class RowCoordinate implements TagCoordinate {

    private constructor(private readonly row: number) {
    }

    coordinate(): [row: number, column: number] {
        return [this.row, NaN]
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

    coordinate(): [row: number, column: number] {
        return [NaN, this.column]
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

    coordinate(): [row: number, column: number] {
        return [this.row, this.column]
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
