export type DetectedLocation = { latitude: number; longitude: number; accuracy: number };

export function detectLocation(
  geolocation: Pick<Geolocation, "getCurrentPosition"> | undefined = typeof navigator !== "undefined" ? navigator.geolocation : undefined,
  secure = typeof window === "undefined" || window.isSecureContext !== false,
): Promise<DetectedLocation> {
  if (!secure) return Promise.reject(new Error("Open the app on localhost or a secure connection to detect your location."));
  if (!geolocation) return Promise.reject(new Error("Your browser does not support location detection. Enter coordinates manually."));
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(position => {
      const { latitude, longitude, accuracy } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        reject(new Error("Location could not be determined. Try again or enter coordinates manually."));
        return;
      }
      resolve({ latitude, longitude, accuracy });
    }, error => reject(new Error(error.code === 1
      ? "Location permission was denied. Allow location in your browser settings and try again."
      : error.code === 3
        ? "Location detection timed out. Try again or enter coordinates manually."
        : "Location could not be determined. Try again or enter coordinates manually.")),
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  });
}
