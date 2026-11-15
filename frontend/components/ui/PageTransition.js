"use client";

import { motion, useReducedMotion } from "framer-motion";

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

/**
 * Standard page transition + entrance animation wrapper.
 * Respects prefers-reduced-motion cleanly.
 */
export default function PageTransition({ children, className = "" }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: SMOOTH_EASE }}
    >
      {children}
    </motion.div>
  );
}

export function CardGrid({ children, className = "", gap = "gap-4 sm:gap-5" }) {
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
        visible: { transition: { staggerChildren: 0.05 } },
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
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: SMOOTH_EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
