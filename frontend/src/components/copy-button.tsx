"use client";

// Port of drafted.html's "Copy" control (:1937-1948), minus the email copy —
// D28 drops the email entirely. The only remaining use is "Copy link" on blog
// posts (P4).

import { useState } from "react";
import { T } from "@/lib/tempo";

export function CopyButton() {
  const [msg, setMsg] = useState("");

  async function onClick() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Copied");
    } catch {
      setMsg("Couldn't copy — copy the address from the browser bar");
    }
    setTimeout(() => setMsg(""), T(1));
  }

  return (
    <>
      <button className="btn" type="button" onClick={onClick}>
        Copy link
      </button>
      <span className="lab" aria-live="polite">
        {msg}
      </span>
    </>
  );
}
