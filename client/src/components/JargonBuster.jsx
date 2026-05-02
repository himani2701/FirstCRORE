import { useState, useEffect, useRef } from "react";
import "./JargonBuster.css";

// Offline fallback for common terms (works without API key)
const FALLBACK_GLOSSARY = {
  "DICGC": {
    plainExplanation: "A government guarantee that protects your bank deposits up to ₹5 lakh if a bank ever fails.",
    example: "If you put ₹4 lakh in Suryoday SFB and they shut down tomorrow, the government ensures you still get your full ₹4 lakh back.",
    whyItMatters: "This is why small finance banks offering 8.5% are safe — your money is insured exactly like SBI."
  },
  "tenor": {
    plainExplanation: "How long your Fixed Deposit is locked in — the duration of the FD agreement.",
    example: "A 12-month tenor means your ₹50,000 stays with the bank for 1 year, and you get it back with interest after that.",
    whyItMatters: "Picking the right tenor means your money becomes available exactly when you need it — not too early, not too late."
  },
  "p.a.": {
    plainExplanation: "Per annum — meaning the interest rate applies per year, not per month.",
    example: "8.5% p.a. on ₹1,00,000 means you earn ₹8,500 in one year (before compounding).",
    whyItMatters: "Always check if it's p.a. because monthly rates look smaller but add up the same — it's just different ways of saying the same thing."
  },
  "compounding": {
    plainExplanation: "Earning interest on your interest — your returns keep growing on themselves over time.",
    example: "₹1,00,000 at 8% compounded quarterly becomes ₹1,08,243 in a year — ₹243 more than simple interest because your interest earned interest too.",
    whyItMatters: "Starting at 23 instead of 30 doesn't just give you 7 more years — it gives your money 7 more years to multiply on itself."
  },
  "FD": {
    plainExplanation: "A Fixed Deposit is a savings account where you lock in money for a fixed period at a guaranteed interest rate.",
    example: "Put ₹50,000 in an FD at 8% for 12 months, and you'll get back ₹54,000 guaranteed — no market risk.",
    whyItMatters: "It's the safest way to beat your savings account interest rate, and it's perfect for money you know you won't need until a specific date."
  },
  "SFB": {
    plainExplanation: "Small Finance Bank — a type of regulated Indian bank that focuses on small savers and often offers higher interest rates than big banks.",
    example: "Suryoday SFB offers 8.5% FD rate vs SBI's 6.8% — and deposits are protected by DICGC up to ₹5 lakh just like any big bank.",
    whyItMatters: "SFBs are RBI-regulated and DICGC-insured — the higher rate isn't extra risk, it's just them competing harder for your deposits."
  },
  "liquidity": {
    plainExplanation: "How quickly you can convert your investment back into usable cash without losing money.",
    example: "Your savings account has high liquidity — you can withdraw ₹10,000 right now. An FD has low liquidity — breaking it early costs you interest.",
    whyItMatters: "Your emergency fund needs high liquidity. Your goal savings don't — and locking them up earns you more interest."
  },
  "CAGR": {
    plainExplanation: "Compound Annual Growth Rate — the average yearly growth rate of an investment, accounting for compounding.",
    example: "If ₹1 lakh grew to ₹1.8 lakh in 5 years, the CAGR is about 12.5% — that's the actual yearly growth rate, smoothed out.",
    whyItMatters: "When someone says 'this fund gave 40% returns', always ask for the CAGR — it's the honest number."
  }
};

export function JargonBuster({ term, userContext, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    const fetchExplanation = async () => {
      setLoading(true);

      // Check fallback first (instant)
      const fallbackKey = Object.keys(FALLBACK_GLOSSARY).find(
        (k) => k.toLowerCase() === term.toLowerCase()
      );

      if (fallbackKey) {
        setTimeout(() => {
          setData({ term, ...FALLBACK_GLOSSARY[fallbackKey] });
          setLoading(false);
        }, 300);
        return;
      }

      // Try API
      try {
        const res = await fetch("/api/jargon/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ term, userContext }),
        });
        const json = await res.json();
        setData(json);
      } catch {
        setData({
          term,
          plainExplanation: `${term} is a financial term that affects how your money works.`,
          example: "Understanding this helps you make smarter decisions about where to put your savings.",
          whyItMatters: "The more terms you understand, the better financial decisions you'll make.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [term]);

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <div className="jargon-overlay">
      <div className="jargon-popup animate-fade-up" ref={ref}>
        <div className="jargon-header">
          <div className="jargon-term-badge">
            <span className="jargon-icon">📖</span>
            <strong>{term}</strong>
          </div>
          <button className="jargon-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="jargon-loading">
            <div className="skeleton" style={{ height: "16px", width: "80%", marginBottom: "8px" }} />
            <div className="skeleton" style={{ height: "16px", width: "60%" }} />
          </div>
        ) : data ? (
          <div className="jargon-content">
            <p className="jargon-plain">{data.plainExplanation}</p>
            <div className="jargon-example">
              <span className="example-label">For example</span>
              <p>{data.example}</p>
            </div>
            <div className="jargon-relevance">
              <span className="relevance-label">Why it matters to you</span>
              <p>{data.whyItMatters}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Inline jargon term component
export function JargonTerm({ children, userContext }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span
        className="jargon-term"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Tap to understand this term"
      >
        {children}
      </span>
      {open && (
        <JargonBuster
          term={children}
          userContext={userContext}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
