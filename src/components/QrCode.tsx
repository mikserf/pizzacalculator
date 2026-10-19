import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

interface QrCodeProps {
  value: string;
  /** Accessible name, e.g. "QR code: opens this recipe". */
  label: string;
  className?: string;
}

const QUIET_ZONE = 2; // modules of light margin around the code

/**
 * QR code as a single crisp SVG path (sharp on screen and in print). Always dark
 * modules on a light square: many phone cameras can't read inverted codes.
 */
const QrCode = ({ value, label, className }: QrCodeProps) => {
  const { path, size } = useMemo(() => {
    const qr = qrcode(0, 'M'); // auto size, ~15 % error correction (survives a smudge)
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (qr.isDark(row, col)) d += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
      }
    }
    return { path: d, size: n + QUIET_ZONE * 2 };
  }, [value]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} rx={1} fill="#F7EEDC" />
      <path d={path} fill="#2B2622" />
    </svg>
  );
};

export default QrCode;
