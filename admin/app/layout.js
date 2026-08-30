import "./globals.css";

export const metadata = {
  title: "Portfolio Admin",
  description: "Admin panel for sumitgautam.tech",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
