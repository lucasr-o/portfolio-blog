import "@/app/globals.css";
import PublicDocument from "@/components/PublicDocument";
import { siteMetadata } from "@/lib/site-metadata";

export const metadata = siteMetadata;

export default function EnglishRootLayout({ children }) {
  return <PublicDocument lang="en">{children}</PublicDocument>;
}
