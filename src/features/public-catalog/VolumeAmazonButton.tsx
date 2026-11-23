export function VolumeAmazonButton({ affiliateLink }: { affiliateLink?: string | null }) {
  if (affiliateLink) {
    return (
      <a href={affiliateLink} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#ff9900]/45 bg-white px-4 text-sm font-semibold leading-none text-black transition-colors hover:border-[#ff9900] hover:bg-[#fffaf3]">
        Comprar na <img src="/amazon-logo.svg" alt="Amazon" className="h-6 w-6 object-contain" />
      </a>
    );
  }

  return (
    <div className="relative mt-3 overflow-hidden rounded-lg">
      <button type="button" disabled className="inline-flex h-10 w-full items-center justify-center gap-2 border border-[#ff9900]/25 bg-white/45 px-4 text-sm font-semibold leading-none text-background/70">
        Comprar na <img src="/amazon-logo.svg" alt="Amazon" className="h-6 w-6 object-contain opacity-55" />
      </button>
      <div className="pointer-events-none absolute left-[5%] top-1/2 flex h-8 w-[90%] -translate-y-1/2 rotate-[4deg] items-center justify-center gap-1 whitespace-nowrap bg-red-500 px-1 text-sm font-bold leading-none tracking-wide text-white shadow-sm shadow-black/30">
        Indisponível na <img src="/amazon-logo.svg" alt="" className="h-6 w-6 shrink-0 object-contain brightness-0 invert" />
      </div>
    </div>
  );
}
