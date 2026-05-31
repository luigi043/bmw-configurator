import { useConfigurator } from '../../store/useConfigurator.js';
import { MODELS } from '../../data/carConfig.js';

export default function Header() {
  const modelId = useConfigurator((s) => s.modelId);
  const setModel = useConfigurator((s) => s.setModel);

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo" aria-hidden="true">◆</span>
        <span>DRIVE STUDIO</span>
      </div>

      <nav className="header__models" aria-label="Model">
        {MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`pill ${m.id === modelId ? 'pill--active' : ''}`}
            aria-pressed={m.id === modelId}
            onClick={() => setModel(m.id)}
          >
            {m.name}
          </button>
        ))}
      </nav>
    </header>
  );
}
