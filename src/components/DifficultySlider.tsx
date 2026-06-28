import React from "react";

interface Props {
  /** Difficulty values ordered easy → hard. */
  options: readonly string[];
  /** Currently selected value (must be one of `options`). */
  value: string;
  onChange: (value: string) => void;
  /** Optional display labels keyed by option value. */
  labels?: Record<string, string>;
  label?: string;
  /** Optional accent color (themes the slider + value text). */
  accent?: string;
  id?: string;
}

/**
 * A reusable Easy → Hard difficulty slider. Drag the range or tap a tick
 * label to set the difficulty. Works with any ordered list of string values.
 */
export default function DifficultySlider({
  options,
  value,
  onChange,
  labels,
  label = "Difficulty",
  accent,
  id,
}: Props) {
  const index = Math.max(0, options.indexOf(value));
  const display = (v: string) =>
    labels?.[v] ?? v.charAt(0).toUpperCase() + v.slice(1);
  const accentStyle = accent ? ({ accentColor: accent } as React.CSSProperties) : undefined;

  return (
    <div className="diff-slider">
      <div className="diff-slider-head">
        <span className="diff-slider-label">{label}</span>
        <span className="diff-slider-value" style={accent ? { color: accent } : undefined}>
          {display(value)}
        </span>
      </div>
      <input
        id={id}
        className="diff-slider-range"
        type="range"
        min={0}
        max={options.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(options[Number(e.target.value)])}
        style={accentStyle}
        aria-label={label}
      />
      <div className="diff-slider-ticks">
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            className={`diff-tick${opt === value ? " active" : ""}`}
            onClick={() => onChange(opt)}
          >
            {display(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}
