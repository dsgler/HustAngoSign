export function getPosition(body: string): {
  latitude: string;
  longitude: string;
  locationText: string;
} {
  // 新版页面格式：<input type="hidden" id="latitude" value="30.52" /> 等
  const latitude = body.match(/id="latitude" value="([0-9.]+)"/)?.[1];
  const longitude = body.match(/id="longitude" value="([0-9.]+)"/)?.[1];
  if (latitude && longitude) {
    const locationText = body.match(/id="title" value="([^"]*)"/)?.[1] ?? '';
    return { latitude, longitude, locationText };
  }

  // 旧版页面格式：locationLatitude / locationLongitude / locationText JS 变量
  try {
    const LaRe = /locationLatitude.+?([0-9.]+).+?/;
    const lat = body.match(LaRe)![1];
    const LoRe = /locationLongitude.+?([0-9.]+).+?/;
    const lon = body.match(LoRe)![1];
    const locationTextRe = /locationText.+?'(.+)'/;
    const locationTextRaw = body.match(locationTextRe)?.[1] ?? '';
    const locationText = JSON.parse(`"${locationTextRaw}"`);
    return { latitude: lat, longitude: lon, locationText };
  } catch {
    throw Error('未找到 latitude 和 longitude\nbody:' + body);
  }
}
