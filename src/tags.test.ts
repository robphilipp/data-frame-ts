import {
    CellCoordinate,
    ColumnCoordinate,
    newCellTag,
    newColumnTag,
    newRowTag,
    newTag,
    RowCoordinate,
    TagCoordinate, Tags
} from './tags'

describe('tags', () => {
    describe('creating tags', () => {
        test('should be able to create an individual tag', () => {
            const tag = newTag<string, RowCoordinate>("mytag", "nicetag", RowCoordinate.of(0))
            expect(tag).toBeDefined()
            expect(tag.id).toBe("tag-mytag-(0,*)")
            expect(tag.name).toBe("mytag")
            expect(tag.value).toBe("nicetag")
            expect(tag.coordinate).toEqual(RowCoordinate.of(0))
            expect(tag.toString()).toBe("mytag:nicetag:(0,*)")
        })

        test('should be able to create tags with varying coordinate types', () => {
            const tags = Tags.with<string>(
                newRowTag("my-row-tag", "nice-row-tag", RowCoordinate.of(0)),
                newColumnTag("my-column-tag", "nice-column-tag", ColumnCoordinate.of(0)),
                newCellTag("my-cell-tag", "nice-cell-tag", CellCoordinate.of(0, 0))
            )
            expect(tags.length()).toBe(3)
        })

        test('adding a tag to a tags collection should not change the original tags collection', () => {
            const tags = Tags.with<string>(
                newRowTag("my-row-tag", "nice-row-tag", RowCoordinate.of(0)),
                newColumnTag("my-column-tag", "nice-column-tag", ColumnCoordinate.of(0)),
                newCellTag("my-cell-tag", "nice-cell-tag", CellCoordinate.of(0, 0))
            )
            const updatedTags = tags.add("my-new-tag", "nice-new-tag", RowCoordinate.of(0))
            expect(tags.length()).toBe(3)
            expect(updatedTags.length()).toBe(4)
        })
    })

    describe('querying tags', () => {
        const tags = Tags.with<string>(
            newRowTag("my-row-tag", "nice-row-tag", RowCoordinate.of(0)),
            newRowTag("my-row-tag-1", "nice-row-tag-1", RowCoordinate.of(1)),
            newColumnTag("my-column-tag", "nice-column-tag", ColumnCoordinate.of(0)),
            newCellTag("my-cell-tag", "nice-cell-tag", CellCoordinate.of(0, 0)),
        )
        test('should be able to retrieve all the row-tags', () => {
            const rowTags = tags.filter(tag => tag.coordinate instanceof RowCoordinate)
            expect(rowTags.length).toBe(2)
            expect(rowTags[0].name).toBe("my-row-tag")
            expect(rowTags[1].name).toBe("my-row-tag-1")
        })
    })


    describe("Testing tag classes", () => {
        describe("Testing factory methods for creating tags of various types", () => {
            test("should be able to create a new row tag", () => {
                const tag = newRowTag<string>("headers-name", "header-value", RowCoordinate.of(3))
                expect(tag.id).toEqual(`tag-headers-name-(3,*)`)
                expect(tag.name).toEqual("headers-name")
                expect(tag.value).toEqual("header-value")
            })

            test("should be able to create a new column tag", () => {
                const tag = newColumnTag<string>("headers-name", "header-value", ColumnCoordinate.of(3))
                expect(tag.id).toEqual(`tag-headers-name-(*,3)`)
                expect(tag.name).toEqual("headers-name")
                expect(tag.value).toEqual("header-value")
            })

            test("should be able to create a new cell tag", () => {
                const tag = newTag<string, CellCoordinate>("headers-name", "header-value", CellCoordinate.of(3, 14))
                expect(tag.id).toEqual(`tag-headers-name-(3,14)`)
                expect(tag.name).toEqual("headers-name")
                expect(tag.value).toEqual("header-value")
            })

            test("should be able to create a new cell tag", () => {
                const tag = newCellTag<string>("headers-name", "header-value", CellCoordinate.of(3, 14))
                expect(tag.id).toEqual(`tag-headers-name-(3,14)`)
                expect(tag.name).toEqual("headers-name")
                expect(tag.value).toEqual("header-value")
            })
        })

        describe("Testing adding tags to the Tags object", () => {

        })
    })
})