import { Separator } from "@/components/ui/separator";

export default function Impressum() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 min-h-screen bg-background" style={{ paddingTop: "calc(1.5rem + var(--safe-area-top, 0px))" }}>
      <div className="space-y-2 pb-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Impressum</h1>
          <p className="text-sm text-muted-foreground">Angaben gemäß § 5 TMG</p>
        </div>

        <Separator />

        <div className="space-y-6 text-sm">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Verantwortlich</h2>
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p className="font-medium">Kerim Ismail</p>
              <p>(handelnd als KBlanks, Einzelunternehmen)</p>
              <p>Im Kassemänneken 5</p>
              <p>46325 Borken (Weseke)</p>
              <p>Deutschland</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Kontakt</h2>
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p>E-Mail: MCKerim@gmx.de</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Inhaltlich verantwortlich</h2>
            <p>Kerim Ismail (Anschrift wie oben)</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
              bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
