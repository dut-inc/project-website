"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { ruleHref, ruleIdFromNumber, searchHref } from "@/lib/root/paths";

// The search box on the contents and faction pages. A typed rule number that
// exists (6.2.3, G.20) opens that rule directly; anything else opens the
// search page. `ids` is every rule id that has a page.
export default function SearchBox({
  ids,
  faction,
  label = "Search the Law",
  placeholder = "A rule number, a word, or a \"phrase\"",
}: {
  ids: string[];
  faction?: string;
  label?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const [value, setValue] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = value.trim();
    const id = /\d/.test(q) ? ruleIdFromNumber(q) : null;
    if (id && ids.includes(id)) router.push(ruleHref(id));
    else router.push(searchHref({ q, faction }));
  }

  return (
    <form onSubmit={submit} role="search" className="w-full max-w-xl">
      <label htmlFor={inputId} className="mb-1.5 block root-kicker">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={placeholder}
          className="root-field h-11 min-w-0 flex-1 px-3 text-[16px] outline-none"
        />
        <button
          type="submit"
          className="root-btn h-11 shrink-0 px-5 text-[15px]"
        >
          Search
        </button>
      </div>
    </form>
  );
}
