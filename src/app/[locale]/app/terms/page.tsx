import TermsClient from '../../terms/TermsClient';

// Same content as /[locale]/terms, kept at this path because it's the URL
// registered in apple-app-site-association for the universal link. A thin
// re-export avoids duplicating the page (and drifting from it over time).
export default function Page() {
  return <TermsClient />;
}
