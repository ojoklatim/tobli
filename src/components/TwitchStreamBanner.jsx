import { useEffect, useState } from 'react';

/**
 * TwitchStreamBanner
 * 
 * Renders the t_obl_i Twitch stream at exactly 400×300 (Twitch minimum dimensions).
 * Positioned so only PEEK_H pixels are visible above the bottom viewport edge,
 * sitting in the clear zone below the recenter button (bottom-32 = 128px).
 * 
 * - Full 400×300 satisfies Twitch ToS minimum size requirement
 * - No page element obscures it — only the viewport boundary clips it
 * - pointer-events: none so map taps and gestures pass through
 * - Only renders on the home/map page
 * - On mobile, browser requires a user interaction before autoplay fires,
 *   so any map touch (scroll, tap) acts as that interaction
 */

const EMBED_W = 400;   // Twitch minimum width
const EMBED_H = 300;   // Twitch minimum height
const PEEK_H  = 20;    // px visible above bottom edge (25% of original 80px)

export default function TwitchStreamBanner() {
  const [parent, setParent] = useState('localhost');

  useEffect(() => {
    setParent(window.location.hostname || 'localhost');
  }, []);

  const src = `https://player.twitch.tv/?channel=t_obl_i&parent=${parent}&autoplay=true&muted=true`;

  return (
    <div
      style={{
        position : 'fixed',
        bottom   : -(EMBED_H - PEEK_H), // -220px → 80px peeks above viewport bottom
        left     : '50%',
        transform: 'translateX(-50%)',
        width    : EMBED_W,
        height   : EMBED_H,
        zIndex   : 500,           // above map tiles, below popups (z-[1000]+)
        pointerEvents: 'none',    // map taps and gestures pass through
      }}
    >
      <iframe
        src={src}
        title="TOBLI Live"
        width={EMBED_W}
        height={EMBED_H}
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{ border: 'none', display: 'block' }}
      />
    </div>
  );
}
