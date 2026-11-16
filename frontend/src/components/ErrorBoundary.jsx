import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="detail-page">
          <div className="state-panel error-panel" role="alert">
            <h1>Something went wrong</h1>
            <p>We couldn't display this page. Try again or return to the property listings.</p>
            <div className="recovery-actions">
              <button type="button" className="retry-button" onClick={() => this.setState({ hasError: false })}>Try again</button>
              <Link className="back-link" to="/">Back to listings</Link>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
