import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";

interface UrgencyBadgeProps {
  lastActivityAt: string | null;
}

const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ lastActivityAt }) => {
  if (!lastActivityAt) return null;

  const days = differenceInDays(new Date(), new Date(lastActivityAt));

  if (days <= 2) {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
        {days}d
      </Badge>
    );
  }

  if (days <= 5) {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
        {days}d
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
      {days}d
    </Badge>
  );
};

export default UrgencyBadge;
