import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicProductFilter, buildPublicSubCategoryFilter } from "../utils/catalogVisibility.js";

test("public product filter excludes unpublished and explicitly inactive products", () => {
  const filter = buildPublicProductFilter({ activeCategoryIds: ["cat-1"], activeSubCategoryIds: ["sub-1"] });
  assert.equal(filter.publish, true);
  assert.deepEqual(filter.isActive, { $ne: false });
  assert.deepEqual(filter.categoryId, { $in: ["cat-1"] });
  assert.deepEqual(filter.sub_categoryId, { $in: ["sub-1"] });
});

test("public product filters preserve search escaping, featured and selected active category", () => {
  const filter = buildPublicProductFilter({ activeCategoryIds: ["cat-1", "cat-2"], activeSubCategoryIds: ["sub-1"], categoryId: "cat-2", search: "milk (fresh)", featured: "true" });
  assert.deepEqual(filter.categoryId, { $in: ["cat-1", "cat-2"], $eq: "cat-2" });
  assert.deepEqual(filter.discount, { $gt: 0 });
  assert.equal(filter.name.$regex, "milk \\(fresh\\)");
  assert.equal(filter.name.$options, "i");
});

test("public subcategories require an active parent category and active subcategory", () => {
  assert.deepEqual(buildPublicSubCategoryFilter({ activeCategoryIds: ["cat-1"], categoryId: "cat-1" }), { isActive: { $ne: false }, categoryId: { $in: ["cat-1"], $eq: "cat-1" } });
});