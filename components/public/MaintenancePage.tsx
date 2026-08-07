export function MaintenancePage({ footer }: { footer: string }) {
  return (
    <main className="hero" style={{ minHeight: "100vh" }}>
      <div className="hero-inner" style={{ maxWidth: 640 }}>
        <p className="hero-brand">Hassan</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>
          Taking a short creative break
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          This website is temporarily in maintenance mode while a parent/guardian makes updates.
          Please check back soon.
        </p>
        <p className="contact-note" style={{ marginTop: "2rem" }}>
          {footer}
        </p>
      </div>
    </main>
  );
}
