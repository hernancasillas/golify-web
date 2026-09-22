// Kickoff times are rendered on the server, where the timezone is UTC. Printing
// `toLocaleString(locale)` there and calling it "your local time" is simply
// wrong — a match at 19:00 UTC reads 19:00 to a visitor in São Paulo who will
// actually watch it at 16:00.
//
// So the server renders the UTC value, clearly labelled, inside a <time> with
// the machine-readable instant, and a single inline script rewrites those
// elements in the visitor's own timezone before they read the page. Crawlers
// get a valid, unambiguous time either way, and there is no client state
// involved (the repo's lint rules reject setState inside an effect).

type Style = 'full' | 'time';

export function LocalTime({
  iso,
  locale,
  style = 'full',
}: {
  iso: string;
  locale: string;
  /** `full` prints weekday, date and time; `time` prints just the clock. */
  style?: Style;
}) {
  const date = new Date(iso);
  const text =
    style === 'time'
      ? `${date.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        })} UTC`
      : `${date.toLocaleString(locale, {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'UTC',
        })} UTC`;

  return (
    <time dateTime={iso} data-local-time={style} suppressHydrationWarning>
      {text}
    </time>
  );
}

/** Include once per page that renders <LocalTime>. */
export function LocalTimeScript({ locale }: { locale: string }) {
  // Runs after the document is parsed: placed in the page head/top, an
  // immediate pass would find none of the <time> elements yet.
  const js = `(function(){function run(){try{var n=document.querySelectorAll('time[data-local-time]');for(var i=0;i<n.length;i++){var e=n[i];var d=new Date(e.getAttribute('datetime'));if(isNaN(+d))continue;var s=e.getAttribute('data-local-time')==='time'?d.toLocaleTimeString(${JSON.stringify(
    locale,
  )},{hour:'2-digit',minute:'2-digit'}):d.toLocaleString(${JSON.stringify(
    locale,
  )},{dateStyle:'full',timeStyle:'short'});e.textContent=s;}}catch(_){}}\nif(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run);}else{run();}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
