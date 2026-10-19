import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../hooks/useLang';
import { cardClass, labelText } from '../lib/styles';

const T = {
  sv: {
    title: 'Integritet',
    subtitle: 'Vad pizzacalculator.se sparar, och hur du tar bort det.',
    intro:
      'Kalkylatorn och Party Mode fungerar utan konto. Allt du gör utan att logga in stannar i din egen webbläsare (localStorage) och skickas aldrig till oss.',
    googleTitle: 'Om du loggar in med Google',
    googleIntro: 'Vi tar emot och sparar bara:',
    googleItems: [
      'din e-postadress, så att du kan logga in (den visas aldrig för andra);',
      'pizzorna du skapar (namn, beskrivning, ingredienser och foto);',
      'degprotokoll du sparar (privata, syns bara för dig);',
      'betygen du ger, och eventuella anmälningar du skickar.',
    ],
    googleNever:
      'Vi ser aldrig ditt Google-lösenord, och vi använder inte dina uppgifter för reklam eller delar dem med någon.',
    shareTitle: 'Om du delar en pizza med communityn',
    shareBody:
      'Delade pizzor är offentliga: alla kan se foto, namn, beskrivning och ingredienser, tillsammans med smeknamnet du har valt. Ditt Google-namn visas aldrig, och din Google-profilbild bara om du själv slår på det under Konto. Andra kan betygsätta och kopiera pizzan. Enskilda betyg visas aldrig, bara snittet och antalet. Du kan sluta dela när som helst i Party Mode.',
    rulesTitle: 'Communityregler',
    rules: [
      'Dela pizzor, och foton som du själv har tagit eller har rätt att använda.',
      'Inget stötande, hatiskt eller explicit innehåll, ingen spam eller reklam, inga personuppgifter.',
      'Betygsätt ärligt. Anmäl det som bryter mot reglerna med Anmäl-länken på pizzan.',
    ],
    rulesHide: 'Moderatorer kan dölja pizzor som bryter mot reglerna.',
    storedTitle: 'Var det lagras',
    storedBody:
      'Konton och pizzor lagras hos Supabase, vårt personuppgiftsbiträde, på servrar inom EU. Inloggningen sköts av Google. Själva sidan ligger på GitHub Pages och sätter inga spårningscookies.',
    rightsTitle: 'Dina rättigheter',
    rightsBody:
      'Du kan se och ändra dina pizzor i Party Mode när som helst, och exportera dem som en fil. Du kan radera ditt konto och all dess data nedan. Det gäller direkt och kan inte ångras.',
    deleteTitle: 'Radera mitt konto och min data',
    deleteBody:
      'Detta raderar ditt konto och allt som sparats på det permanent: dina pizzor och foton (även delade), degprotokoll, betyg och anmälningar. Pizzor som bara finns på den här enheten påverkas inte.',
    deleteConfirm: 'Skriv RADERA för att bekräfta',
    deleteWord: 'RADERA',
    deleteButton: 'Radera konto',
    deleting: 'Raderar…',
    deleteError: 'Något gick fel och inget raderades. Försök igen, eller mejla oss.',
  },
  en: {
    title: 'Privacy',
    subtitle: 'What pizzacalculator.se stores, and how to remove it.',
    intro:
      'The calculator and Party Mode work without an account. Everything you do without signing in stays in your own browser (localStorage) and is never sent to us.',
    googleTitle: 'If you sign in with Google',
    googleIntro: 'We receive and store only:',
    googleItems: [
      'your email address, so you can sign in (it is never shown to others);',
      'the pizzas you create (name, description, ingredients and photo);',
      'dough logs you save (private, only visible to you);',
      'the star ratings you give, and any reports you send.',
    ],
    googleNever:
      "We never see your Google password, and we don't use your data for advertising or share it with anyone.",
    shareTitle: 'If you share a pizza with the community',
    shareBody:
      "Shared pizzas are public: anyone can see the photo, name, description and ingredients, together with the nickname you chose. Your Google name is never shown, and your Google profile picture only if you turn it on under Account. Others can rate and copy the pizza. Individual ratings are never shown, only the average and the number of ratings. You can stop sharing at any time in Party Mode.",
    rulesTitle: 'Community rules',
    rules: [
      'Share pizzas, and photos you took yourself or have the right to use.',
      'No offensive, hateful or explicit content, no spam or advertising, no personal information.',
      'Rate honestly. Report anything that breaks these rules with the Report link on the pizza.',
    ],
    rulesHide: 'Moderators may hide pizzas that break the rules.',
    storedTitle: 'Where it is stored',
    storedBody:
      'Accounts and pizzas are stored with Supabase, our data processor, on servers in the EU. Sign-in is handled by Google. The site itself is hosted on GitHub Pages and sets no tracking cookies.',
    rightsTitle: 'Your rights',
    rightsBody:
      'You can view and edit your pizzas in Party Mode at any time, and export them as a file. You can delete your account and all its data below. It takes effect immediately and cannot be undone.',
    deleteTitle: 'Delete my account and data',
    deleteBody:
      'This permanently deletes your account and everything saved to it: your pizzas and photos (including shared ones), dough logs, ratings and reports. Pizzas saved only on this device are not affected.',
    deleteConfirm: 'Type DELETE to confirm',
    deleteWord: 'DELETE',
    deleteButton: 'Delete account',
    deleting: 'Deleting…',
    deleteError: 'Something went wrong and nothing was deleted. Please try again, or email us.',
  },
} as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-dashed border-paper-400 pt-5 dark:border-char-500">
      <h2 className="mb-2 font-display text-xl font-bold text-ink dark:text-char-100">{title}</h2>
      <div className="space-y-2 text-sm leading-6 text-ink-soft dark:text-char-300">{children}</div>
    </section>
  );
}

/** Privacy policy + account deletion (GDPR). */
const PrivacyPage: React.FC = () => {
  const t = T[useLang()];
  const { enabled, user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      localStorage.removeItem('selectedPizzas');
      navigate('/');
    } catch (e) {
      console.error(e);
      setError(t.deleteError);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-display text-4xl font-bold text-ink sm:text-5xl dark:text-char-100">{t.title}</h1>
        <p className="font-display text-lg italic text-ink-muted dark:text-char-400">{t.subtitle}</p>
      </div>

      <div className={`${cardClass} space-y-5 p-5 sm:p-8`}>
        <p className="text-sm leading-6 text-ink-soft dark:text-char-300">{t.intro}</p>

        <Section title={t.googleTitle}>
          <p>{t.googleIntro}</p>
          <ul className="list-disc space-y-1 pl-5">
            {t.googleItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{t.googleNever}</p>
        </Section>

        <Section title={t.shareTitle}>
          <p>{t.shareBody}</p>
        </Section>

        <Section title={t.rulesTitle}>
          <ul className="list-disc space-y-1 pl-5">
            {t.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p>{t.rulesHide}</p>
        </Section>

        <Section title={t.storedTitle}>
          <p>{t.storedBody}</p>
        </Section>

        <Section title={t.rightsTitle}>
          <p>{t.rightsBody}</p>
        </Section>

        {enabled && user && (
          <Section title={t.deleteTitle}>
            <p>{t.deleteBody}</p>
            <label htmlFor="confirm-delete" className={`mt-3 block ${labelText}`}>
              {t.deleteConfirm}
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                id="confirm-delete"
                value={confirmText}
                autoComplete="off"
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-40 rounded-md border border-paper-400 bg-white/60 px-3 py-2 font-mono text-sm uppercase text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-char-500 dark:bg-char-900/60 dark:text-char-100"
              />
              <button
                type="button"
                disabled={confirmText.trim().toUpperCase() !== t.deleteWord || busy}
                onClick={handleDelete}
                className="rounded-full bg-brand-700 px-5 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper-50 transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? t.deleting : t.deleteButton}
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-2 font-display text-sm italic text-brand-700 dark:text-brand-300">
                {error}
              </p>
            )}
          </Section>
        )}
      </div>
    </div>
  );
};

export default PrivacyPage;
