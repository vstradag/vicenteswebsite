import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/publications", label: "Publications" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
  { href: "/demo", label: "Demo" },
] as const;

export function Navigation() {
  return (
    <header className="border-b border-stone-700 bg-[#0b080c]">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4" aria-label="Main navigation">
        <Link href="/" className="font-semibold text-[#eae5ec] hover:text-[#c2a4ff] transition-colors">
          Vicente Estrada Gonzalez
        </Link>
        <ul className="flex flex-wrap gap-6">
          {navItems.filter((item) => item.href !== "/").map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-stone-400 hover:text-[#c2a4ff] transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
