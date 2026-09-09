import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brandMark}>CM</div>
        <div>
          <p className={styles.eyebrow}>Clinic workspace</p>
          <strong>Clinic Management</strong>
        </div>
        <span className={styles.environment}>Development</span>
      </header>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Privacy-first operations</p>
          <h1>A calmer day at the clinic starts here.</h1>
          <p className={styles.lede}>
            A secure foundation for appointments, clinic teams, and the
            workflows that keep care moving.
          </p>
          <div className={styles.actions}>
            <button className={styles.primary}>Open dashboard</button>
            <button className={styles.secondary}>View setup guide</button>
          </div>
        </section>
        <section className={styles.cards} aria-label="Workspace overview">
          <article className={styles.card}>
            <span className={styles.cardLabel}>Today</span>
            <strong className={styles.cardValue}>Ready to configure</strong>
            <p>Connect a local PostgreSQL database to begin.</p>
          </article>
          <article className={styles.card}>
            <span className={styles.cardLabel}>Tenant model</span>
            <strong className={styles.cardValue}>Clinic-scoped</strong>
            <p>Every clinic-owned record carries an explicit clinic boundary.</p>
          </article>
          <article className={styles.card}>
            <span className={styles.cardLabel}>Data safety</span>
            <strong className={styles.cardValue}>No real data</strong>
            <p>Use synthetic records in development and tests.</p>
          </article>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>Built for one clinic manager today.</span>
        <span>Designed for many clinics tomorrow.</span>
      </footer>
    </div>
  );
}
