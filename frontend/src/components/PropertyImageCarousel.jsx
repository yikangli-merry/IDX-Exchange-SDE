import { useEffect, useMemo, useState } from "react";
import { getPropertyPhotos } from "../utils/propertyPhotos";

export function PropertyPhoto({ src, address, alt, className = "property-image", loading = "lazy" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  return src && !failed ? (
    <img className={className} src={src} alt={alt} loading={loading} onError={() => setFailed(true)} />
  ) : (
    <div className="photo-placeholder" role="img" aria-label={`Photo unavailable for ${address}`}>
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M7 23 24 9l17 14M12 20v21h24V20M20 41V28h8v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Photo unavailable</span>
    </div>
  );
}

export default function PropertyImageCarousel({ photos, address }) {
  const urls = useMemo(() => getPropertyPhotos(photos), [photos]);
  const [index, setIndex] = useState(0);
  useEffect(() => { setIndex(0); }, [urls]);
  const current = index < urls.length ? index : 0;

  function move(event, direction) {
    event.preventDefault();
    event.stopPropagation();
    setIndex((value) => (value + direction + urls.length) % urls.length);
  }

  return (
    <div className="property-image-wrap" aria-label={`Photos of ${address}`}>
      <PropertyPhoto src={urls[current]} address={address} alt={current === 0 ? `Exterior of ${address}` : `Photo ${current + 1} of ${address}`} />
      <span className="listing-label">Property listing</span>
      {urls.length > 0 && <span className="photo-counter" aria-live="polite" aria-atomic="true">{current + 1} / {urls.length}</span>}
      {urls.length > 1 && <>
        <button type="button" className="photo-arrow photo-arrow-prev" aria-label={`Previous photo of ${address}`} onClick={(event) => move(event, -1)}>‹</button>
        <button type="button" className="photo-arrow photo-arrow-next" aria-label={`Next photo of ${address}`} onClick={(event) => move(event, 1)}>›</button>
      </>}
    </div>
  );
}
