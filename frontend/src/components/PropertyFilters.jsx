import { useState } from "react";

const EMPTY_FILTERS = { city: "", zipcode: "", minPrice: "", maxPrice: "", beds: "", baths: "" };
const BED_OPTIONS = Array.from({ length: 11 }, (_, index) => String(index));
const BATH_OPTIONS = Array.from({ length: 21 }, (_, index) => String(index / 2));

export default function PropertyFilters({ onSearch, onClear }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (filters.minPrice !== "" && filters.maxPrice !== "" && Number(filters.minPrice) > Number(filters.maxPrice)) {
      setError("Min Price must be less than or equal to Max Price.");
      return;
    }

    setError("");
    onSearch({ ...filters });
  }

  function handleClear() {
    setFilters(EMPTY_FILTERS);
    setError("");
    onClear();
  }

  return (
    <section className="filters-section" aria-labelledby="filters-title">
      <div className="filters-heading">
        <h2 id="filters-title">Make the search yours</h2>
        <p>Choose what matters. Find what fits.</p>
      </div>
      <form className="property-filters" aria-label="Property filters" onSubmit={handleSubmit}>
        <div className="filter-fields">
          <label className="filter-field" htmlFor="filter-city">
            <span>City</span>
            <input id="filter-city" name="city" type="text" placeholder="Any city" value={filters.city} onChange={handleChange} />
          </label>
          <label className="filter-field" htmlFor="filter-zipcode">
            <span>ZIP Code</span>
            <input id="filter-zipcode" name="zipcode" type="text" inputMode="numeric" placeholder="Any ZIP code" value={filters.zipcode} onChange={handleChange} />
          </label>
          <label className="filter-field" htmlFor="filter-min-price">
            <span>Min Price</span>
            <input id="filter-min-price" name="minPrice" type="number" min="0" step="any" placeholder="No minimum" value={filters.minPrice} onChange={handleChange} />
          </label>
          <label className="filter-field" htmlFor="filter-max-price">
            <span>Max Price</span>
            <input id="filter-max-price" name="maxPrice" type="number" min="0" step="any" placeholder="No maximum" value={filters.maxPrice} onChange={handleChange} />
          </label>
          <label className="filter-field" htmlFor="filter-beds">
            <span>Beds</span>
            <select id="filter-beds" name="beds" value={filters.beds} onChange={handleChange}>
              <option value="">Any</option>
              {BED_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="filter-field" htmlFor="filter-baths">
            <span>Baths</span>
            <select id="filter-baths" name="baths" value={filters.baths} onChange={handleChange}>
              <option value="">Any</option>
              {BATH_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
        <div className="filter-actions">
          <p className="filter-note">Beds and baths match the exact number selected.</p>
          <div className="filter-buttons">
            <button className="clear-filters-button" type="button" onClick={handleClear}>Clear Filters</button>
            <button className="search-button" type="submit">Search <span aria-hidden="true">&rarr;</span></button>
          </div>
        </div>
        {error && <p className="filter-error" role="alert">{error}</p>}
      </form>
    </section>
  );
}
