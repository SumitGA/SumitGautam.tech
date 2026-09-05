import SplashOverlay from "./SplashOverlay";
import HomeContent from "./HomeContent";

export const metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <SplashOverlay />
      <HomeContent />
    </>
  );
}
