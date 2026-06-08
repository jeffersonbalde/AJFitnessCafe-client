import { ADMIN_PAGE_THEME as T } from "./adminPageTheme";

/**
 * Same outer shell as ATIn-client admin pages: mint header strip, green icon circle, off-white body.
 */
export default function AdminPageShell({
  iconClassName = "fas fa-th-large",
  title,
  subtitle,
  headerActions = null,
  children,
  bodyClassName = "",
  bodyStyle = undefined,
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
        <div className="d-flex flex-column flex-md-row align-items-flex-start align-items-md-center justify-content-between gap-3">
          <div className="d-flex flex-column flex-sm-row align-items-flex-start align-items-sm-center gap-2 gap-sm-3 flex-grow-1 min-w-0">
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
            <div className="min-w-0">
              <h2
                className="mb-1 text-break"
                style={{
                  fontFamily: T.interFamily,
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  color: T.titleColor,
                }}
              >
                {title}
              </h2>
              {subtitle ? (
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
              ) : null}
            </div>
          </div>
          {headerActions ? (
            <div className="flex-shrink-0">{headerActions}</div>
          ) : null}
        </div>
      </div>
      <div
        className={`card-body ${bodyClassName}`.trim()}
        style={{ backgroundColor: T.bodyBg, ...bodyStyle }}
      >
        {children}
      </div>
    </div>
  );
}
