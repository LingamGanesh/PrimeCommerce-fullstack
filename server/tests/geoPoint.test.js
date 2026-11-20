import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGeoPoint } from "../utils/geoPoint.js";

test("normalizes valid GeoJSON coordinates in longitude-latitude order", () => {
  assert.deepEqual(normalizeGeoPoint({ type: "Point", coordinates: [78.4867, 17.385] }), { type: "Point", coordinates: [78.4867, 17.385] });
  assert.equal(normalizeGeoPoint(undefined), undefined);
});

test("rejects malformed and out-of-range GeoJSON coordinates", () => {
  assert.throws(() => normalizeGeoPoint({ type: "Polygon", coordinates: [1, 2] }), /type must be Point/);
  assert.throws(() => normalizeGeoPoint({ type: "Point", coordinates: [1] }), /must be \[longitude, latitude\]/);
  assert.throws(() => normalizeGeoPoint({ type: "Point", coordinates: [181, 10] }), /outside valid/);
  assert.throws(() => normalizeGeoPoint({ type: "Point", coordinates: [10, "north"] }), /outside valid/);
});