import Link from "next/link";
import { requestLogin } from "../actions";

type Props = { searchParams: Promise<{ expired?: string }> };

export default async function Login({ searchParams }: Props) {
  const { expired } = await searchParams;
  return (
    <form action={requestLogin} className="card">
      <h1>Log in</h1>
      {expired && <p className="error">That login link has expired. Enter your email for a new one.</p>}
      <label className="field"><span>Email</span><input type="email" name="email" autoComplete="email" required /></label>
      <button className="btn" type="submit">Email me a login link</button>
      <p className="muted small" style={{ marginTop: 12 }}>New here? <Link href="/signup">Sign up</Link></p>
    </form>
  );
}
