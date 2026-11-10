function coordinate(value, maximum) {
  if (!["string", "number"].includes(typeof value) || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= maximum ? number : null;
}

export default function PropertyMap({ latitude, longitude, address }) {
  const lat = coordinate(latitude, 90);
  const lng = coordinate(longitude, 180);
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY?.trim();
  const valid = lat !== null && lng !== null;
  const location = `${lat},${lng}`;
  const embedQuery = new URLSearchParams({ key: apiKey || "", q: location, zoom: "15" });
  const directionsQuery = new URLSearchParams({ api: "1", destination: location });

  return (
    <section className="detail-panel property-map" aria-labelledby="location-title">
      <div className="detail-section-heading"><h2 id="location-title">Location</h2>
        {valid && <a className="directions-link" href={`https://www.google.com/maps/dir/?${directionsQuery}`} target="_blank" rel="noopener noreferrer">Get Directions ↗</a>}
      </div>
      {valid && apiKey ? <iframe
        title={`Map of ${address}`} src={`https://www.google.com/maps/embed/v1/place?${embedQuery}`}
        loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
      /> : <p className="map-unavailable">{valid ? "Map preview is unavailable. Use Get Directions to view this location." : "Location unavailable for this property."}</p>}
    </section>
  );
}
