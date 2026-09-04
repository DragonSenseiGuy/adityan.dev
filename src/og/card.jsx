// The social card. Same palette and type as the site, laid out for 1200x630.
const INK = '#ededed';
const DIM = '#707070';
const LINE = '#262626';

// Long headlines step down rather than wrap into four lines.
const titleSize = (title) => (title.length < 34 ? 76 : title.length < 68 ? 60 : 48);

export function OgCard({ kicker, title, meta }) {
  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0a0a0a',
        color: INK,
        padding: '72px 80px',
        fontFamily: 'Geist',
      }}
    >
      <div style={{ display: 'flex', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.01em' }}>
        <span>adityan</span>
        <span style={{ color: DIM }}>.dev</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {kicker && (
          <div style={{ display: 'flex', fontFamily: 'Geist Mono', fontSize: '22px', color: DIM, marginBottom: '20px' }}>
            {kicker}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            fontSize: `${titleSize(title)}px`,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            maxWidth: '1000px',
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          borderTop: `1px solid ${LINE}`,
          paddingTop: '24px',
          fontFamily: 'Geist Mono',
          fontSize: '22px',
          color: DIM,
        }}
      >
        {meta}
      </div>
    </div>
  );
}
