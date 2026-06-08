import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

export default function AdminPageLoading({
  iconClassName = "fas fa-th-large",
  title,
  subtitle = "Preparing your overview…",
  message = "Loading… Please wait.",
}) {
  return (
    <div className="card border-0 shadow-sm w-100">
      <div
        className="card-header border-0"
        style={{
          backgroundColor: T.headerBg,
          borderBottom: T.headerBorder,
        }}
      >
        <div className="d-flex flex-column flex-md-row align-items-flex-start align-items-md-center gap-2 gap-md-3">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              backgroundColor: T.primaryGreen,
              color: "#ffffff",
            }}
          >
            <i className={iconClassName} aria-hidden />
          </div>
          <div>
            <h2
              className="mb-1"
              style={{
                fontFamily: T.interFamily,
                fontWeight: 700,
                fontSize: "1.05rem",
                color: T.titleColor,
              }}
            >
              {title}
            </h2>
            <p
              className="mb-0"
              style={{
                fontFamily: T.interFamily,
                fontSize: "0.85rem",
                color: T.subtitleColor,
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      </div>
      <div className="card-body" style={{ backgroundColor: T.bodyBg }}>
        <div className="d-flex flex-column align-items-center justify-content-center py-4">
          <div
            className="spinner-border"
            role="status"
            style={{
              width: "1.75rem",
              height: "1.75rem",
              color: T.primaryGreen,
            }}
          />
          <p
            className="mt-3 mb-0 text-muted"
            style={{ fontFamily: T.interFamily, fontSize: "0.9rem" }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
