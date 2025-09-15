import styles from "./footer.module.css";

export default function Footer() {
  return (
    <>
      <div className={styles.container}>
        <p className={styles.teaming}>Teaming</p>
        <p className={styles.created}>Created by GoodSpace</p>
        <p className={styles.year}>@2025</p>
      </div>
    </>
  );
}
