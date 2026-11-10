import { Link, useLocation } from "react-router-dom";
import PropertyImageCarousel from "./PropertyImageCarousel";

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
  const routeLocation = useLocation();
  const price = Number(property.L_SystemPrice);
  const address = property.L_Address?.trim() || "Address unavailable";
  const location = [property.L_City?.trim(), property.L_State?.trim()].filter(Boolean).join(", ");

  return (
    <article className="property-card" aria-label={address}>
      <PropertyImageCarousel photos={property.L_Photos} address={address} />
      <div className="property-content">
        <p className="property-price">{Number.isFinite(price) && price > 0 ? priceFormat.format(price) : "Price unavailable"}</p>
        <h2 className="property-address">{property.L_ListingID ? <Link className="property-card-link" to={`/property/${encodeURIComponent(property.L_ListingID)}`} state={{ from: `${routeLocation.pathname}${routeLocation.search}` }}>{address}</Link> : address}</h2>
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
