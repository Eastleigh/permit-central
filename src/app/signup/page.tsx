import { TradePicker, ZipPicker } from "@/components/Pickers";
import { coveredZips } from "@/lib/permits";
import { signup } from "../actions";

const ERRORS: Record<string, string> = {
  email: "Please enter a valid email.",
  trade: "Pick at least one trade.",
  zip: "Pick at least one ZIP code.",
};

type Props = { searchParams: Promise<{ zip?: string; error?: string }> };

export default async function Signup({ searchParams }: Props) {
  const { zip, error } = await searchParams;
  const zips = await coveredZips();

  return (
    <form action={signup} className="card">
      <h1>Sign up</h1>
      {error && ERRORS[error] && <p className="error">{ERRORS[error]}</p>}
      <label className="field"><span>Email</span><input type="email" name="email" autoComplete="email" required /></label>
      <label className="field"><span>Business name <span className="muted small">(optional)</span></span><input type="text" name="business" autoComplete="organization" /></label>
      <p><b>Your trade</b></p>
      <TradePicker selected={[]} />
      <p><b>Your ZIP codes</b> <span className="muted small">— tap all that you serve</span></p>
      <ZipPicker zips={zips} selected={zip ? [zip] : []} />
      <button className="btn" type="submit">Continue</button>
      <p className="muted small" style={{ marginTop: 12 }}>We'll email you a link to log in — no password needed.</p>
    </form>
  );
}
