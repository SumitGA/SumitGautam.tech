import { getPosts } from "../lib/blog-data";
import SplashOverlay from "./SplashOverlay";
import HomeContent from "./HomeContent";

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  // Three is enough to show there is writing without turning the home page
  // into an index; /blog is one click away.
  const posts = await getPosts({ limit: 3 });
  return (
    <>
      <SplashOverlay />
      <HomeContent posts={posts} />
    </>
  );
}
