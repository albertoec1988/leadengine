// lib/gallery.test.ts
import { describe, it, expect } from "vitest"
import {
  reorder,
  computePrimaryAfterSet,
  computePrimaryAfterDelete,
  primaryUrlOrPlaceholder,
  PLACEHOLDER_PHOTO,
} from "@/lib/gallery"

describe("gallery", () => {
  it("reorder assigns sequential order by array index", () => {
    expect(reorder(["c", "a", "b"])).toEqual([
      { id: "c", order: 0 },
      { id: "a", order: 1 },
      { id: "b", order: 2 },
    ])
  })

  it("computePrimaryAfterSet marks exactly one primary", () => {
    const imgs = [
      { id: "1", order: 0, isPrimary: true },
      { id: "2", order: 1, isPrimary: false },
    ]
    const out = computePrimaryAfterSet(imgs, "2")
    expect(out.filter((i) => i.isPrimary).map((i) => i.id)).toEqual(["2"])
  })

  it("computePrimaryAfterDelete reassigns primary to first when the primary is removed", () => {
    const imgs = [
      { id: "1", order: 0, isPrimary: true },
      { id: "2", order: 1, isPrimary: false },
      { id: "3", order: 2, isPrimary: false },
    ]
    const { remaining, newPrimaryId } = computePrimaryAfterDelete(imgs, "1")
    expect(remaining.map((i) => i.id)).toEqual(["2", "3"])
    expect(remaining.map((i) => i.order)).toEqual([0, 1])
    expect(newPrimaryId).toBe("2")
    expect(remaining.find((i) => i.id === "2")?.isPrimary).toBe(true)
  })

  it("computePrimaryAfterDelete keeps existing primary when a non-primary is removed", () => {
    const imgs = [
      { id: "1", order: 0, isPrimary: true },
      { id: "2", order: 1, isPrimary: false },
    ]
    const { newPrimaryId } = computePrimaryAfterDelete(imgs, "2")
    expect(newPrimaryId).toBe("1")
  })

  it("computePrimaryAfterDelete returns null primary when list becomes empty", () => {
    const imgs = [{ id: "1", order: 0, isPrimary: true }]
    expect(computePrimaryAfterDelete(imgs, "1").newPrimaryId).toBeNull()
  })

  it("primaryUrlOrPlaceholder falls back to placeholder when no images", () => {
    expect(primaryUrlOrPlaceholder([])).toBe(PLACEHOLDER_PHOTO)
    expect(
      primaryUrlOrPlaceholder([{ url: "u2", isPrimary: true }, { url: "u1", isPrimary: false }]),
    ).toBe("u2")
  })
})
