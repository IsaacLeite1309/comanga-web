export function CatalogErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="max-w-lg rounded-lg border border-red-300/30 bg-card px-4 py-3 text-center text-sm font-medium text-red-200 [overflow-wrap:anywhere] lg:hidden">
      {message}
    </p>
  );
}
