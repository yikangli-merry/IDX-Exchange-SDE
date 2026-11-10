import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchPropertyDetail, fetchPropertyOpenHouses } from "../api/client";
import OpenHouses from "../components/OpenHouses";
import PropertyImageGallery from "../components/PropertyImageGallery";
import PropertyMap from "../components/PropertyMap";

const numberFormat = new Intl.NumberFormat("en-US");
const priceFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function stat(value, useGrouping = true) {
  if (value === null || value === undefined || String(value).trim() === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? (useGrouping ? numberFormat.format(number) : String(number)) : "—";
}

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "—";
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [detailState, setDetailState] = useState({ id, loading: true, property: null, error: "" });
  const [openHouseState, setOpenHouseState] = useState({ id, loading: true, events: [], error: "" });
  const [detailRetry, setDetailRetry] = useState(0);
  const [openHouseRetry, setOpenHouseRetry] = useState(0);
  const detailSequence = useRef(0);
  const openHouseSequence = useRef(0);
  const validId = /^\d+$/.test(id);
  const detail = detailState.id === id ? detailState : { loading: true, property: null, error: "" };
  const houses = openHouseState.id === id ? openHouseState : { loading: true, events: [], error: "" };
  const from = location.state?.from;
  // Only return to this app's listing route, even if history state was modified.
  const backTo = typeof from === "string" && (from === "/" || from.startsWith("/?")) ? from : "/";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!validId) return undefined;
    const controller = new AbortController();
    const sequence = ++detailSequence.current;
    const isCurrent = () => !controller.signal.aborted && detailSequence.current === sequence;
    setDetailState({ id, loading: true, property: null, error: "" });
    fetchPropertyDetail(id, { signal: controller.signal }).then((property) => {
      if (isCurrent()) setDetailState({ id, loading: false, property, error: "" });
    }).catch((error) => {
      if (isCurrent() && error.name !== "AbortError") setDetailState({ id, loading: false, property: null, error: error.message || "Unable to load this property." });
    });
    return () => { controller.abort(); detailSequence.current += 1; };
  }, [id, validId, detailRetry]);

  useEffect(() => {
    if (!validId) return undefined;
    const controller = new AbortController();
    const sequence = ++openHouseSequence.current;
    const isCurrent = () => !controller.signal.aborted && openHouseSequence.current === sequence;
    setOpenHouseState({ id, loading: true, events: [], error: "" });
    fetchPropertyOpenHouses(id, { signal: controller.signal }).then((events) => {
      if (isCurrent()) setOpenHouseState({ id, loading: false, events, error: "" });
    }).catch((error) => {
      if (isCurrent() && error.name !== "AbortError") setOpenHouseState({ id, loading: false, events: [], error: error.message || "Unable to load open houses." });
    });
    return () => { controller.abort(); openHouseSequence.current += 1; };
  }, [id, validId, openHouseRetry]);

  const property = detail.property;
  const address = property?.L_Address?.trim() || "Address unavailable";
  const propertyLocation = property ? [property.L_City?.trim(), property.L_State?.trim(), property.L_Zip?.trim()].filter(Boolean).join(", ") : "";
  const price = Number(property?.L_SystemPrice);
  const facts = property ? [
    ["Property type", text(property.L_Type_)], ["Status", text(property.L_Status)],
    ["Lot size (sq ft)", stat(property.LotSizeSquareFeet ?? property.L_Keyword1)],
    ["Garage spaces", stat(property.L_Keyword5)], ["MLS number", text(property.L_DisplayId || property.L_ListingID)],
  ] : [];

  return (
    <main className="detail-page">
      <Link className="back-link" to={backTo}>← Back to listings</Link>
      {!validId ? <div className="state-panel" role="alert"><h1>Invalid property ID</h1><p>Please choose a property from the listings page.</p></div>
        : detail.loading ? <div className="state-panel" role="status"><span className="loading-spinner" aria-hidden="true" /><h1>Loading property...</h1></div>
          : detail.error ? <div className="state-panel" role="alert"><h1>We couldn't load this property</h1><p>{detail.error}</p><button type="button" className="retry-button" onClick={() => setDetailRetry((value) => value + 1)}>Try again</button></div>
            : property && <>
              <header className="detail-heading">
                <div><p className="eyebrow">A place to call yours</p><h1>{address}</h1><p className="detail-location">{propertyLocation || "Location unavailable"}</p></div>
                <p className="detail-price">{Number.isFinite(price) && price > 0 ? priceFormat.format(price) : "Price unavailable"}</p>
              </header>
              <PropertyImageGallery key={id} photos={property.L_Photos} address={address} />
              <dl className="detail-stats">
                {[["Beds", property.L_Keyword2], ["Baths", property.LM_Dec_3], ["Sq ft", property.LM_Int2_3], ["Year built", property.YearBuilt]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{stat(value, label !== "Year built")}</dd></div>)}
              </dl>
              <div className="detail-columns">
                <div className="detail-primary">
                  <section className="detail-panel" aria-labelledby="description-title"><h2 id="description-title">About this home</h2><p className="property-description">{property.L_Remarks?.trim() || "No description available."}</p></section>
                  <section className="detail-panel" aria-labelledby="facts-title"><h2 id="facts-title">Property details</h2><dl className="property-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
                  <PropertyMap latitude={property.LMD_MP_Latitude} longitude={property.LMD_MP_Longitude} address={address} />
                </div>
                <aside><OpenHouses openHouses={houses.events} loading={houses.loading} error={houses.error} onRetry={() => setOpenHouseRetry((value) => value + 1)} /></aside>
              </div>
            </>}
    </main>
  );
}
