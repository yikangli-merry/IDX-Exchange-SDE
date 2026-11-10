import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getPropertyPhotos } from "../utils/propertyPhotos";
import { PropertyPhoto } from "./PropertyImageCarousel";

export default function PropertyImageGallery({ photos, address }) {
  const urls = useMemo(() => getPropertyPhotos(photos), [photos]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const thumbnails = useRef([]);
  const current = index < urls.length ? index : 0;

  useEffect(() => { setIndex(0); setOpen(false); }, [urls]);
  useEffect(() => {
    thumbnails.current[current]?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [current]);
  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  function move(direction) {
    setIndex((value) => (value + direction + urls.length) % urls.length);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      if (urls.length > 1) move(event.key === "ArrowLeft" ? -1 : 1);
    } else if (event.key === "Tab") {
      const buttons = Array.from(dialog.current.querySelectorAll("button:not(:disabled)"));
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    }
  }

  return (
    <section className="property-gallery" aria-label={`Photo gallery of ${address}`}>
      {urls.length ? <>
        <button ref={trigger} type="button" className="gallery-main" aria-label={`Open photo ${current + 1} of ${address} in full screen`} onClick={() => setOpen(true)}>
          <PropertyPhoto src={urls[current]} address={address} alt={`Photo ${current + 1} of ${address}`} loading="eager" />
          <span className="gallery-expand">View full screen ↗</span>
          <span className="photo-counter">{current + 1} / {urls.length}</span>
        </button>
        <div className="gallery-thumbnails" aria-label="Choose a photo">
          {urls.map((url, photoIndex) => <button
            key={`${url}-${photoIndex}`} ref={(element) => { thumbnails.current[photoIndex] = element; }}
            type="button" aria-label={`Show photo ${photoIndex + 1}`} aria-pressed={current === photoIndex}
            onClick={() => setIndex(photoIndex)}
          ><PropertyPhoto src={url} address={address} alt={`Thumbnail ${photoIndex + 1} of ${address}`} /></button>)}
        </div>
      </> : <div className="gallery-empty"><PropertyPhoto address={address} /></div>}
      {open && createPortal(
        <div className="lightbox-backdrop" data-testid="lightbox-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div ref={dialog} className="lightbox" role="dialog" aria-modal="true" aria-label={`Photos of ${address}`} tabIndex={-1} onKeyDown={handleKeyDown}>
            <div className="lightbox-toolbar"><span aria-live="polite">{current + 1} / {urls.length}</span><button type="button" className="lightbox-close" aria-label="Close photo viewer" onClick={() => setOpen(false)}>✕</button></div>
            <div className="lightbox-image"><PropertyPhoto src={urls[current]} address={address} alt={`Full screen photo ${current + 1} of ${address}`} loading="eager" /></div>
            {urls.length > 1 && <div className="lightbox-navigation">
              <button type="button" onClick={() => move(-1)} aria-label="Previous photo">‹ Previous</button>
              <button type="button" onClick={() => move(1)} aria-label="Next photo">Next ›</button>
            </div>}
          </div>
        </div>, document.body,
      )}
    </section>
  );
}
