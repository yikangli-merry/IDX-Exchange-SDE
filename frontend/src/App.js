import ListingsPage from "./pages/ListingsPage";

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="IDX Exchange home">
            <span className="brand-mark" aria-hidden="true">i</span>
            <span>IDX<span className="brand-light"> Exchange</span></span>
          </a>
          <span className="header-label">Find your next chapter</span>
        </div>
      </header>
      <ListingsPage />
      <footer className="site-footer">
        <span>IDX Exchange</span>
        <span>A space for every story.</span>
      </footer>
    </>
  );
}
