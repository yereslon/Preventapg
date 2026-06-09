export function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul((h << 5) + h, 1) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return h >>> 0;
}
