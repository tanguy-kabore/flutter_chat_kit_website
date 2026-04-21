export default function FlagBF({ size = 16 }) {
  return (
    <svg
      width={size}
      height={(size * 2) / 3}
      viewBox="0 0 450 300"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '2px', display: 'inline-block', flexShrink: 0 }}
    >
      {/* Red stripe (top half) */}
      <rect x="0" y="0" width="450" height="150" fill="#EF2B2D" />
      {/* Green stripe (bottom half) */}
      <rect x="0" y="150" width="450" height="150" fill="#009E49" />
      {/* Yellow five-point star centered */}
      <polygon
        points="225,95 237,130 274,130 244,152 255,187 225,165 195,187 206,152 176,130 213,130"
        fill="#FCD116"
      />
    </svg>
  );
}
