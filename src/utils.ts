/* eslint-disable sort-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable max-params */
export const len2 = (x0: number, y0: number, x1: number, y1: number): number => {
  return (x0 - x1) ** 2 + (y0 - y1) ** 2
}

export const projToLine = (x: number, y: number, ax: number, ay: number, bx: number, by: number): [number, number] => {
  const t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2(ax, ay, bx, by)

  return [
    ax + t * (bx - ax),
    ay + t * (by - ay),
  ]
}

// const cross = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => {
//   return (x - ax) * (by - ay) - (bx - ax) * (y - ay)
// }

// const isPointOnLine = (x: number, y: number, ax: number, ay: number, bx: number, by: number): boolean => {
//   return cross(x, y, ax, ay, bx, by) === 0
// }

// const isPointInsideSegment = (x: number, y: number, ax: number, ay: number, bx: number, by: number): boolean => {
//   return cross(x, y, ax, ay, bx, by) < 0
// }

// const projToSegment = (x: number, y: number, ax: number, ay: number, bx: number, by: number): Point => {
//   // Subtract (b - a) and (p - a), to base 2 vectors on (a) point
//   // Calc dot-product
//   // Divide result by (b - a) length to get projected (p - a) length
//   let t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2(ax, ay, bx, by)

//   // Clamp to segment bounds
//   t = Math.max(0, Math.min(1, t))

//   // Contruct projected point
//   return [
//     ax + t * (bx - ax),
//     ay + t * (by - ay),
//   ]
// }

export const distToSegment2 = (x: number, y: number, ax: number, ay: number, bx: number, by: number): number => {
  let t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len2(ax, ay, bx, by)

  t = Math.max(0, Math.min(1, t))

  return len2(x, y, ax + t * (bx - ax), ay + t * (by - ay))
}

export const isIntersecting = (a0x: number, a0y: number, a1x: number, a1y: number, b0x: number, b0y: number, b1x: number, b1y: number): boolean => {
  const v0x = a1x - a0x
  const v0y = a1y - a0y
  const v1x = b1x - b0x
  const v1y = b1y - b0y
  const cross = v0x * v1y - v1x * v0y

  if (cross === 0) {
    return false
  } // collinear

  const s02_x = a0x - b0x
  const s02_y = a0y - b0y
  const s_numer = v0x * s02_y - v0y * s02_x

  if (s_numer < 0 === cross > 0) {
    return false
  } // no collision

  const t_numer = v1x * s02_y - v1y * s02_x

  if (t_numer < 0 === cross > 0) {
    return false
  } // no collision

  if (s_numer > cross === cross > 0 || t_numer > cross === cross > 0) {
    return false
  } // no collision

  return true
}

export const isPointInSegmentABBB = (x: number, y: number, x0: number, y0: number, x1: number, y1: number): boolean => {
  if (x0 > x1) {
    const t = x0

    x0 = x1
    x1 = t
  }

  if (y0 > y1) {
    const t = y0

    y0 = y1
    y1 = t
  }

  return x0 < x && x < x1 && y0 < y && y < y1
}

export const splice = (array: number[], beginIndex: number, numRemove: number, addValues?: number[]) => {
  if (beginIndex >= array.length) {
    throw new Error(`Cannot splice: beginIndex:${beginIndex} >= array.length:${array.length}`)
  }

  if (numRemove < 0) {
    throw new Error(`Cannot splice: numRemove:${numRemove} < 0`)
  }

  const numAdd = addValues != null ? addValues.length : 0

  if (numRemove > numAdd) {
    for (let i = beginIndex; i < array.length; i++) {
      array[i + numAdd] = array[i + numRemove]
    }

    array.length += numAdd - numRemove
  } else {
    const oldLength = array.length

    // Expand array
    array.length += numAdd - numRemove

    for (let i = oldLength - 1; i >= beginIndex; i--) {
      array[i + numAdd] = array[i + numRemove]
    }
  }

  if (addValues != null) {
    for (let i = 0; i < addValues.length; i++) {
      array[i + beginIndex] = addValues[i]
    }
  }
}
