import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Props = {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function PinPad({ value, onChange, onComplete, disabled, autoFocus }: Props) {
  return (
    <InputOTP
      maxLength={4}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      autoFocus={autoFocus}
      inputMode="numeric"
      pattern="[0-9]*"
    >
      <InputOTPGroup className="mx-auto gap-3">
        {[0, 1, 2, 3].map((i) => (
          <InputOTPSlot
            key={i}
            index={i}
            className="h-14 w-14 rounded-xl border-2 text-2xl font-semibold"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
