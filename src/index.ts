
type Pt = { x: number, y: number }

const getLineLengthSq = (p0: Pt, p1: Pt): number => {
  const a = p0.x - p1.x
  const b = p0.y - p1.y

  return Math.sqrt(a * a + b * b)
}
