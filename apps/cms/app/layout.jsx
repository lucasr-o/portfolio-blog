export const metadata = {
  title: "Lucas Reis — Blog editor",
  robots: { index: false, follow: false },
};

export default function CmsLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
