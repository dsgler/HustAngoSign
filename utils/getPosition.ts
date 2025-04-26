export function getPosition(body: string): {
  latitude: string;
  longitude: string;
  locationText: string;
} {
  try {
    const LaRe = /locationLatitude.+?([0-9.]+).+?/;
    const latitude = body.match(LaRe)![1];
    const LoRe = /locationLongitude.+?([0-9.]+).+?/;
    const longitude = body.match(LoRe)![1];
    const locationTextRe = /locationText.+?'(.+)'/;
    const locationText = body.match(locationTextRe)?.[1] ?? '';
    return { latitude, longitude, locationText };
  } catch {
    throw Error('未找到 latitude 和 longitude\nbody:' + body);
  }
}
