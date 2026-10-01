import Image from 'next/image';
import Link from 'next/link';
import { INSTAGRAM_URL, TIKTOK_URL, type Locale } from '@/lib/site';
import { COMPETITIONS, competitionName } from '@/lib/competitions';
import {
  competitionPath,
  datePath,
  sectionPath,
  whereToWatchPath,
  type RouteLocale,
} from '@/lib/routes';

// Top competitions linked from every page: the crawl path to the hubs.
const FOOTER_COMPETITIONS = COMPETITIONS.slice(0, 7);

const T = {
  es: {
    leagues: 'Ligas', tools: 'Herramientas', golify: 'Golify',
    today: 'Partidos de hoy', pools: 'Quinielas por jornada', transfers: 'Fichajes',
    watch: 'Dónde ver', calendar: 'Calendario', downloads: 'Descargas',
    about: 'Nosotros', contact: 'Contacto', editorial: 'Política editorial', authors: 'Autores',
    privacy: 'Privacidad', terms: 'Términos', cookies: 'Cookies', ads: 'Publicidad',
    legal: '© 2026 Golify · Golify no transmite partidos ni ofrece apuestas.',
    lang: 'Idioma', follow: 'Síguenos',
  },
  pt: {
    leagues: 'Ligas', tools: 'Ferramentas', golify: 'Golify',
    today: 'Jogos de hoje', pools: 'Bolões por rodada', transfers: 'Transferências',
    watch: 'Onde assistir', calendar: 'Calendário', downloads: 'Downloads',
    about: 'Sobre nós', contact: 'Contato', editorial: 'Política editorial', authors: 'Autores',
    privacy: 'Privacidade', terms: 'Termos', cookies: 'Cookies', ads: 'Publicidade',
    legal: '© 2026 Golify · O Golify não transmite jogos nem oferece apostas.',
    lang: 'Idioma', follow: 'Siga-nos',
  },
  en: {
    leagues: 'Leagues', tools: 'Tools', golify: 'Golify',
    today: "Today's matches", pools: 'Pools by matchday', transfers: 'Transfers',
    watch: 'Where to watch', calendar: 'Calendar', downloads: 'Downloads',
    about: 'About', contact: 'Contact', editorial: 'Editorial policy', authors: 'Authors',
    privacy: 'Privacy', terms: 'Terms', cookies: 'Cookies', ads: 'Advertise',
    legal: '© 2026 Golify · Golify does not stream matches or offer betting.',
    lang: 'Language', follow: 'Follow us',
  },
} as const;

const LANGS: { code: RouteLocale; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
];

function Col({ title, links }: { title: string; links: { href: string; text: string }[] }) {
  return (
    <div>
      <h2 className="mb-3 font-display text-sm font-bold tracking-wide text-foreground uppercase">
        {title}
      </h2>
      <ul className="space-y-2 text-sm font-semibold text-muted-foreground">
        {links.map((x) => (
          <li key={x.href + x.text}>
            <Link href={x.href} className="transition-colors hover:text-foreground">
              {x.text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Shared footer. Server component; every link goes through the route builders.
export function SiteFooter({ locale }: { locale: Locale }) {
  const l = locale as RouteLocale;
  const t = T[l];
  // The date is only used to point at "the calendar": the server's UTC day is
  // fine for that, the destination page resolves the visitor's day itself.
  const today = new Date().toISOString().slice(0, 10);

  const leagues = FOOTER_COMPETITIONS.map((c) => ({
    href: competitionPath(l, c.id) ?? sectionPath('leagues', l),
    text: competitionName(c, l),
  }));
  const tools = [
    { href: sectionPath('today', l), text: t.today },
    { href: sectionPath('pool', l), text: t.pools },
    { href: sectionPath('transfers', l), text: t.transfers },
    { href: whereToWatchPath(l, 262) ?? sectionPath('whereToWatch', l), text: t.watch },
    { href: datePath(l, today), text: t.calendar },
    { href: sectionPath('downloads', l), text: t.downloads },
  ];
  const about = [
    { href: `/${l}/nosotros`, text: t.about },
    { href: sectionPath('contact', l), text: t.contact },
    { href: sectionPath('editorialPolicy', l), text: t.editorial },
    { href: sectionPath('author', l), text: t.authors },
    { href: sectionPath('privacy', l), text: t.privacy },
    { href: sectionPath('terms', l), text: t.terms },
    { href: sectionPath('cookies', l), text: t.cookies },
    { href: sectionPath('advertise', l), text: t.ads },
  ];

  return (
    <footer className="mx-auto max-w-6xl border-t border-border px-5 py-9 sm:px-8">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        <Col title={t.leagues} links={leagues} />
        <Col title={t.tools} links={tools} />
        <Col title={t.golify} links={about} />
        <div>
          <h2 className="mb-3 font-display text-sm font-bold tracking-wide text-foreground uppercase">
            {t.follow}
          </h2>
          <ul className="space-y-2 text-sm font-semibold text-muted-foreground">
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">Instagram</a>
            </li>
            <li>
              <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">TikTok</a>
            </li>
          </ul>
          <h2 className="mt-6 mb-3 font-display text-sm font-bold tracking-wide text-foreground uppercase">
            {t.lang}
          </h2>
          <ul className="space-y-2 text-sm font-semibold text-muted-foreground">
            {LANGS.map((x) => (
              <li key={x.code}>
                {/* Prefix links: the header switcher does the page-exact switch. */}
                <Link href={`/${x.code}`} hrefLang={x.code} className="transition-colors hover:text-foreground">
                  {x.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2.5 border-t border-border pt-6">
        <Image src="/icon.svg" alt="Golify" width={26} height={26} className="rounded-lg" />
        <span className="text-sm font-bold text-muted-foreground">{t.legal}</span>
      </div>
    </footer>
  );
}
