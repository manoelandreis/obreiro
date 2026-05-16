import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";

const STORAGE_KEY = "cookie_consent_v1";

type Preferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = {
  preferences: Preferences;
  timestamp: string;
  version: 1;
};

const defaultPrefs: Preferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function loadConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredConsent) : null;
  } catch {
    return null;
  }
}

function saveConsent(preferences: Preferences) {
  const data: StoredConsent = {
    preferences,
    timestamp: new Date().toISOString(),
    version: 1,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("cookie-consent-updated", { detail: data }));
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);

  useEffect(() => {
    const existing = loadConsent();
    if (!existing) {
      setOpen(true);
    } else {
      setPrefs(existing.preferences);
    }
    const handler = () => setOpen(true);
    window.addEventListener("open-cookie-preferences", handler);
    return () => window.removeEventListener("open-cookie-preferences", handler);
  }, []);

  const acceptAll = () => {
    const all: Preferences = { necessary: true, analytics: true, marketing: true };
    setPrefs(all);
    saveConsent(all);
    setOpen(false);
  };

  const rejectAll = () => {
    saveConsent(defaultPrefs);
    setPrefs(defaultPrefs);
    setOpen(false);
  };

  const savePrefs = () => {
    saveConsent(prefs);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card shadow-elegant">
        <div className="flex items-start gap-3 p-5 sm:p-6">
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground font-heading">
                A sua privacidade é importante
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Usamos cookies para garantir o funcionamento do site e, com a sua autorização, para
                medir o desempenho. Pode aceitar tudo, rejeitar opcionais ou personalizar.{" "}
                <Link to="/privacidade" className="underline underline-offset-2 hover:text-foreground">
                  Saber mais
                </Link>
                .
              </p>
            </div>

            {showPrefs && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <PrefRow
                  title="Estritamente necessários"
                  description="Essenciais para o funcionamento do site. Não podem ser desativados."
                  checked
                  disabled
                />
                <PrefRow
                  title="Análise e desempenho"
                  description="Ajudam-nos a perceber como o site é usado para melhorar a experiência."
                  checked={prefs.analytics}
                  onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
                />
                <PrefRow
                  title="Marketing"
                  description="Usados para comunicações relevantes. Atualmente não enviamos anúncios."
                  checked={prefs.marketing}
                  onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
                />
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              {!showPrefs ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setShowPrefs(true)}>
                    Personalizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={rejectAll}>
                    Rejeitar opcionais
                  </Button>
                  <Button size="sm" onClick={acceptAll}>
                    Aceitar tudo
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setShowPrefs(false)}>
                    Voltar
                  </Button>
                  <Button variant="outline" size="sm" onClick={rejectAll}>
                    Rejeitar opcionais
                  </Button>
                  <Button size="sm" onClick={savePrefs}>
                    Guardar preferências
                  </Button>
                </>
              )}
            </div>
          </div>
          <button
            onClick={rejectAll}
            aria-label="Fechar"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PrefRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event("open-cookie-preferences"));
}
