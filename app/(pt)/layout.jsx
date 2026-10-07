import "@/app/globals.css";
import PublicDocument from "@/components/PublicDocument";
import { siteMetadata } from "@/lib/site-metadata";

export const metadata = siteMetadata;

export default function PortugueseRootLayout({ children }) {
  return <PublicDocument lang="pt-BR" skipLabel="Ir para o conteúdo">{children}</PublicDocument>;
}
