// The social cards. Same palette, type and contour backdrop as the site, laid
// out for 1200x630. Two shapes come out of here:
//
//   default — wordmark, kicker, title, meta rule, and the `a_` monogram
//             glowing on the right. Every page gets this one.
//   image   — the same left column with the post's picture filling the right.
//             Only used when a post declares one, so `image` stays optional.
import { fieldDataUri, seedFrom } from './field.js';

const BG = '#0a0a0a';
const INK = '#ededed';
const DIM = '#707070';
const MUTED = '#a1a1a1';
const LINE = '#262626';

const PANEL = 480; // width of the image column

// Long headlines step down rather than wrap into four lines.
const titleSize = (title, narrow) => {
  const [short, medium] = narrow ? [30, 60] : [34, 68];
  const sizes = narrow ? [52, 44, 36] : [76, 60, 48];
  return title.length < short ? sizes[0] : title.length < medium ? sizes[1] : sizes[2];
};

// A still frame of the hero shader, sitting behind everything at texture
// strength: present enough to be recognisably the site, never loud enough to
// fight the headline.
const Field = ({ seed, fadeX, fadeRight, intensity }) => (
  <img
    src={fieldDataUri({ seed, time: (seed % 89) / 5, fadeX, fadeRight, fadeY: [0.62, 1.0], fadeTop: 0.16, intensity })}
    width={1200}
    height={630}
    style={{ position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px' }}
  />
);

// The `a_` from the favicon, sitting in its own pool of light — the card's
// answer to a logo.
const Monogram = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '520px',
      height: '520px',
      backgroundImage:
        'radial-gradient(circle at 50% 50%, rgba(237,237,237,0.22) 0%, rgba(237,237,237,0.10) 26%, rgba(237,237,237,0.03) 46%, rgba(10,10,10,0) 68%)',
    }}
  >
    <div
      style={{
        display: 'flex',
        fontFamily: 'Geist Mono',
        fontSize: '150px',
        lineHeight: 1,
        color: INK,
        letterSpacing: '-0.06em',
      }}
    >
      a_
    </div>
  </div>
);

const Wordmark = () => (
  <div style={{ display: 'flex', fontSize: '26px', fontWeight: 600, letterSpacing: '-0.01em', color: INK }}>
    <span>adityan</span>
    <span style={{ color: DIM }}>.dev</span>
  </div>
);

const Frame = ({ children }) => (
  <div
    style={{
      position: 'relative',
      width: '1200px',
      height: '630px',
      display: 'flex',
      background: BG,
      color: INK,
      fontFamily: 'Geist',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

// Wide pictures are inset and framed rather than cropped to a tall slice;
// portrait and square ones bleed to the edges the way the reference does.
const ImagePanel = ({ image }) => {
  const inset = image.aspect > 1.2;
  const width = inset ? PANEL - 96 : PANEL;
  const height = inset ? Math.round(width / image.aspect) : 630;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${PANEL}px`,
        height: '630px',
        borderLeft: `1px solid ${LINE}`,
        backgroundImage: inset
          ? 'radial-gradient(circle at 50% 50%, rgba(237,237,237,0.10) 0%, rgba(10,10,10,0) 70%)'
          : 'none',
        overflow: 'hidden',
      }}
    >
      <img
        src={image.src}
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          objectFit: 'cover',
          borderRadius: inset ? '10px' : '0px',
          border: inset ? '1px solid rgba(237,237,237,0.12)' : 'none',
        }}
      />
    </div>
  );
};

export function OgCard({ kicker, title, description, meta, image }) {
  const seed = seedFrom(`${kicker || ''}${title}`);
  const narrow = Boolean(image);

  return (
    <Frame>
      <Field
        seed={seed}
        fadeX={narrow ? [0.16, 0.42] : [0.26, 0.84]}
        fadeRight={narrow ? [0.5, 0.6] : [0.92, 1.0]}
        intensity={narrow ? 0.34 : 0.38}
      />

      {!image && (
        <div style={{ position: 'absolute', top: '55px', left: '730px', display: 'flex' }}>
          <Monogram />
        </div>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: narrow ? `${1200 - PANEL}px` : '1200px',
          height: '630px',
          padding: narrow ? '60px 56px 60px 68px' : '68px 80px',
        }}
      >
        <Wordmark />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {kicker && (
            <div
              style={{
                display: 'flex',
                fontFamily: 'Geist Mono',
                fontSize: '19px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: DIM,
                marginBottom: '18px',
              }}
            >
              {kicker}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: `${titleSize(title, narrow)}px`,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              maxWidth: narrow ? '600px' : '680px',
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                display: 'flex',
                marginTop: '18px',
                fontSize: narrow ? '21px' : '25px',
                lineHeight: 1.45,
                color: MUTED,
                maxWidth: narrow ? '580px' : '660px',
              }}
            >
              {description}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            borderTop: `1px solid ${LINE}`,
            paddingTop: '20px',
            fontFamily: 'Geist Mono',
            fontSize: '19px',
            color: DIM,
          }}
        >
          {meta}
        </div>
      </div>

      {image && <ImagePanel image={image} />}
    </Frame>
  );
}
