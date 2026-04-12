import React from "react";
import { cn } from "@/lib/utils";
import { Snowflake } from "lucide-react";

const HEAT_COLORS = ["#F4A736", "#E65100", "#D32F2F"];
const EMPTY_COLOR = "#D1D5DB";
const COLD_COLOR = "#42A5F5";

interface HeatDotsProps {
  value: number | null | undefined;
  onChange?: (value: number | null) => void;
  size?: "sm" | "md";
}

const HeatDots: React.FC<HeatDotsProps> = ({ value, onChange, size = "sm" }) => {
  const dotSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const iconSize = size === "sm" ? 12 : 16;
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  const isCold = value === 0;

  const handleSnowflakeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onChange) return;
    onChange(isCold ? null : 0);
  };

  const handleDotClick = (dotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onChange) return;
    const newValue = dotIndex + 1;
    onChange(value === newValue ? null : newValue);
  };

  return (
    <div className={cn("inline-flex items-center", gap)}>
      <button
        type="button"
        disabled={!onChange}
        onClick={handleSnowflakeClick}
        className={cn(
          "shrink-0 transition-all",
          onChange ? "cursor-pointer hover:scale-125" : "cursor-default"
        )}
        title={onChange ? "Frio" : undefined}
      >
        <Snowflake
          size={iconSize}
          color={isCold ? COLD_COLOR : EMPTY_COLOR}
          strokeWidth={isCold ? 2.5 : 1.5}
          style={{ opacity: isCold ? 1 : 0.4 }}
        />
      </button>
      {[0, 1, 2].map((i) => {
        const filled = value != null && value > 0 && i < value;
        return (
          <button
            key={i}
            type="button"
            disabled={!onChange}
            onClick={(e) => handleDotClick(i, e)}
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
