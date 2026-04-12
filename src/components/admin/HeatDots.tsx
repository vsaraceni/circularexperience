import React from "react";
import { cn } from "@/lib/utils";

const HEAT_COLORS = ["#F4A736", "#E65100", "#D32F2F"];
const EMPTY_COLOR = "#D1D5DB";

interface HeatDotsProps {
  value: number | null | undefined;
  onChange?: (value: number | null) => void;
  size?: "sm" | "md";
}

const HeatDots: React.FC<HeatDotsProps> = ({ value, onChange, size = "sm" }) => {
  const dotSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  const handleClick = (dotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onChange) return;
    const newValue = dotIndex + 1;
    // If clicking the same level, toggle off (set to null)
    onChange(value === newValue ? null : newValue);
  };

  return (
    <div className={cn("inline-flex items-center", gap)}>
      {[0, 1, 2].map((i) => {
        const filled = value != null && i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={!onChange}
            onClick={(e) => handleClick(i, e)}
            className={cn(
              "rounded-full transition-all shrink-0",
              dotSize,
              onChange ? "cursor-pointer hover:scale-125" : "cursor-default"
            )}
            style={{
              backgroundColor: filled ? HEAT_COLORS[i] : EMPTY_COLOR,
              opacity: filled ? 1 : 0.4,
            }}
            title={onChange ? `Calor ${i + 1}` : undefined}
          />
        );
      })}
    </div>
  );
};

export default HeatDots;
