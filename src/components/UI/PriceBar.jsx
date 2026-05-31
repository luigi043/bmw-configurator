import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useConfigurator } from '../../store/useConfigurator.js';
import { formatCurrency } from '../../utils/format.js';

/**
 * Sticky total. The number tweens between values with GSAP so price changes
 * read as a smooth count-up rather than a jarring jump.
 */
export default function PriceBar() {
  const total = useConfigurator((s) => s.price.total);
  const reset = useConfigurator((s) => s.reset);
  const valueRef = useRef(null);
  const prev = useRef(total);

  useEffect(() => {
    const node = valueRef.current;
    if (!node) return;
    const obj = { v: prev.current };
    const tween = gsap.to(obj, {
      v: total,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => { node.textContent = formatCurrency(Math.round(obj.v)); },
    });
    prev.current = total;
    return () => tween.kill();
  }, [total]);

  return (
    <div className="pricebar">
      <div className="pricebar__total">
        <span className="pricebar__label">Total</span>
        <span className="pricebar__value" ref={valueRef} data-testid="total">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="pricebar__actions">
        <button type="button" className="btn btn--ghost" onClick={reset} data-testid="reset">
          Reset
        </button>
        <button type="button" className="btn btn--primary">
          Continue
        </button>
      </div>
    </div>
  );
}
