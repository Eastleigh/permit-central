type Props = { searchParams: Promise<{ dev?: string }> };

export default async function CheckEmail({ searchParams }: Props) {
  const { dev } = await searchParams;
  return (
    <div className="card">
      <h1>Check your email</h1>
      <p>If that address has an account, we just sent a login link. It expires in 1 hour.</p>
      <p className="muted small">Not there? Check your spam folder.</p>
      {dev && (
        <p className="notice">
          Dev mode (no Resend key): <a href={dev}>click here to log in</a>
        </p>
      )}
    </div>
  );
}
