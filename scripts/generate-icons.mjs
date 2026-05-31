// Generates PNG icons using raw SVG → data URI approach
// Writes valid SVG files that Vite/PWA can serve as icons
import { writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

function svgIcon(size) {
  const r = Math.round(size * 0.18)
  const cx = size / 2
  const cy = size / 2
  const radius = Math.round(size * 0.32)
  const strokeW = Math.round(size * 0.1)
  // Arc from 54° to 306° (large arc, leaving gap on right)
  const startAngle = 54 * Math.PI / 180
  const endAngle   = 306 * Math.PI / 180
  const x1 = cx + radius * Math.cos(startAngle)
  const y1 = cy + radius * Math.sin(startAngle)
  const x2 = cx + radius * Math.cos(endAngle)
  const y2 = cy + radius * Math.sin(endAngle)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#1e3a8a"/>
  <path d="M${x1.toFixed(1)},${y1.toFixed(1)} A${radius},${radius} 0 1,0 ${x2.toFixed(1)},${y2.toFixed(1)}"
    fill="none" stroke="#ffffff" stroke-width="${strokeW}" stroke-linecap="round"/>
</svg>`
}

writeFileSync(resolve(__dirname, "../public/icons/icon-192.svg"), svgIcon(192))
writeFileSync(resolve(__dirname, "../public/icons/icon-512.svg"), svgIcon(512))
console.log("SVG icons generated ✓")
