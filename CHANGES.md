# changelog

## 0.5.1

1. Fixed bug in the error output of pushRow which incorrectly used the data-frames column-count instead of the number of elements in the row being pushed.

## 0.5.0

1. Updated the mapping functions (`mapRow`, `mapColumn`, `mapRowInPlace`, and `mapColumnInPlace`) to hand the `mapper` callback the indexes. For example, the `mapRow` function hands the mapper the `columIndex`.
2. Updated the `mapRow` and `mapColumn` functions to allow the resultant data-frame's data-type to be different from the original data-frame's data-type.

## 0.4.0

1. Changed `DataFrame` tagging to return a new modified `DataFrame`, leaving the original `DataFrame` unchanged. Optionally, can have tagging function modify-in-place.
2. Added methods to the `DataFrame` to remove tags.

## 0.3.0

1. Fixed bug where the tags were getting out of sync when a row or column was removed.
2. Added method to retrieve a sub-frame from the data-frame

## 0.2.0

Added method to retrieve sub-frames from data-frame

## 0.1.0

1. Added methods for querying tags
2. Updated the documentation with more text and examples
3. Added examples to the inline documentation

## 0.0.3 initial release
