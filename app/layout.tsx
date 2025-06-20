import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boskobot",
  description: "Bot si s vámi povídá o Boskovicích",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <head>
        <link rel="shortcut icon" type="image/png" href="/avatar.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
