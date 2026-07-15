import { useEffect, useState } from 'react';

/**
 * TwitchStreamBanner
 * Fixed bottom-left corner embed of the t_obl_i Twitch stream.
 * Mirrors the approach in tobli-stream-embed.html:
 *   - 171×38 px window cropped from a 171×96 px iframe (16:9 at this width)
 *   - autoplay + muted so browsers allow it without interaction
 *   - pointer-events: none so it never captures clicks meant for the page
 */
export default function TwitchStreamBanner() {
  const [parent, setParent] = useState('localhost');

  useEffect(() => {
    // Twitch requires the parent domain of the page embedding the player.
    setParent(window.location.hostname || 'localhost');
  }, []);

  const src = `https://player.twitch.tv/?channel=t_obl_i&parent=${parent}&autoplay=true&muted=true`;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 9999,
        width: '171px',
        height: '38px',
        background: '#111',
        border: '1px solid #000',
        overflow: 'hidden',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
      }}
    >
      <iframe
        src={src}
        title="t_obl_i live stream"
        allowFullScreen
        style={{
          position: 'absolute',
          top: '-29px',   /* vertically centres the crop on the video */
          left: 0,
          width: '171px',
          height: '96px', /* full 16:9 height for this width, cropped to 38px */
          border: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
