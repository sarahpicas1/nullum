"use client";

import Link from "next/link";
import { useState } from "react";

export function VerifyLink() {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href="/verify"
      style={{
        fontSize: "11px",
        color: hovered ? "#e8e0d0" : "#888",
        textDecoration: "none",
        letterSpacing: "0.04em",
        transition: "color 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      Verify a record →
    </Link>
  );
}
