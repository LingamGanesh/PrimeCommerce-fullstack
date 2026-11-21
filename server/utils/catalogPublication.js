export function normalizeProductPublication(value = true) {
  if (typeof value !== "boolean") {
    throw new TypeError("Publish must be true or false");
  }

  return {
    publish: value,
    isActive: value
  };
}
