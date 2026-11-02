import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import Pagination from "../components/Pagination";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";

export default function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);
  const activeController = useRef(null);
  const lastRequest = useRef({ filters: {}, page: 1 });
  const previousPage = useRef(1);

  const loadProperties = useCallback(async (filters, page = 1) => {
    // Invalidate synchronously, before another request or React state update can finish.
    const requestId = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    lastRequest.current = { filters: { ...filters }, page };
    const isCurrent = () => requestId === requestSequence.current && !controller.signal.aborted;

    setLoading(true);
    setError("");
    setCurrentPage(page);

    try {
      const payload = await fetchProperties({ ...filters, limit: itemsPerPage, offset: (page - 1) * itemsPerPage }, { signal: controller.signal });
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
  }, [itemsPerPage]);

  useEffect(() => {
    loadProperties({});

    return () => {
      requestSequence.current += 1;
      activeController.current?.abort();
    };
  }, [loadProperties]);

  useEffect(() => {
    if (previousPage.current !== currentPage) {
      window.scrollTo(0, 0);
      previousPage.current = currentPage;
    }
  }, [currentPage]);

  const totalPages = Math.ceil(total / itemsPerPage);
  const firstResult = properties.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const lastResult = properties.length > 0 ? (currentPage - 1) * itemsPerPage + properties.length : 0;

  function handlePageChange(page) {
    if (!loading && !error && Number.isInteger(page) && page >= 1 && page <= totalPages && page !== lastRequest.current.page) {
      loadProperties(lastRequest.current.filters, page);
    }
  }

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
            <p className="property-count" role="status">Showing <strong>{firstResult.toLocaleString("en-US")}–{lastResult.toLocaleString("en-US")}</strong> of <strong>{total.toLocaleString("en-US")}</strong> properties</p>
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
            <button type="button" className="retry-button" onClick={() => loadProperties(lastRequest.current.filters, lastRequest.current.page)}>Try again <span aria-hidden="true">&rarr;</span></button>
          </div>
        ) : properties.length === 0 ? (
          <div className="state-panel" role="status">
            <h3>No properties found</h3>
            <p>Try adjusting your filters or clearing them to see more properties.</p>
          </div>
        ) : (
          <>
            <div className="property-grid">
              {properties.map((property) => <PropertyCard key={property.id ?? property.L_ListingID} property={property} />)}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </section>
    </main>
  );
}
