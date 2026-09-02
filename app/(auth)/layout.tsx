export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center px-5 py-10"><div className="w-full max-w-[420px]">{children}</div></div>;
}
