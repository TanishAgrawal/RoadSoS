export default function LoadingSpinner() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="rounded-3xl bg-white px-6 py-8 text-center shadow-xl shadow-slate-200/60">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="mt-4 text-base font-semibold text-slate-700">Finding your location...</p>
        <p className="mt-1 text-sm text-slate-500">Checking GPS and nearby emergency services</p>
      </div>
    </div>
  )
}