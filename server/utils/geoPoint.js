export function normalizeGeoPoint(value) {
  if (value === undefined || value === null) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Location must be a GeoJSON Point");
  if (value.type !== undefined && value.type !== "Point") throw new TypeError("Location type must be Point");
  const coordinates = value.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) throw new TypeError("Location coordinates must be [longitude, latitude]");
  const [longitude, latitude] = coordinates.map(Number);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new TypeError("Location coordinates are outside valid longitude/latitude ranges");
  }
  return { type: "Point", coordinates: [longitude, latitude] };
}