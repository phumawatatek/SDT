/** Bỏ dấu tiếng Việt, chữ thường — dùng cho tìm kiếm không dấu. */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

/** Nhiều từ, thứ tự bất kỳ, không cần dấu (PHASE1_SPEC §13). */
export function matchesQuery(haystack: string[], query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = fold(haystack.join(" "));
  return words.every((w) => text.includes(w));
}
