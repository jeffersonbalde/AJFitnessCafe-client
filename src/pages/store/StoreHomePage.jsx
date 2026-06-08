import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import StoreMenuSection from "./StoreMenuSection";

export default function StoreHomePage() {
  const location = useLocation();

  useEffect(() => {
    const el = document.getElementById("store-menu");
    if (!el) return;
    const goMenu =
      location.pathname === "/menu" ||
      location.hash === "#store-menu" ||
      location.hash === "#menu";
    if (goMenu) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.pathname, location.hash]);

  return (
    <div>
      <section
        className="store-hero text-center py-4 py-lg-5 mb-4 mb-lg-5 rounded-3 px-3"
        aria-label="Welcome"
      >
        <p className="store-hero-eyebrow text-uppercase small fw-semibold mb-2">
          Healthy &amp; fresh
        </p>
        <h1 className="store-hero-title display-6 fw-bold mb-3">
          Cold-pressed juices &amp; smoothies
        </h1>
        <p className="store-hero-lead lead mb-0 mx-auto" style={{ maxWidth: "36rem" }}>
          The first healthy cafe with vegan options in Pagadian City. Fresh
          blends for <strong>pickup</strong> or <strong>delivery</strong>—
          browse the menu below.
        </p>
      </section>

      <StoreMenuSection />
    </div>
  );
}
