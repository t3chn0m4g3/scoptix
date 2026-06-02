import type { SummarySourceSlice } from "@/lib/scan-summary";
import {
  DonutCircleClip,
  DonutTexturedSegment,
  DonutWaterPattern,
  donutClipPathId,
  donutTexturePatternId,
} from "@/components/scans/donut-chart-texture";

const SIZE = 160;
const CX = 80;
const CY = 80;
const OUTER_R = 80;

/** Inner radius: larger value = thinner ring (tangkai). */
const RING_INNER = {
  default: 48,
  thin: 54,
} as const;

const TEXTURE_PATTERN_ID = donutTexturePatternId("scx-donut");
const CLIP_PATH_ID = donutClipPathId("scx-donut");

function polar(r: number, degFromTop: number) {
  const rad = ((degFromTop - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function donutSegmentPath(startDeg: number, endDeg: number, innerR: number) {
  const sweep = endDeg - startDeg;
  const large = sweep > 180 ? 1 : 0;
  const o1 = polar(OUTER_R, startDeg);
  const o2 = polar(OUTER_R, endDeg);
  const i2 = polar(innerR, endDeg);
  const i1 = polar(innerR, startDeg);
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function centerInsetPercent(innerR: number) {
  return `${((OUTER_R - innerR) / SIZE) * 100}%`;
}

const CHART_SIZE = {
  md: { box: "size-40", total: "text-lg" },
  sm: { box: "size-36", total: "text-base" },
} as const;

export function AccentDonutChart({
  slices,
  total,
  centerLabel,
  ring = "default",
  size = "md",
  texture = false,
}: {
  slices: SummarySourceSlice[];
  total: number;
  centerLabel: string;
  /** `thin` = narrower ring; outer diameter unchanged. */
  ring?: keyof typeof RING_INNER;
  size?: keyof typeof CHART_SIZE;
  /** Soft ripple overlay on ring segments. */
  texture?: boolean;
}) {
  const innerR = RING_INNER[ring];
  const dim = CHART_SIZE[size];

  let cursor = 0;
  const segments = slices.map((slice) => {
    const start = cursor;
    cursor += slice.percent;
    const startDeg = (start / 100) * 360;
    let endDeg = (cursor / 100) * 360;
    if (endDeg - startDeg >= 359.99) endDeg = startDeg + 359.99;
    return {
      key: slice.label,
      path: donutSegmentPath(startDeg, endDeg, innerR),
      fill: slice.color,
    };
  });

  return (
    <div
      className={[
        "relative shrink-0 rounded-full shadow-[0_2px_8px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]",
        dim.box,
      ].join(" ")}
      role="img"
      aria-label={`${centerLabel}: ${slices.map((s) => `${s.label} ${s.percent}%`).join(", ")}`}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full" aria-hidden>
        <defs>
          <DonutCircleClip id={CLIP_PATH_ID} />
          {texture ? <DonutWaterPattern id={TEXTURE_PATTERN_ID} /> : null}
        </defs>
        <g clipPath={`url(#${CLIP_PATH_ID})`}>
          {segments.map((seg) => (
            <g key={seg.key}>
              {texture ? (
                <DonutTexturedSegment
                  path={seg.path}
                  fill={seg.fill}
                  patternId={TEXTURE_PATTERN_ID}
                />
              ) : (
                <path d={seg.path} fill={seg.fill} />
              )}
            </g>
          ))}
        </g>
      </svg>
      <div
        className="scx-donut-center absolute flex flex-col items-center justify-center rounded-full bg-lift"
        style={{ inset: centerInsetPercent(innerR) }}
      >
        <span className={[dim.total, "font-bold leading-none text-cream tabular-nums"].join(" ")}>
          {total.toLocaleString()}
        </span>
        <span className="mt-0.5 text-[10px] font-medium text-muted">{centerLabel}</span>
      </div>
    </div>
  );
}
