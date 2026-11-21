export function buildPublicProductFilter({ activeCategoryIds = [], activeSubCategoryIds = [], categoryId, search, featured } = {}) {
  const filter = {
    publish: true,
    isActive: { $ne: false },
    categoryId: { $in: activeCategoryIds },
    sub_categoryId: { $in: activeSubCategoryIds }
  };
  if (categoryId) filter.categoryId = { $in: activeCategoryIds, $eq: categoryId };
  if (featured === "true") filter.discount = { $gt: 0 };
  if (typeof search === "string" && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.name = { $regex: escaped, $options: "i" };
  }
  return filter;
}

export function buildPublicSubCategoryFilter({ activeCategoryIds = [], categoryId } = {}) {
  const filter = { isActive: { $ne: false }, categoryId: { $in: activeCategoryIds } };
  if (categoryId) filter.categoryId = { $in: activeCategoryIds, $eq: categoryId };
  return filter;
}