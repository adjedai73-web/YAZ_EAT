import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center texture-crumple bg-brand-900 px-4 text-center text-white">
      <div>
        <p className="font-display text-[8rem] font-extrabold leading-none text-sun-500">404</p>
        <h1 className="mt-2 text-2xl font-bold">Cette page n'existe pas</h1>
        <p className="mt-2 text-white/75">Le plat ou la page demandé a peut-être été retiré.</p>
        <Link href="/menu" className="mt-8 inline-flex h-12 items-center rounded-[0.875rem] bg-sun-500 px-6 font-semibold text-brand-950">Voir le menu</Link>
      </div>
    </main>
  );
}
