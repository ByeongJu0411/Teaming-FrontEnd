"use client";

import styles from "./landingpage.module.css";
import Header from "./_component/header";
import Body from "./_component/body";
import Count from "./_component/count";
import Review from "./_component/review";
import ReviewList from "./_component/reviewlist";
import Footer from "./_component/footer";
export default function LandingPage() {
  return (
    <>
      <div className={styles.container}>
        <Header />
        <Body />
        <Count />
        <Review />
        <ReviewList />
        <Footer />
      </div>
    </>
  );
}
