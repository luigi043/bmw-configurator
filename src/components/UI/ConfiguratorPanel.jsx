import { useConfigurator } from '../../store/useConfigurator.js';
import { PAINTS, WHEELS, TRIMS, PACKAGES } from '../../data/carConfig.js';
import { formatCurrency } from '../../utils/format.js';

/** A labelled section wrapper for visual rhythm in the panel. */
function Section({ title, children }) {
  return (
    <section className="section">
      <h2 className="section__title">{title}</h2>
      {children}
    </section>
  );
}

function priceTag(amount) {
  return amount === 0 ? 'Included' : `+ ${formatCurrency(amount)}`;
}

export default function ConfiguratorPanel() {
  const { paintId, wheelId, trimId, packageIds } = useConfigurator();
  const setPaint = useConfigurator((s) => s.setPaint);
  const setWheel = useConfigurator((s) => s.setWheel);
  const setTrim = useConfigurator((s) => s.setTrim);
  const togglePackage = useConfigurator((s) => s.togglePackage);

  return (
    <aside className="panel" aria-label="Configurator">
      <Section title="Paint">
        <div className="swatches">
          {PAINTS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`swatch ${p.id === paintId ? 'swatch--active' : ''}`}
              style={{ '--swatch': p.hex }}
              aria-pressed={p.id === paintId}
              aria-label={`${p.name}, ${priceTag(p.price)}`}
              title={`${p.name} · ${priceTag(p.price)}`}
              data-testid={`paint-${p.id}`}
              onClick={() => setPaint(p.id)}
            >
              <span className="swatch__dot" />
            </button>
          ))}
        </div>
        <p className="section__hint">{PAINTS.find((p) => p.id === paintId)?.name}</p>
      </Section>

      <Section title="Wheels">
        <div className="options">
          {WHEELS.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`option ${w.id === wheelId ? 'option--active' : ''}`}
              aria-pressed={w.id === wheelId}
              data-testid={`wheel-${w.id}`}
              onClick={() => setWheel(w.id)}
            >
              <span>{w.name}</span>
              <span className="option__price">{priceTag(w.price)}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Interior">
        <div className="options">
          {TRIMS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`option ${t.id === trimId ? 'option--active' : ''}`}
              aria-pressed={t.id === trimId}
              data-testid={`trim-${t.id}`}
              onClick={() => setTrim(t.id)}
            >
              <span className="option__swatch" style={{ background: t.accent }} />
              <span>{t.name}</span>
              <span className="option__price">{priceTag(t.price)}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Packages">
        <div className="options">
          {PACKAGES.map((pk) => {
            const active = packageIds.includes(pk.id);
            return (
              <button
                key={pk.id}
                type="button"
                className={`option option--toggle ${active ? 'option--active' : ''}`}
                aria-pressed={active}
                data-testid={`package-${pk.id}`}
                onClick={() => togglePackage(pk.id)}
              >
                <span className={`check ${active ? 'check--on' : ''}`} aria-hidden="true" />
                <span>{pk.name}</span>
                <span className="option__price">{priceTag(pk.price)}</span>
              </button>
            );
          })}
        </div>
      </Section>
    </aside>
  );
}
