import "./globals.css";

export const metadata = {
  title: "QuickQuote — Freelance Service Quotation System",
  description:
    "Tax estimator, instant PDF invoices, time-to-value calculator and project health tracking for student freelancers.",
};

export const viewport = {
  themeColor: "#0a0e24",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
