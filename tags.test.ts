import {
    CellCoordinate,
    CellTag,
    ColumnCoordinate, ColumnTag,
    newCellTag,
    newColumnTag,
    newRowTag,
    newTag,
    RowCoordinate,
    RowTag,
    TagCoordinate,
    Tags
} from './tags'
import {indexFrom} from "./DataFrame";

describe('tags', () => {
    describe('creating tags', () => {
        test('should be able to create an individual tag', () => {
            const tag: RowTag<string> = newTag(RowTag, "mytag", "nicetag", RowCoordinate.of(0))
            expect(tag).toBeDefined()
            expect(tag.id).toBe("tag-mytag-(0,*)")
            expect(tag.name).toBe("mytag")
            expect(tag.value).toBe("nicetag")
            expect(tag.coordinate).toEqual(RowCoordinate.of(0))
            expect(tag.toString()).toBe("mytag:nicetag:(0, *)")
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
            const updatedTags = tags
                .add(newRowTag("my-new-tag", "nice-new-tag", RowCoordinate.of(0)))
                .getOrThrow()
            expect(tags.length()).toBe(3)
            expect(updatedTags.length()).toBe(4)
        })

        test("should remove duplicate tags, overwriting earlier ones with later ones", () => {
            // This test requires creating a situation where multiple tags have the same name and coordinate
            // This shouldn't normally happen with the Tags API, but we can test the error handling

            // Create a Tags object with a manually constructed array containing duplicate tags
            const tag1 = newRowTag<string>("duplicate", "value1", RowCoordinate.of(0))
            const tag2 = newRowTag<string>("duplicate", "value2", RowCoordinate.of(0))
            const tags = Tags.with<string>(tag1, tag2)

            const result = tags.uniqueTagFor("duplicate", RowCoordinate.of(0))

            expect(result.succeeded).toBe(true)
            expect(result.map(tag => tag.value).getOrThrow()).toBe("value2")
        });

    })

    describe('querying tags', () => {
        const tags = Tags.with<string>(
            newRowTag("my-row-tag", "nice-row-tag", RowCoordinate.of(0)),
            newRowTag("my-row-tag-1", "nice-row-tag-1", RowCoordinate.of(1)),
            newColumnTag("my-column-tag", "nice-column-tag", ColumnCoordinate.of(0)),
            newCellTag("my-cell-tag", "nice-cell-tag", CellCoordinate.of(0, 4)),
        )

        test('should be able to retrieve a tag by its ID', () => {
            expect(tags.idForTag("my-row-tag", RowCoordinate.of(0)).getOrThrow()).toBe("tag-my-row-tag-(0,*)")
        })

        test('should return a failure result when retrieving a tag by ID that does not exist', () => {
            expect(tags.idForTag("non-existent-tag", RowCoordinate.of(0)).failed).toBe(true)
        })

        test('should be able to retrieve all the row-tags using a predicate', () => {
            const rowTags = tags.filter(tag => tag.coordinate instanceof RowCoordinate)
            expect(rowTags.length).toBe(2)
            expect(rowTags[0].name).toBe("my-row-tag")
            expect(rowTags[1].name).toBe("my-row-tag-1")
        })

        test('should be able to retrieve all tags that end with a number', () => {
            const rowTags = tags.filter(tag => /[0-9]+$/.test(tag.name))
            expect(rowTags.length).toBe(1)
            expect(rowTags[0].name).toBe("my-row-tag-1")
        })

        test("should be able to retrieve all tags for a coordinate", () => {
            expect(tags.tagsFor(0, 4)).toHaveLength(2) // my-row-tag, my-cell-tag
            expect(tags.tagsFor(1, 4)).toHaveLength(1) // my-row-tag
            expect(tags.tagsFor(0, 0)).toHaveLength(2) // my-row-tag, my-column-tag
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
                const tag = newTag(CellTag, "headers-name", "header-value", CellCoordinate.of(3, 14))
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
            test("should be able to add tags to an empty Tags collection with add", () => {
                const emptyTags = Tags.empty<string, TagCoordinate>()
                const updatedTags = emptyTags
                    .add(newRowTag("test-tag-1", "test-value-1", RowCoordinate.of(0)))
                    .flatMap(tags => tags.add(newRowTag("test-tag-2", "test-value-2", RowCoordinate.of(0))))
                    .flatMap(tags => tags.add(newRowTag("test-tag-3", "test-value-3", RowCoordinate.of(1))))
                    .flatMap(tags => tags.add(newRowTag("test-tag-3", "test-value-3", RowCoordinate.of(2))))
                    .getOrThrow()

                expect(emptyTags.length()).toBe(0)
                expect(updatedTags.length()).toBe(4)
                expect(updatedTags.hasTagFor("test-tag-1", RowCoordinate.of(0))).toBe(true)
                expect(updatedTags.hasTagFor("test-tag-2", RowCoordinate.of(0))).toBe(true)
                expect(updatedTags.hasTagFor("test-tag-3", RowCoordinate.of(1))).toBe(true)
                expect(updatedTags.hasTagFor("test-tag-3", RowCoordinate.of(2))).toBe(true)
            });

            test("should be able to add tags to an empty Tags collection with addOrReplace", () => {
                const emptyTags = Tags.empty<string, TagCoordinate>()
                const updatedTags = emptyTags
                    .addOrReplace(newRowTag("test-tag-1", "test-value-1", RowCoordinate.of(0)))
                    .addOrReplace(newRowTag("test-tag-2", "test-value-2", RowCoordinate.of(0)))
                    .addOrReplace(newRowTag("test-tag-3", "test-value-3", RowCoordinate.of(1)))
                    .addOrReplace(newRowTag("test-tag-3", "test-value-3", RowCoordinate.of(2)))

                expect(emptyTags.length()).toBe(0)
                expect(updatedTags.length()).toBe(4)
                expect(updatedTags.hasTagFor("test-tag-1", RowCoordinate.of(0))).toBe(true)
                expect(updatedTags.hasTagFor("test-tag-2", RowCoordinate.of(0))).toBe(true)
                expect(updatedTags.hasTagFor("test-tag-3", RowCoordinate.of(1))).toBe(true)
                expect(updatedTags.hasTagFor("test-tag-3", RowCoordinate.of(2))).toBe(true)
            });

            test("should not add duplicate tag with same name and coordinate", () => {
                const tags = Tags.with<string>(
                    newRowTag("existing-tag", "existing-value", RowCoordinate.of(0))
                );

                const added = tags.add(newRowTag("existing-tag", "new-value", RowCoordinate.of(0)))
                expect(added.failed).toBe(true);
                expect(tags.length()).toBe(1);
            });

            test("should replace an existing tag with same name and coordinate", () => {
                const tags = Tags.with<string>(
                    newRowTag("existing-tag", "existing-value", RowCoordinate.of(0))
                );

                const result = tags.replace(newRowTag("existing-tag", "new-value", RowCoordinate.of(0)))
                expect(result.map(tags => tags.hasUniqueTagFor("existing-tag", RowCoordinate.of(0))).getOrThrow())
                    .toBe(true)
                expect(result.map(tags => tags.filter(tag => tag.name === "existing-tag")).getOrThrow())
                    .toHaveLength(1)
                expect(result.map(tags => tags.filter(tag => tag.name === "existing-tag")[0].value).getOrThrow())
                    .toBe("new-value")
                expect(tags.length()).toBe(1);
            });

            test("should add tag when it doesn't already exist when using addOrReplace", () => {
                // add a set of new tags
                const tags = Tags.empty<string, TagCoordinate>()
                    .addOrReplace(newRowTag("test-tag-1", "test-value-1", RowCoordinate.of(0)))
                    .addOrReplace(newRowTag("test-tag-2", "test-value-2", RowCoordinate.of(0)))
                    .addOrReplace(newRowTag("test-tag-3", "test-value-3", RowCoordinate.of(1)))
                    .addOrReplace(newRowTag("test-tag-3", "test-value-3", RowCoordinate.of(2)))

                expect(tags.length()).toBe(4)
                expect(tags.uniqueTagFor("test-tag-1", RowCoordinate.of(0)).map(tag => tag.value).getOrThrow())
                    .toBe("test-value-1")
                expect(tags.uniqueTagFor("test-tag-2", RowCoordinate.of(0)).map(tag => tag.value).getOrThrow())
                    .toBe("test-value-2")
                expect(tags.uniqueTagFor("test-tag-3", RowCoordinate.of(1)).map(tag => tag.value).getOrThrow())
                    .toBe("test-value-3")
                expect(tags.uniqueTagFor("test-tag-3", RowCoordinate.of(2)).map(tag => tag.value).getOrThrow())
                    .toBe("test-value-3")

                // replace each of the tags
                const updated = tags
                    .addOrReplace(newRowTag("test-tag-1", "test-value-11", RowCoordinate.of(0)))
                    .addOrReplace(newRowTag("test-tag-2", "test-value-21", RowCoordinate.of(0)))
                    .addOrReplace(newRowTag("test-tag-3", "test-value-31", RowCoordinate.of(1)))
                    .addOrReplace(newRowTag("test-tag-3", "test-value-32", RowCoordinate.of(2)))

                expect(updated.length()).toBe(4)
                expect(tags.length()).toBe(4)
                expect(updated.uniqueTagFor("test-tag-1", RowCoordinate.of(0)).map(tag => tag.value).getOrThrow())
                    .toBe("test-value-11")
                expect(updated.uniqueTagFor("test-tag-2", RowCoordinate.of(0)).map(tag => tag.value).getOrThrow())
                    .toBe("test-value-21")
                expect(updated.uniqueTagFor("test-tag-3", RowCoordinate.of(1)).map(tag => tag.value).getOrThrow())
                    .toBe("test-value-31")
                expect(updated.uniqueTagFor("test-tag-3", RowCoordinate.of(2)).map(tag => tag.value).getOrThrow())
                    .toBe("test-value-32")

            })

            test("should be able to remove a tag by ID", () => {
                const tag = newRowTag("removable-tag", "value", RowCoordinate.of(0));
                const tags = Tags.with<string>(tag);

                const removeResult = tags.remove(tag.id);

                expect(removeResult.succeeded).toBe(true);
                expect(removeResult.map(tags => tags.length()).getOrElse(-1)).toBe(0);
            });

            test("should return failure when removing non-existent tag ID", () => {
                const tags = Tags.with<string>(
                    newRowTag("existing-tag", "value", RowCoordinate.of(0))
                );

                const removeResult = tags.remove("non-existent-id");

                expect(removeResult.failed).toBe(true);
                expect(removeResult.failureOrUndefined()).toContain("Unable to remove tag with specified tag ID because no tag with this ID was found; tag_id: non-existent-id");
            });

            test("should be able to transpose the tags", () => {
                const tags = Tags
                    .with<string>(
                        newRowTag("row-tag", "value", RowCoordinate.of(0)),
                        newColumnTag("column-tag", "value", ColumnCoordinate.of(1)),
                        newCellTag("cell-tag", "value", CellCoordinate.of(3, 2))
                    )
                    .transpose()
                expect(tags.length()).toBe(3)
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(2, 3))).toBeTruthy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(3, 2))).toBeFalsy()

                expect(tags.hasTagFor("row-tag", ColumnCoordinate.of(0))).toBeTruthy()
                expect(tags.hasTagFor("row-tag", RowCoordinate.of(0))).toBeFalsy()

                expect(tags.hasTagFor("column-tag", RowCoordinate.of(1))).toBeTruthy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(1))).toBeFalsy()
            })

            test("should be able to subset tags", () => {
                const tags = Tags
                    .with<string>(
                        newRowTag("row-tag", "value", RowCoordinate.of(0)),
                        newColumnTag("column-tag", "value", ColumnCoordinate.of(1)),
                        newCellTag("cell-tag", "value", CellCoordinate.of(3, 2))
                    )
                    .subset(indexFrom(1, 1), indexFrom(2, 2))
                expect(tags.length()).toBe(1)
                expect(tags.hasTagFor("row-tag", RowCoordinate.of(0))).toBeFalsy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(0))).toBeTruthy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(1))).toBeFalsy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(2, 1))).toBeFalsy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(3, 2))).toBeFalsy()
            })

            test("should be able to update tags for a removed row at the beginning", () => {
                const tags = Tags
                    .with<string>(
                        newRowTag("row-tag", "value", RowCoordinate.of(0)),
                        newColumnTag("column-tag", "value", ColumnCoordinate.of(1)),
                        newCellTag("cell-tag", "value", CellCoordinate.of(3, 2))
                    )
                    .removeRow(0)
                expect(tags.length()).toBe(2)
                expect(tags.hasTagFor("row-tag", RowCoordinate.of(0))).toBeFalsy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(1))).toBeTruthy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(2, 2))).toBeTruthy()
            })

            test("should be able to update tags for a removed row in middle", () => {
                const tags = Tags
                    .with<string>(
                        newRowTag("row-tag", "value", RowCoordinate.of(0)),
                        newColumnTag("column-tag", "value", ColumnCoordinate.of(1)),
                        newCellTag("cell-tag", "value", CellCoordinate.of(3, 2))
                    )
                    .removeRow(1)
                expect(tags.length()).toBe(3)
                expect(tags.hasTagFor("row-tag", RowCoordinate.of(0))).toBeTruthy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(1))).toBeTruthy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(2, 2))).toBeTruthy()
            })

            test("should be able to update tags for a removed row from end", () => {
                const tags = Tags
                    .with<string>(
                        newRowTag("row-tag", "value", RowCoordinate.of(0)),
                        newColumnTag("column-tag", "value", ColumnCoordinate.of(1)),
                        newCellTag("cell-tag", "value", CellCoordinate.of(3, 2))
                    )
                    .removeRow(3)
                expect(tags.length()).toBe(2)
                expect(tags.hasTagFor("row-tag", RowCoordinate.of(0))).toBeTruthy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(1))).toBeTruthy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(2, 2))).toBeFalsy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(3, 2))).toBeFalsy()
            })

            test("should be able to update tags for a removed column at the beginning", () => {
                const tags = Tags
                    .with<string>(
                        newRowTag("row-tag", "value", RowCoordinate.of(0)),
                        newColumnTag("column-tag", "value", ColumnCoordinate.of(1)),
                        newCellTag("cell-tag", "value", CellCoordinate.of(3, 2))
                    )
                    .removeColumn(0)
                expect(tags.length()).toBe(3)
                expect(tags.hasTagFor("row-tag", RowCoordinate.of(0))).toBeTruthy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(0))).toBeTruthy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(3, 1))).toBeTruthy()
            })

            test("should be able to update tags for a removed column in the middle", () => {
                const tags = Tags
                    .with<string>(
                        newRowTag("row-tag", "value", RowCoordinate.of(0)),
                        newColumnTag("column-tag", "value", ColumnCoordinate.of(1)),
                        newCellTag("cell-tag", "value", CellCoordinate.of(3, 2))
                    )
                    .removeColumn(1)
                expect(tags.length()).toBe(2)
                expect(tags.hasTagFor("row-tag", RowCoordinate.of(0))).toBeTruthy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(0))).toBeFalsy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(1))).toBeFalsy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(3, 1))).toBeTruthy()
            })

            test("should be able to update tags for a removed column at the end", () => {
                const tags = Tags
                    .with<string>(
                        newRowTag("row-tag", "value", RowCoordinate.of(0)),
                        newColumnTag("column-tag", "value", ColumnCoordinate.of(1)),
                        newCellTag("cell-tag", "value", CellCoordinate.of(3, 2))
                    )
                    .removeColumn(2)
                expect(tags.length()).toBe(2)
                expect(tags.hasTagFor("row-tag", RowCoordinate.of(0))).toBeTruthy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(0))).toBeFalsy()
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(1))).toBeTruthy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(3, 1))).toBeFalsy()
                expect(tags.hasTagFor("cell-tag", CellCoordinate.of(3, 2))).toBeFalsy()
            })

            test("should correctly identify if a tag exists with hasTagFor", () => {
                const tags = Tags.with<string>(
                    newRowTag("row-tag", "value", RowCoordinate.of(0)),
                    newColumnTag("column-tag", "value", ColumnCoordinate.of(1))
                );

                expect(tags.hasTagFor("row-tag", RowCoordinate.of(0))).toBe(true);
                expect(tags.hasTagFor("column-tag", ColumnCoordinate.of(1))).toBe(true);
                expect(tags.hasTagFor("non-existent", RowCoordinate.of(0))).toBe(false);
                expect(tags.hasTagFor("row-tag", RowCoordinate.of(1))).toBe(false);
            });

            test("should correctly identify unique tags with hasUniqueTagFor", () => {
                // Create a tags collection with two tags having the same name but different coordinates
                const tags = Tags.with<string>(
                    newRowTag("duplicate-name", "value1", RowCoordinate.of(0)),
                    newRowTag("duplicate-name", "value2", RowCoordinate.of(1)),
                    newRowTag("unique-name", "value", RowCoordinate.of(2))
                );

                // Should be true for unique tag
                expect(tags.hasUniqueTagFor("unique-name", RowCoordinate.of(2))).toBe(true);

                // Should be true for each duplicate tag (as they have different coordinates)
                expect(tags.hasUniqueTagFor("duplicate-name", RowCoordinate.of(0))).toBe(true);
                expect(tags.hasUniqueTagFor("duplicate-name", RowCoordinate.of(1))).toBe(true);

                // Should be false for non-existent tag
                expect(tags.hasUniqueTagFor("non-existent", RowCoordinate.of(0))).toBe(false);
            });

            test("should correctly identify if a tag with a specific name exists", () => {
                const tags = Tags.with<string>(
                    newRowTag("existing-name", "value", RowCoordinate.of(0))
                );

                expect(tags.hasTagWithName("existing-name")).toBe(true);
                expect(tags.hasTagWithName("non-existent-name")).toBe(false);
            });

            test("should return all tags for a specific coordinate", () => {
                const coordinate = RowCoordinate.of(0);
                const tags = Tags.with<string>(
                    newRowTag("tag1", "value1", coordinate),
                    newRowTag("tag2", "value2", coordinate),
                    newRowTag("tag3", "value3", RowCoordinate.of(1))
                );

                const tagsForCoord = tags.tagsForCoordinate(coordinate);

                expect(tagsForCoord.length).toBe(2);
                expect(tagsForCoord[0].name).toBe("tag1");
                expect(tagsForCoord[1].name).toBe("tag2");
            });

            test("should find unique tag with uniqueTagFor", () => {
                const tags = Tags.with<string>(
                    newRowTag("unique-tag", "value", RowCoordinate.of(0))
                );

                const result = tags.uniqueTagFor("unique-tag", RowCoordinate.of(0))

                expect(result.succeeded).toBe(true)
                expect(result.map(tag => tag.name).getOrThrow()).toBe("unique-tag")
                expect(result.map(tag => tag.value).getOrThrow()).toBe("value")
            });

            test("should return failure when no tag found with uniqueTagFor", () => {
                const tags = Tags.empty<string, TagCoordinate>();

                const result = tags.uniqueTagFor("non-existent", RowCoordinate.of(0));

                expect(result.failed).toBe(true);
                expect(result.failureOrUndefined())
                    .toBe("(Tags::uniqueTagFor) No tag with specified name and coordinate found; name: non-existent; coordinate: (0, *)");
            });
        })
    })
})
