export default function LandingPage() {
  return (
    <div className="landing">
      <div className="hero-glow" />

      <header className="lp-header">
        <span className="lp-logo">
          <span className="lp-logo-mark"><span /></span>
          IRONSET
        </span>
        <nav className="lp-nav">
          <span>Progression</span>
          <span>Pricing</span>
          <a href="/login" className="nav-link">Log in</a>
          <a href="/signup" className="btn-solid">Start tracking</a>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="hero-glow-corner" />
        <div className="hero-copy">
          <p className="eyebrow-line"><span className="tick-line" />For anyone who lifts consistently — or wants to</p>
          <h1>Show up. Log the set. Let the numbers prove you're getting stronger.</h1>
          <p className="hero-sub">
            Whether you're building the habit or ten years into it, the rule is the same.
            Nine-plus reps adds weight. Five or fewer drops it. No guesswork, no gimmicks, just
            what your last session actually says.
          </p>
          <div className="hero-actions">
            <a href="/signup" className="btn-solid">Start tracking</a>
            <a href="#progression" className="btn-outline">See your progression</a>
          </div>
          <div className="trust-banner">
            <span className="trust-banner-mark" />
            <span className="trust-banner-text">Built by a lifter, not a marketing team.</span>
          </div>
        </div>

        <svg viewBox="0 0 240 200" className="dumbbell-svg" role="img" aria-label="Illustration of a hex dumbbell">
          <defs>
            <linearGradient id="headGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3d3f43" />
              <stop offset="55%" stopColor="#232427" />
              <stop offset="100%" stopColor="#141416" />
            </linearGradient>
            <linearGradient id="handleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9a9ca1" />
              <stop offset="50%" stopColor="#6b6d72" />
              <stop offset="100%" stopColor="#4a4c50" />
            </linearGradient>
          </defs>
          <polygon points="40,40 74,20 108,40 108,160 74,180 40,160" fill="url(#headGrad)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <polygon points="40,40 74,20 108,40 108,52 74,32 40,52" fill="#ffffff" opacity="0.05" />
          <ellipse cx="74" cy="100" rx="19" ry="19" fill="#0A0A0B" />
          <ellipse cx="74" cy="100" rx="19" ry="19" fill="none" stroke="var(--line-strong)" strokeWidth="1" />
          <rect x="100" y="88" width="40" height="24" fill="url(#handleGrad)" />
          <rect x="104" y="88" width="2" height="24" fill="#000" opacity="0.2" />
          <rect x="112" y="88" width="2" height="24" fill="#000" opacity="0.2" />
          <rect x="120" y="88" width="2" height="24" fill="#000" opacity="0.2" />
          <rect x="128" y="88" width="2" height="24" fill="#000" opacity="0.2" />
          <polygon points="132,40 166,20 200,40 200,160 166,180 132,160" fill="url(#headGrad)" stroke="var(--line-strong)" strokeWidth="1.5" />
          <polygon points="132,40 166,20 200,40 200,52 166,32 132,52" fill="#ffffff" opacity="0.05" />
          <ellipse cx="166" cy="100" rx="19" ry="19" fill="#0A0A0B" />
          <ellipse cx="166" cy="100" rx="19" ry="19" fill="none" stroke="var(--line-strong)" strokeWidth="1" />
          <text x="74" y="105" textAnchor="middle" className="num" fontSize="12" fill="var(--steel)" fontWeight="700">20</text>
          <text x="166" y="105" textAnchor="middle" className="num" fontSize="12" fill="var(--steel)" fontWeight="700">20</text>
        </svg>
      </section>

      <section id="progression" className="lp-graph-section">
        <div className="tick top" />
        <div className="tick bottom" />
        <div className="graph-header">
          <span className="graph-label"><span className="dot accent-dot" />Barbell back squat — working weight</span>
          <span className="num graph-meta">12 sessions · +37.5kg</span>
        </div>
        <ProgressionGraph />
        <div className="graph-legend">
          <span><span className="dot accent-dot" />Increase — hit 9+ reps</span>
          <span><span className="dot hold-dot" />Hold — 6-8 rep zone</span>
          <span><span className="dot down-dot" />Deload — dropped to 5</span>
        </div>
      </section>

      <section className="lp-stage-section">
        <h2>Wherever you're starting from</h2>
        <p className="section-sub">
          The onboarding asks what it needs and nothing else — training age, days per week,
          what you enjoy lifting. Then it builds the split and starts tracking from session one,
          whether that's your first or your thousandth.
        </p>
        <div className="stage-grid">
          <div className="stage-cell">
            <span className="eyebrow-mono">JUST STARTING</span>
            <p>Full-body splits only — every major muscle trained twice a week minimum, from day one.</p>
          </div>
          <div className="stage-cell">
            <span className="eyebrow-mono">UNDER 6 MONTHS</span>
            <p>Same 2× frequency rule, more exercise choice as you find what you actually enjoy running.</p>
          </div>
          <div className="stage-cell">
            <span className="eyebrow-mono">2+ YEARS</span>
            <p>Upper/lower, push/pull/legs, 6-day rotations — the same top-set logic, just more volume.</p>
          </div>
        </div>
      </section>

      <section className="lp-feature-grid">
        <div className="feature-card">
          <span className="eyebrow-mono">01</span>
          <h3>Per-exercise increments</h3>
          <p>2.5kg on a leg press is nothing. 2.5kg on a lateral raise is a 15% jump. Every movement gets its own step size.</p>
        </div>
        <div className="feature-card">
          <span className="eyebrow-mono">02</span>
          <h3>Top-set priority</h3>
          <p>Hit 9 on set one, fade to 5 on set three from fatigue — you still get the increase. Reads your best set, not your last one.</p>
        </div>
        <div className="feature-card">
          <span className="eyebrow-mono">03</span>
          <h3>Bodyweight has a ceiling</h3>
          <p>Pull-ups and dips track by reps. Hit 10 on a set and it flags the transition to weighted.</p>
        </div>
      </section>

      <section className="lp-calorie-section">
        <h2>Nutrition that moves with your day</h2>
        <p className="section-sub">Log an activity and today's target recalculates — not a static number you ignore by Wednesday.</p>
        <div className="calorie-card">
          <div className="calorie-total">
            <span className="eyebrow-mono">TODAY'S TARGET</span>
            <div className="calorie-big">2,540</div>
            <span className="num calorie-unit">kcal</span>
          </div>
          <div className="calorie-breakdown">
            <div className="calorie-row"><span>Base</span><span className="num">2,180</span></div>
            <div className="calorie-row"><span>Lifting · 55min, RPE 7</span><span className="num">+360</span></div>
            <div className="calorie-row calorie-row-total"><span>Total</span><span className="num">2,540</span></div>
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <div className="cta-glow" />
        <h2>Log the set. See the trend.</h2>
        <p>No free trial gimmicks. No credit card to look around.</p>
        <a href="/signup" className="btn-solid">Start tracking</a>
      </section>

      <footer className="lp-footer">IRONSET</footer>
    </div>
  );
}

function ProgressionGraph() {
  const pts: [number, number][] = [
    [40, 250], [118, 250], [196, 215], [274, 215], [352, 215],
    [430, 180], [508, 145], [586, 145], [664, 110], [742, 75], [820, 75], [870, 50],
  ];
  const weights = [100, 100, 105, 105, 105, 110, 117.5, 117.5, 125, 132.5, 132.5, 137.5];
  const actions = ["hold", "hold", "up", "hold", "hold", "up", "up", "hold", "up", "up", "hold", "up"];
  const colors: Record<string, string> = { up: "#3B82F6", hold: "#75777C", down: "#C97A54" };
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaPath = `${linePath} L870,300 L40,300 Z`;

  return (
    <svg viewBox="0 0 900 300" className="graph-svg" role="img"
      aria-label="Progression graph showing working weight rising from 100 to 137.5 kilograms over 12 sessions">
      <defs>
        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M30 0 L0 0 0 30" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
        </pattern>
        <linearGradient id="areafill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--steel-accent, #3B82F6)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--steel-accent, #3B82F6)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="900" height="300" fill="url(#grid)" />
      <line x1="0" y1="70" x2="900" y2="70" stroke="var(--line)" strokeWidth="1" />
      <line x1="0" y1="150" x2="900" y2="150" stroke="var(--line)" strokeWidth="1" />
      <line x1="0" y1="230" x2="900" y2="230" stroke="var(--line)" strokeWidth="1" />
      <text x="8" y="65" className="num" fontSize="10" fill="var(--steel-dim)">140kg</text>
      <text x="8" y="145" className="num" fontSize="10" fill="var(--steel-dim)">120kg</text>
      <text x="8" y="225" className="num" fontSize="10" fill="var(--steel-dim)">100kg</text>
      <path d={areaPath} fill="url(#areafill)" />
      <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="8" fill={colors[actions[i]]} opacity="0.18" />
          <circle cx={p[0]} cy={p[1]} r="4.5" fill={colors[actions[i]]} stroke="#0A0A0B" strokeWidth="1.5" />
          <title>{`Session ${i + 1}: ${weights[i]}kg — ${actions[i] === "up" ? "increased (9+ reps hit)" : "held (6-8 rep zone)"}`}</title>
        </g>
      ))}
    </svg>
  );
}
