const FOOTER_TAGLINE =
  "Healthy juice & smoothies — Pagadian City";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-3 bg-light mt-auto">
      <div className="container-fluid">
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between small">
          <span className="text-muted">
            &copy; {currentYear} AJ Fitness Cafe Pagadian. {FOOTER_TAGLINE}. All
            rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
