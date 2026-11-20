import test from "node:test";
import assert from "node:assert/strict";
import AddressModel from "../models/address.model.js";

test("address indexes are explicitly managed by the data migration", () => {
  assert.equal(AddressModel.schema.options.autoIndex, false);
  const indexes = AddressModel.schema.indexes();
  assert.ok(indexes.some(([keys]) => keys.geo === "2dsphere"));
  assert.ok(indexes.some(([keys, options]) => keys.userId === 1 && options.unique === true && options.partialFilterExpression?.isDefault === true));
});

test("address geo is an optional single GeoJSON Point subdocument", () => {
  const geoPath = AddressModel.schema.path("geo");
  assert.ok(geoPath);
  assert.equal(geoPath.options.default, undefined);
});