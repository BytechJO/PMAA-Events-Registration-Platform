import styles from "../webinar.module.css";

export function WebinarFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <a href="https://www.preissmurphydigital.com">
          www.preissmurphydigital.com
        </a>
        <span>
          One-Stop Education. Built for what’s next. Driven by what matters.
        </span>
      </div>
    </footer>
  );
}
