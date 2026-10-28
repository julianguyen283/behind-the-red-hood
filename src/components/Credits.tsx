import { credits, site } from '../content/site'
import { Reveal } from './Reveal'

export function Credits() {
  return (
    <footer id="credits" aria-labelledby="credits-heading" className="border-t border-ivory/10 bg-charcoal/60 px-5 py-20 sm:px-8 md:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <h2 id="credits-heading" className="text-center font-ui text-[0.65rem] tracking-[0.5em] text-crimson uppercase">
            Credits
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-x-16 gap-y-14 md:grid-cols-2">
          {credits.map((group) => (
            <Reveal key={group.heading}>
              <h3 className="font-display text-2xl text-ivory">{group.heading}</h3>
              <dl className="mt-5 space-y-4">
                {group.items.map((item) => (
                  <div key={item.label} className="grid gap-1 border-t border-ivory/[0.07] pt-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="font-ui text-[0.7rem] tracking-[0.14em] text-ivory/45 uppercase">{item.label}</dt>
                    <dd className={`font-ui text-[0.86rem] leading-relaxed ${item.pending ? 'text-crimson/80' : 'text-ivory/75'}`}>
                      {item.value}
                      {item.pending && <span className="sr-only"> (to be completed)</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>

        <p className="mt-20 text-center font-ui text-[0.68rem] leading-relaxed tracking-[0.12em] text-ivory/40">
          © {site.year} {site.author}. {site.title} — created for {site.unit}.
          <br />
          All rights reserved unless otherwise stated above.
        </p>
      </div>
    </footer>
  )
}
