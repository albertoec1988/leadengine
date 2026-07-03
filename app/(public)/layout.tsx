import { Montserrat } from "next/font/google"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
})

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${montserrat.variable} flex min-h-screen flex-col`}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
