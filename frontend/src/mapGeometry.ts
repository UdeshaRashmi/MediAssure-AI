const radians = (degrees: number) => degrees * Math.PI / 180;
const mercator = (latitude: number) => Math.log(Math.tan(Math.PI / 4 + radians(latitude) / 2));
const north = mercator(10.15), south = mercator(5.65);
const scale = 620 / (north - south);
export function projectLocation(longitude: number, latitude: number): [number, number] {
  return [270 + radians(longitude - 80.75) * scale, 50 + (north - mercator(latitude)) * scale];
}
export function isInMap(latitude: number | null, longitude: number | null): boolean {
  return latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= 5.65 && latitude <= 10.15 && longitude >= 79.3 && longitude <= 82.2;
}
export function polygonPath(polygons: number[][][][]): string {
  return polygons.flatMap(polygon => polygon.map(ring => ring.map(([longitude, latitude], index) => {
    const [x, y] = projectLocation(longitude, latitude);
    return `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ") + " Z")).join(" ");
}
