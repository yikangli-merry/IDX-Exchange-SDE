export function getPropertyPhotos(rawPhotos) {
  let photos = rawPhotos;
  if (typeof rawPhotos === "string") {
    try {
      photos = JSON.parse(rawPhotos);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(photos)) return [];
  return photos.filter((photo) => {
    if (typeof photo !== "string") return false;
    try {
      return ["https:", "http:"].includes(new URL(photo.trim()).protocol);
    } catch {
      return false;
    }
  }).map((photo) => photo.trim());
}

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
