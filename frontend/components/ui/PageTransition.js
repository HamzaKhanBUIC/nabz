"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Standard page transition + entrance animation wrapper.
 * Respects prefers-reduced-motion.
 */
export default function PageTransition({ children, className = "" }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered entrance for a group of cards. */
export function CardGrid({ children, className = "", gap = "gap-5" }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={`grid ${gap} ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      className={`grid ${gap} ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}
