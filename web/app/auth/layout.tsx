export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-quantum-900/20 to-gray-950 px-4">
      <div className="max-w-md w-full card-quantum p-8">
        {children}
      </div>
    </div>
  )
}
