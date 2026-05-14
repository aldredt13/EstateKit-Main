import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="bg-white text-slate-900 antialiased min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <span className="text-brand font-black text-4xl tracking-tight mb-8">EstateKit</span>
      <h1 className="font-black text-6xl text-slate-200 mb-4">404</h1>
      <p className="text-slate-500 text-lg mb-8">This page doesn't exist.</p>
      <Link
        to="/"
        className="inline-block bg-brand text-white font-bold text-sm px-8 py-3 rounded uppercase tracking-wide"
      >
        Go Home
      </Link>
    </div>
  )
}
