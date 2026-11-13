import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { CheckIcon, CopyIcon } from './Icons';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked; the text is still visible to copy by hand
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? 'Copied' : label}
      className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-primary-500 transition hover:bg-primary-50"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'done' : 'copy'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="inline-flex items-center gap-1.5"
        >
          {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          {copied ? 'Copied!' : label}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
