import { Link } from 'react-router-dom'

export default function PageNotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-6 text-foreground">
      <div className="max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-3 text-sm font-medium text-muted-foreground">404</div>
        <h1 className="text-3xl font-bold">Pagina nu a fost găsită</h1>
        <p className="mt-3 text-muted-foreground">
          Ruta pe care ai deschis-o nu există sau a fost mutată.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground"
        >
          Înapoi la homepage
        </Link>
      </div>
    </div>
  )
}