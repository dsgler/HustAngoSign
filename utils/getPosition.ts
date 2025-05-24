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
    const locationTextRaw = body.match(locationTextRe)?.[1] ?? '';
    const locationText = JSON.parse(`"${locationTextRaw}"`);
    return { latitude, longitude, locationText };
  } catch {
    throw Error('未找到 latitude 和 longitude\nbody:' + body);
  }
}
