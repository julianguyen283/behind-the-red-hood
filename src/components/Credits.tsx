import { credits, site } from '../content/site'

/** Small, clearly separate credits and media sources. */
export function Credits() {
  return (
    <footer id="credits" aria-labelledby="credits-heading" className="relative z-10 border-t border-mist/40 bg-charcoal px-5 py-16 sm:px-8 md:py-20">
      <div className="mx-auto max-w-5xl">
        <h2 id="credits-heading" className="font-display text-3xl font-medium text-ivory">
          Credits &amp; Sources
        </h2>

        <div className="mt-10 grid gap-x-14 gap-y-10 md:grid-cols-2">
          {credits.map((group) => (
            <section key={group.heading} aria-labelledby={`credits-${group.heading}`}>
              <h3 id={`credits-${group.heading}`} className="text-ui font-medium text-ivory">
                {group.heading}
              </h3>
              <dl className="mt-3 space-y-3">
                {group.items.map((item) => (
                  <div key={item.label} className={`border-t border-mist/30 pt-3 ${item.pending ? 'border-l-2 border-l-blood pl-3' : ''}`}>
                    <dt className="text-ui text-ivory/90">{item.label}</dt>
                    <dd className="text-ui text-muted">
                      {item.value}
                      {item.href && (
                        <>
                          {' '}
                          <a href={item.href} target="_blank" rel="noreferrer" className="underline decoration-mist underline-offset-4 hover:text-ivory">
                            Source<span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        </>
                      )}
                      {item.pending && <span className="sr-only"> (to be completed)</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <p className="text-ui mt-14 text-muted">
          © {site.year} {site.author}. {site.title}, created for {site.unit}.
        </p>
      </div>
    </footer>
  )
}
