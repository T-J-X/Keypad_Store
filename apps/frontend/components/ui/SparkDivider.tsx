import { cn } from '../../lib/utils';

type SparkDividerProps = {
  className?: string;
};

export default function SparkDivider({ className }: SparkDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-[2px] overflow-hidden bg-transparent before:absolute before:left-1/2 before:top-0 before:h-[2px] before:w-[140%] before:-translate-x-1/2 before:content-[''] before:bg-[linear-gradient(90deg,rgba(125,211,252,0)_0%,rgba(125,211,252,0.03)_14%,rgba(125,211,252,0.1)_30%,rgba(224,242,254,0.28)_50%,rgba(125,211,252,0.1)_70%,rgba(125,211,252,0.03)_86%,rgba(125,211,252,0)_100%)] before:shadow-[0_0_14px_1px_rgba(96,165,250,0.22),0_0_30px_2px_rgba(56,189,248,0.1)] after:absolute after:left-1/2 after:top-[-4px] after:h-4 after:w-[160%] after:-translate-x-1/2 after:content-[''] after:bg-[radial-gradient(82%_100%_at_50%_0%,rgba(125,211,252,0.22)_0%,rgba(125,211,252,0.09)_44%,rgba(125,211,252,0.03)_76%,rgba(125,211,252,0)_100%)]",
        className,
      )}
    >
      <div className="absolute left-1/2 top-[-1px] h-[2px] w-[132%] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,rgba(224,242,254,0)_0%,rgba(191,219,254,0.05)_8%,rgba(191,219,254,0.16)_20%,rgba(224,242,254,0.44)_36%,rgba(224,242,254,0.9)_50%,rgba(224,242,254,0.44)_64%,rgba(191,219,254,0.16)_80%,rgba(191,219,254,0.05)_92%,rgba(224,242,254,0)_100%)] shadow-[0_0_20px_3px_rgba(125,211,252,0.34)]" />
    </div>
  );
}
