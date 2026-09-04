import { SiteFooter } from './site-chrome'

export function ContentPage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string
  title: string
  lede: string
  children: React.ReactNode
}) {
  return (
    <>
      <main className="shell content-page">
        <header>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
        </header>
        <div className="content-prose">{children}</div>
      </main>
      <SiteFooter />
    </>
  )
}
