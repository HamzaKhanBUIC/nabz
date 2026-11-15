/**
 * Google Material Symbols icon.
 *
 * Icons are rendered as ligature text using the self-hosted static font
 * instances declared in `app/globals.css`:
 *   - Outlined = default / inactive
 *   - Filled   = active nav item, selected choice, health status, emergency
 *
 * Per icons.md an icon is always shown next to a text label, so the glyph is
 * hidden from assistive technology unless `label` is supplied.
 *
 * @param {string} name  Material Symbols ligature, e.g. "home"
 * @param {boolean} filled  Use the Filled instance
 * @param {number} [size]  Font size in px (icons scale with it)
 */
export default function Icon({
  name,
  filled = false,
  size,
  className = "",
  label,
  style,
  ...rest
}) {
  return (
    <span
      className={`${filled ? "ms-filled" : "ms"} ${className}`}
      style={{ ...(size ? { fontSize: `${size}px` } : null), ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {name}
    </span>
  );
}
