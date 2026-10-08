import { useCallback, useEffect, useRef, useState } from 'react';

/** Durée d'affichage de la confirmation « Copié ! » */
const COPIED_DURATION_MS = 1800;

/** Repli pour les navigateurs sans Clipboard API (ou hors contexte sécurisé) */
const copyWithTextarea = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  return ok;
};

/**
 * Copie un texte dans le presse-papiers. `copied` repasse à false tout seul
 * après COPIED_DURATION_MS ; une nouvelle copie relance le délai et rejoue
 * l'animation de confirmation (via `copyCount`, à utiliser comme `key`).
 */
export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);
  const [copyCount, setCopyCount] = useState(0);
  const timeout = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeout.current), []);

  const copy = useCallback(async (text: string) => {
    let ok: boolean;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = copyWithTextarea(text);
    }
    if (!ok) return false;

    window.clearTimeout(timeout.current);
    setCopied(true);
    setCopyCount((count) => count + 1);
    timeout.current = window.setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    return true;
  }, []);

  return { copied, copyCount, copy };
};
