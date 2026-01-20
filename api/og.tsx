import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'DragonSenseiGuy';
  const description = searchParams.get('description') || '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #2a1a10 0%, #4a3020 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              color: '#DFAE79',
              fontWeight: '600',
            }}
          >
            DragonSenseiGuy
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#EBE3F0',
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: '28px',
                color: '#DDA080',
                lineHeight: 1.4,
              }}
            >
              {description}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              color: '#DFAE79',
              opacity: 0.7,
            }}
          >
            dragonsenseiguy.dev
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#DFAE79',
            }}
          >
            ✦ ✧ ✦
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
