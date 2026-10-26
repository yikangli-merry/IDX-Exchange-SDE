import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";

export default function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);
  const activeController = useRef(null);
  const appliedFilters = useRef({});

  const loadProperties = useCallback(async (filters) => {
    // Invalidate synchronously, before another request or React state update can finish.
    const requestId = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    appliedFilters.current = { ...filters };
    const isCurrent = () => requestId === requestSequence.current && !controller.signal.aborted;

    setLoading(true);
    setError("");

    try {
      const payload = await fetchProperties({ ...filters, limit: 20, offset: 0 }, { signal: controller.signal });
      if (isCurrent()) {
        setProperties(payload.results);
        setTotal(payload.total);
      }
    } catch (requestError) {
      if (isCurrent() && requestError.name !== "AbortError") {
        setError(requestError.message || "Unable to load properties. Please try again.");
      }
    } finally {
      if (isCurrent()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadProperties({});

    return () => {
      requestSequence.current += 1;
      activeController.current?.abort();
    };
  }, [loadProperties]);

  return (
    <main className="listings-page">
      <section className="page-intro" aria-labelledby="page-title">
        <p className="eyebrow"><span aria-hidden="true" /> The property collection</p>
        <h1 id="page-title">Find a place to <em>call home.</em></h1>
        <p className="page-description">A new perspective. A fresh start. Explore homes and find the space for your next chapter.</p>
      </section>

      <PropertyFilters onSearch={loadProperties} onClear={() => loadProperties({})} />

      <section className="listings-section" aria-labelledby="listings-title" aria-busy={loading}>
        <div className="listings-toolbar">
          <h2 id="listings-title">Explore homes <span className="section-rule" aria-hidden="true" /></h2>
          {!loading && !error && (
            <p className="property-count" role="status">Showing <strong>{properties.length}</strong> of <strong>{total.toLocaleString("en-US")}</strong> properties</p>
          )}
        </div>

        {loading ? (
          <div className="state-panel" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <h3>Loading properties...</h3>
            <p>Finding the details that make a home.</p>
          </div>
        ) : error ? (
          <div className="state-panel error-panel" role="alert">
            <span className="state-icon" aria-hidden="true">!</span>
            <h3>We couldn't load the properties</h3>
            <p>{error}</p>
            <button type="button" className="retry-button" onClick={() => loadProperties(appliedFilters.current)}>Try again <span aria-hidden="true">&rarr;</span></button>
          </div>
        ) : properties.length === 0 ? (
          <div className="state-panel" role="status">
            <h3>No properties found</h3>
            <p>Try adjusting your filters or clearing them to see more properties.</p>
          </div>
        ) : (
          <div className="property-grid">
            {properties.map((property) => <PropertyCard key={property.id ?? property.L_ListingID} property={property} />)}
          </div>
        )}
      </section>
    </main>
  );
}
