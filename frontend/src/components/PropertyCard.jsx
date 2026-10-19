import { useEffect, useState } from "react";
import { getFirstPropertyPhoto } from "../utils/propertyPhotos";

const numberFormat = new Intl.NumberFormat("en-US");
const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatStat(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "\u2014";
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? numberFormat.format(number) : "\u2014";
}

export default function PropertyCard({ property }) {
  const photo = getFirstPropertyPhoto(property.L_Photos);
  const [imageFailed, setImageFailed] = useState(false);
  const price = Number(property.L_SystemPrice);
  const address = property.L_Address?.trim() || "Address unavailable";
  const location = [property.L_City?.trim(), property.L_State?.trim()].filter(Boolean).join(", ");

  useEffect(() => {
    setImageFailed(false);
  }, [photo]);

  return (
    <article className="property-card" aria-label={address}>
      <div className="property-image-wrap">
        {photo && !imageFailed ? (
          <img
            className="property-image"
            src={photo}
            alt={`Exterior of ${address}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="photo-placeholder" role="img" aria-label={`Photo unavailable for ${address}`}>
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M7 23 24 9l17 14M12 20v21h24V20M20 41V28h8v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Photo unavailable</span>
          </div>
        )}
        <span className="listing-label">Property listing</span>
      </div>
      <div className="property-content">
        <p className="property-price">{Number.isFinite(price) && price > 0 ? priceFormat.format(price) : "Price unavailable"}</p>
        <h2 className="property-address">{address}</h2>
        <p className="property-location">{location || "Location unavailable"}</p>
        <dl className="property-stats">
          <div><dt>Beds</dt><dd>{formatStat(property.L_Keyword2)}</dd></div>
          <div><dt>Baths</dt><dd>{formatStat(property.LM_Dec_3)}</dd></div>
          <div><dt>Sq ft</dt><dd>{formatStat(property.LM_Int2_3)}</dd></div>
        </dl>
      </div>
    </article>
  );
}
