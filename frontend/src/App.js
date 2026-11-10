import { Link, Route, Routes } from "react-router-dom";
import ListingsPage from "./pages/ListingsPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="IDX Exchange home">
            <span className="brand-mark" aria-hidden="true">i</span>
            <span>IDX<span className="brand-light"> Exchange</span></span>
          </Link>
          <span className="header-label">Find your next chapter</span>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="*" element={<main className="detail-page"><div className="state-panel"><h1>Page not found</h1><Link to="/" className="back-link">Back to listings</Link></div></main>} />
      </Routes>
      <footer className="site-footer">
        <span>IDX Exchange</span>
        <span>A space for every story.</span>
      </footer>
    </>
  );
}
