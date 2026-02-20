import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi } from "lucide-react";

/**
 * Shows a subtle banner after `delayMs` of continuous `visible=true`.
 * Disappears as soon as `visible` goes false.
 * Used to reassure players that a slow server response is normal.
 */
const SlowConnectionBanner = ({
  visible,
  delayMs = 2500,
  message = "Forbindelsen er langsom – vent venligst...",
}: {
  visible: boolean;
  delayMs?: number;
  message?: string;
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(t);
  }, [visible, delayMs]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-medium"
        >
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <Wifi className="w-3.5 h-3.5" />
          </motion.div>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SlowConnectionBanner;
