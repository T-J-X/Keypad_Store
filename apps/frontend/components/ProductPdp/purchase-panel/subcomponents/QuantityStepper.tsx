type QuantityStepperProps = {
  quantity: number;
  maxQuantity: number;
  canPurchase: boolean;
  adding: boolean;
  buyingNow: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onInput: (value: string) => void;
  onBlur: () => void;
};

export default function QuantityStepper({
  quantity,
  maxQuantity,
  canPurchase,
  adding,
  buyingNow,
  onDecrease,
  onIncrease,
  onInput,
  onBlur,
}: QuantityStepperProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="font-semibold text-ink">Quantity</div>
      <div className="inline-flex h-9 items-stretch overflow-hidden rounded-full bg-white ring-1 ring-inset ring-neutral-200">
        <button
          type="button"
          onClick={onDecrease}
          className="grid w-9 place-items-center rounded-l-full rounded-r-none text-ink transition-colors hover:bg-black hover:text-white active:bg-neutral-900 active:text-white disabled:opacity-40"
          disabled={quantity <= 1 || adding || buyingNow || !canPurchase}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={String(quantity)}
          onChange={(event) => onInput(event.target.value)}
          onBlur={onBlur}
          className="w-10 bg-transparent text-center text-sm font-semibold tabular-nums text-ink outline-none"
          aria-label="Quantity"
        />
        <button
          type="button"
          onClick={onIncrease}
          className="grid w-9 place-items-center rounded-l-none rounded-r-full text-ink transition-colors hover:bg-black hover:text-white active:bg-neutral-900 active:text-white disabled:opacity-40"
          disabled={adding || buyingNow || !canPurchase || quantity >= maxQuantity}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}
