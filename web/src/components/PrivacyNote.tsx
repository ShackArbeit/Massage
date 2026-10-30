const CONTACT = import.meta.env.VITE_CONTACT_EMAIL || import.meta.env.VITE_ADMIN_EMAIL;

export default function PrivacyNote() {
  return (
    <footer className="mx-auto max-w-[720px] px-4 pt-8 pb-4 text-xs leading-relaxed text-stone-500">
      <p className="font-medium text-stone-600">隱私聲明 · Datenschutzhinweis</p>
      <p className="mt-1">
        您的資料僅由 Shack 保存，用於德國／奧地利職業培訓（Ausbildung）申請之佐證，並將永久保存。如需查閱或刪除您的資料，請來信{" "}
        <a href={`mailto:${CONTACT}`} className="underline">
          {CONTACT}
        </a>
        。
      </p>
      <p lang="de" className="mt-1">
        Ihre Angaben werden ausschließlich von Shack gespeichert und als Nachweis für eine Ausbildungsbewerbung in
        Deutschland bzw. Österreich verwendet. Die Daten werden dauerhaft gespeichert. Für Auskunft oder Löschung
        schreiben Sie bitte an{" "}
        <a href={`mailto:${CONTACT}`} className="underline">
          {CONTACT}
        </a>
        .
      </p>
    </footer>
  );
}
