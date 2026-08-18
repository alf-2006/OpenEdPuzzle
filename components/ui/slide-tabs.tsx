"use client";

import React, { useRef, useState, useEffect, forwardRef, Dispatch, SetStateAction } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Position {
  left: number;
  width: number;
  opacity: number;
}

const tabs = [
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Architecture", href: "#architecture" },
  { name: "Docs", href: "https://github.com/alf-2006/OpenEdPuzzle#readme", external: true },
];

export const SlideTabs = () => {
  const [position, setPosition] = useState<Position>({ left: 0, width: 0, opacity: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const tabsRef = useRef<(HTMLLIElement | null)[]>([]);

  return (
    <ul
      onMouseLeave={() => setPosition((prev) => ({ ...prev, opacity: 0 }))}
      className="relative flex items-center gap-1"
    >
      {tabs.map((tab, i) => (
        <Tab
          key={tab.name}
          ref={(el) => { tabsRef.current[i] = el; }}
          setPosition={setPosition}
          onClick={() => setSelected(i)}
          href={tab.href}
          external={tab.external}
          isSelected={selected === i}
        >
          {tab.name}
        </Tab>
      ))}
      <Cursor position={position} />
    </ul>
  );
};

interface TabProps {
  children: React.ReactNode;
  setPosition: Dispatch<SetStateAction<Position>>;
  onClick: () => void;
  href: string;
  external?: boolean;
  isSelected?: boolean;
}

const Tab = forwardRef<HTMLLIElement, TabProps>(
  ({ children, setPosition, onClick, href, external, isSelected }, ref) => {
    return (
      <li
        ref={ref}
        onClick={onClick}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          const { width } = el.getBoundingClientRect();
          setPosition({ left: el.offsetLeft, width, opacity: 1 });
        }}
        className="relative z-10 cursor-pointer"
      >
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`block px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
              isSelected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {children}
          </a>
        ) : (
          <Link
            href={href}
            className={`block px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
              isSelected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {children}
          </Link>
        )}
      </li>
    );
  }
);
Tab.displayName = "Tab";

const Cursor = ({ position }: { position: Position }) => {
  return (
    <motion.li
      animate={{ ...position }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      className="absolute z-0 rounded-md bg-muted pointer-events-none inset-y-1"
    />
  );
};

