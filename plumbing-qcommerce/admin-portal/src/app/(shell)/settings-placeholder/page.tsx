export default function SettingsPlaceholderPage() {
  return (
    <section className="panel">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Reserved for portal configuration work in a later phase.</p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-label">Branding</div>
          <div className="detail-value">Placeholder for logo, theme, and naming controls.</div>
        </div>
        <div className="detail-card">
          <div className="detail-label">Access</div>
          <div className="detail-value">Placeholder for portal policy and account controls.</div>
        </div>
        <div className="detail-card">
          <div className="detail-label">Notifications</div>
          <div className="detail-value">Placeholder for alert delivery preferences.</div>
        </div>
      </div>
    </section>
  );
}
