// a free layout on a grid of `columns` columns and rows of a fixed height: each box at its column x and row y
// (from 0), w columns wide and h rows high. The boxes fall up as far as they can (no hole above a box), none
// overlapping.
export const columns = 12

export interface Box {
  id: string
  x: number
  y: number
  w: number
  h: number
}

export const overlaps = (a: Box, b: Box): boolean =>
  a.id !== b.id && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const overlapsAny = (box: Box, others: Box[]): boolean => others.some(o => overlaps(box, o))

// the first row below all the boxes
export const bottom = (boxes: Box[]): number => boxes.reduce((max, b) => Math.max(max, b.y + b.h), 0)

const readingOrder = (a: Box, b: Box) => a.y - b.y || a.x - b.x

// in place: each box, in reading order, goes up as far as it can, then down until it overlaps none of the
// ones already placed. Returns the boxes in reading order.
export const compact = (boxes: Box[]): Box[] => {
  const placed: Box[] = []
  for (const box of [...boxes].sort(readingOrder)) {
    box.x = Math.min(Math.max(box.x, 0), columns - box.w)
    box.y = Math.max(box.y, 0)
    while (box.y > 0 && !overlapsAny({ ...box, y: box.y - 1 }, placed)) {
      box.y--
    }
    while (overlapsAny(box, placed)) {
      box.y++
    }
    placed.push(box)
  }
  return placed
}

// in place: the box goes down to row y, the ones it then overlaps going down below it, and so on
const pushDown = (boxes: Box[], box: Box, y: number) => {
  box.y = y
  for (const other of boxes.filter(o => overlaps(box, o)).sort(readingOrder).reverse()) {
    pushDown(boxes, other, box.y + box.h)
  }
}

// in place: the box with this id put at x, y (and resized to w, h when given), then the layout compacted. The
// boxes in the way go above it when there is room (they swap places), else below it.
export const place = (
  boxes: Box[],
  id: string,
  to: { x?: number, y?: number, w?: number, h?: number },
): Box[] => {
  const box = boxes.find(b => b.id === id)
  if (!box) {
    return compact(boxes)
  }
  box.w = Math.min(Math.max(to.w ?? box.w, 1), columns)
  box.h = Math.max(to.h ?? box.h, 1)
  box.x = Math.min(Math.max(to.x ?? box.x, 0), columns - box.w)
  box.y = Math.max(to.y ?? box.y, 0)
  const others = boxes.filter(b => b !== box)
  // the lowest first: pushed down, it makes room for the ones above it, which keep their order
  for (const other of others.filter(o => overlaps(box, o)).sort(readingOrder).reverse()) {
    if (!overlaps(box, other)) {
      continue // moved away by one before it
    }
    const above = { ...other, y: box.y - other.h }
    if (above.y >= 0 && !overlapsAny(above, boxes.filter(b => b !== other))) {
      other.y = above.y
    } else {
      // pushing down the others, not the box being placed: it stays where it was put
      pushDown(others, other, box.y + box.h)
    }
  }
  return compact(boxes)
}

// the boxes laid out one after the other, left to right then on the next row: for a layout that had only an
// order
export const flow = (boxes: Box[]): Box[] => {
  let x = 0
  let y = 0
  let rowHeight = 0
  for (const box of boxes) {
    box.w = Math.min(Math.max(box.w, 1), columns)
    if (x + box.w > columns) {
      x = 0
      y += rowHeight
      rowHeight = 0
    }
    box.x = x
    box.y = y
    x += box.w
    rowHeight = Math.max(rowHeight, box.h)
  }
  return boxes
}
