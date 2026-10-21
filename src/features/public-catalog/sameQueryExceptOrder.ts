export function sameQueryExceptOrder(previous: unknown, current: unknown) {
  if (!previous || !current || typeof previous !== "object" || typeof current !== "object") return false;
  if (!("order" in previous) || !("order" in current) || previous.order === current.order) return false;
  const comparable = (value: object) => JSON.stringify(
    Object.entries(value).filter(([key]) => key !== "order" && key !== "page").sort(([left], [right]) => left.localeCompare(right)),
  );
  return comparable(previous) === comparable(current);
}
