function formatDate(value) {
  if (!value) return "Date unavailable";
  // MySQL DATE values have no timezone. Preserve a date-only string's calendar day.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatTime(value) {
  const match = typeof value === "string" && /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return "Time unavailable";
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
}

function getRemarks(rawData) {
  try {
    const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
    return typeof data?.OpenHouseRemarks === "string" ? data.OpenHouseRemarks.trim() : "";
  } catch {
    return "";
  }
}

export default function OpenHouses({ openHouses = [], loading = false, error = "", onRetry }) {
  return (
    <section className="detail-panel open-houses" aria-labelledby="open-houses-title" aria-busy={loading}>
      <p className="eyebrow">Come take a look</p>
      <h2 id="open-houses-title">Open houses</h2>
      {loading ? <p role="status">Loading open houses...</p> : error ? <div role="alert"><p>{error}</p><button type="button" className="retry-button" onClick={onRetry}>Retry open houses</button></div>
        : openHouses.length === 0 ? <p>No open houses scheduled</p> : <ul className="open-house-list">
          {openHouses.map((event, index) => {
            const remarks = getRemarks(event.all_data);
            return <li key={event.id ?? index}>
              <p className="open-house-date">{formatDate(event.OpenHouseDate)}</p>
              <p className="open-house-time">{formatTime(event.OH_StartTime)} – {formatTime(event.OH_EndTime)}</p>
              {remarks && <p className="open-house-remarks">{remarks}</p>}
            </li>;
          })}
        </ul>}
    </section>
  );
}
