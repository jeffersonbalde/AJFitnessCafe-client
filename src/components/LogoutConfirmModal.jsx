import { useCallback, useEffect, useState } from "react";
import Portal from "./Portal.jsx";

const APP_NAME = "AJ Fitness Cafe Admin";

export default function LogoutConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (loading) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onCancel?.();
    }, 200);
  }, [onCancel, loading]);

  const handleConfirm = useCallback(() => {
    if (loading) return;
    onConfirm?.();
  }, [onConfirm, loading]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") handleClose();
    },
    [handleClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="account-approvals-detail-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        tabIndex={-1}
      >
        <div
          className={`account-approvals-detail-backdrop modal-backdrop-animation${closing ? " exit" : ""}${loading ? " logout-backdrop-loading" : ""}`}
          onClick={handleClose}
          aria-hidden
        />
        <div
          className={`account-approvals-detail-modal modal-content-animation${closing ? " exit" : ""}`}
        >
          <div className="account-approvals-detail-header">
            <div className="account-approvals-detail-header-text">
              <h5 id="logout-confirm-title" className="mb-0 fw-semibold">
                Sign out?
              </h5>
              <div className="account-approvals-detail-subtitle">
                <span className="account-approvals-detail-name">
                  Confirm sign out from your account
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close-custom"
              onClick={handleClose}
              aria-label="Close"
              disabled={loading}
            >
              ×
            </button>
          </div>
          <div className="account-approvals-detail-body">
            <p className="account-approvals-action-help mb-0">
              Are you sure you want to sign out? You will need to sign in again
              to access {APP_NAME}.
            </p>
          </div>
          <div className="account-approvals-detail-footer">
            <button
              type="button"
              className="btn btn-light account-approvals-detail-close-btn"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary account-approvals-detail-close-btn logout-confirm-signout-btn"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden
                  />
                  Signing out...
                </>
              ) : (
                "Yes, sign out"
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
