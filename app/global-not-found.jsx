import "./globals.css";
import PublicDocument from "@/components/PublicDocument";
import NotFoundContent from "@/components/NotFoundContent";

export const metadata = { title: "Page not found" };

export default function GlobalNotFound() {
  return <PublicDocument><NotFoundContent /></PublicDocument>;
}
