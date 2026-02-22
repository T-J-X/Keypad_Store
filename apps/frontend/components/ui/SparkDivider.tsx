import { cn } from '../../lib/utils';
import { Separator } from './separator';

type SparkDividerProps = {
  className?: string;
};

export default function SparkDivider({ className }: SparkDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-6 overflow-hidden bg-transparent [mask-image:linear-gradient(90deg,transparent_0%,black_11%,black_89%,transparent_100%)] [-webkit-mask-image:linear-gradient(90deg,transparent_0%,black_11%,black_89%,transparent_100%)] before:absolute before:left-1/2 before:top-0 before:h-[2px] before:w-[140%] before:-translate-x-1/2 before:content-[''] before:bg-[linear-gradient(90deg,rgba(56,189,248,0.02)_0%,rgba(56,189,248,0.06)_16%,rgba(56,189,248,0.18)_34%,rgba(96,165,250,0.52)_50%,rgba(56,189,248,0.18)_66%,rgba(56,189,248,0.06)_84%,rgba(56,189,248,0.02)_100%)] before:shadow-[0_0_12px_1px_rgba(56,189,248,0.28),0_0_28px_4px_rgba(56,189,248,0.14)] after:absolute after:left-1/2 after:top-[-5px] after:h-6 after:w-[155%] after:-translate-x-1/2 after:content-[''] after:bg-[radial-gradient(74%_100%_at_50%_0%,rgba(56,189,248,0.24)_0%,rgba(56,189,248,0.11)_46%,rgba(56,189,248,0.035)_74%,rgba(56,189,248,0)_100%)]",
        className,
      )}
    >
      <Separator className="absolute left-1/2 top-[-1px] h-[2px] w-[130%] -translate-x-1/2 rounded-full border-0 bg-[linear-gradient(90deg,rgba(125,211,252,0)_0%,rgba(56,189,248,0.06)_10%,rgba(56,189,248,0.22)_26%,rgba(96,165,250,0.56)_40%,rgba(125,211,252,0.82)_50%,rgba(96,165,250,0.56)_60%,rgba(56,189,248,0.22)_74%,rgba(56,189,248,0.06)_90%,rgba(125,211,252,0)_100%)] shadow-[0_0_18px_3px_rgba(56,189,248,0.38)]" />
    </div>
  );
}
