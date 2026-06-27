"use client";

import { useState } from "react";

interface Suggestion {
  name: string;
  reason: string;
}

interface BundleSuggestionsData {
  serviceType: string;
  suggestions: Suggestion[];
  availableServiceTypes: string[];
}

interface BundleSuggestionsPanelProps {
  initialData: BundleSuggestionsData | null;
  backendUrl: string;
  token: string;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  NEARBY_AUTO:    "🚨 Quick Assign",
  STORE_ROUTED:   "🏪 Store Routed",
  DIRECT_PLUMBER: "👨‍🔧 Direct Plumber",
};

export default function BundleSuggestionsPanel({
  initialData, backendUrl, token
}: BundleSuggestionsPanelProps) {
  const [selected, setSelected] = useState(
    initialData?.serviceType ?? "NEARBY_AUTO"
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    initialData?.suggestions ?? []
  );
  const [serviceTypes] = useState<string[]>(
    initialData?.availableServiceTypes ?? ["NEARBY_AUTO", "STORE_ROUTED", "DIRECT_PLUMBER"]
  );
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async (type: string) => {
    setLoading(true);
    setSelected(type);
    try {
      const res = await fetch(
        `${backendUrl}/api/v1/ai/bundle-suggestions?serviceType=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      }
    } catch {
      // keep existing suggestions on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Service Type Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {serviceTypes.map((type) => (
          <button
            key={type}
            onClick={() => fetchSuggestions(type)}
            style={{
              padding: "6px 12px",
              borderRadius: "999px",
              border: `1px solid ${selected === type ? "#14b8a6" : "rgba(255,255,255,0.07)"}`,
              background: selected === type ? "rgba(20,184,166,0.15)" : "transparent",
              color: selected === type ? "#14b8a6" : "#94a3b8",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {SERVICE_TYPE_LABELS[type] ?? type}
          </button>
        ))}
      </div>

      {/* Suggestions Grid */}
      {loading ? (
        <div className="empty-state" style={{ height: 80 }}>
          <span>Loading suggestions…</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {suggestions.map((s, i) => (
            <div key={i} className="product-chip animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}>
              <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "#f1f5f9" }}>
                🔩 {s.name}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{s.reason}</span>
            </div>
          ))}
          {suggestions.length === 0 && (
            <div className="empty-state" style={{ height: 80 }}>
              <span>No suggestions for this type</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
