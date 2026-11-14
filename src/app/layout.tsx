import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_TEL } from "@/lib/config";
import { logout } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Permit Central — new building permits for your trade",
  description: "Every morning, new building permits in your ZIP codes, tagged for fence, landscaping, pool, gutter and blinds contractors.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f2742" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="header-inner">
            <Link href={user ? "/dashboard" : "/"} className="logo">Permit<span>Central</span></Link>
            <a className="header-phone" href={SUPPORT_PHONE_TEL} aria-label={`Call ${SUPPORT_PHONE}`}>
              <span aria-hidden="true">📞</span> <span className="header-phone-num">{SUPPORT_PHONE}</span><span className="header-phone-short">Call</span>
            </a>
            <nav className="nav">
              {user ? (
                <>
                  <Link href="/dashboard">Permits</Link>
                  <Link href="/settings">Settings</Link>
                  <form action={logout}><button type="submit">Log out</button></form>
                </>
              ) : (
                <Link href="/login">Log in</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="main">{children}</main>
        <footer className="footer">
          <nav>
            <Link href="/terms">Terms</Link>
            <Link href="/terms#refunds">Refund policy</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <p>© {new Date().getFullYear()} Permit Central · <a href={SUPPORT_PHONE_TEL}>{SUPPORT_PHONE}</a> · <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
        </footer>
      </body>
    </html>
  );
}
