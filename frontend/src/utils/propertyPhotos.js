export function getFirstPropertyPhoto(rawPhotos) {
  let photos = rawPhotos;

  if (typeof rawPhotos === "string") {
    if (!rawPhotos.trim()) {
      return null;
    }

    try {
      photos = JSON.parse(rawPhotos);
    } catch {
      // L_Photos is legacy text and some database rows contain malformed JSON.
      return null;
    }
  }

  if (!Array.isArray(photos) || typeof photos[0] !== "string") {
    return null;
  }

  const firstPhoto = photos[0].trim();

  try {
    const url = new URL(firstPhoto);
    return ["https:", "http:"].includes(url.protocol) ? firstPhoto : null;
  } catch {
    return null;
  }
}
