/**
 * Calculate distance between two GPS coordinates in meters using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Get current browser GPS location with high accuracy
 */
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('متصفحك لا يدعم تحديد الموقع الجغرافي (Geolocation).'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let msg = 'تعذر الوصول إلى الموقع الجغرافي.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'تم رفض الإذن للوصول إلى الموقع الجغرافي. يرجى تفعيل إذن الموقع لتسجيل الحضور.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'الموقع الجغرافي غير متوفر حاليًا.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'انتهت مهلة الحصول على الموقع الجغرافي.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      }
    );
  });
}
