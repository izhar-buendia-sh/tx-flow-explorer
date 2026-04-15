import { useState, useMemo, useCallback, useEffect } from "react";

// ─── DATA LAYER (editable CMS database) ────────────────────────────
const DEFAULT_DATA = {
  ticketTypes: [
    { id: 0, name: "Paper Ticket", category: "Physical", icon: "🎫", delivery: "Physical Shipment", description: "Traditional paper tickets shipped via courier" },
    { id: 1, name: "Italian Paper to E-Ticket", category: "Special", icon: "🇮🇹", delivery: "Conversion", description: "Paper to digital conversion (Italian market)" },
    { id: 2, name: "Tessera Del Tifoso", category: "Physical", icon: "⚽", delivery: "Physical Card", description: "Italian fan card for stadium access" },
    { id: 3, name: "Season Ticket Card Exchange", category: "Physical", icon: "🔄", delivery: "Card Exchange", description: "Season pass exchange between fans" },
    { id: 5, name: "E-Ticket Name Change", category: "Digital", icon: "✏️", delivery: "Digital", description: "Name change on existing e-ticket" },
    { id: 6, name: "3rd Party Pre-upload", category: "Digital", icon: "📤", delivery: "Digital", description: "Pre-uploaded e-tickets from third party" },
    { id: 10, name: "External Mobile Transfer", category: "Mobile", icon: "📱", delivery: "Mobile", description: "Mobile ticket transfer (TM, AXS)" },
    { id: 11, name: "E-Ticket URL", category: "Digital", icon: "🔗", delivery: "Digital", description: "E-ticket delivered via URL" },
    { id: 13, name: "QR Code", category: "Mobile", icon: "📷", delivery: "Mobile", description: "QR code e-ticket" },
    { id: 17, name: "Passolig", category: "Mobile", icon: "🏟️", delivery: "Mobile", description: "Turkish venue Passolig system" },
    { id: 20, name: "Barcode", category: "Digital", icon: "📊", delivery: "Digital/Print", description: "Barcode e-ticket" },
    { id: 24, name: "Account Surrender", category: "Special", icon: "🔑", delivery: "Account Transfer", description: "Account delegation to buyer" },
  ],
  transactionStates: {
    10: { name: "PendingAuthorization", phase: "payment", label: "Pending Auth", desc: "Initial state - payment awaiting PSP authorization", buyerSees: "Processing payment...", sellerSees: "—" },
    12: { name: "PendingInvoiceAuth", phase: "payment", label: "Invoice Auth", desc: "Awaiting OXXO/Konbini invoice payment", buyerSees: "Complete payment at store", sellerSees: "—" },
    15: { name: "Pending3DSecure", phase: "payment", label: "3DS Challenge", desc: "3D Secure challenge required", buyerSees: "Complete bank verification", sellerSees: "—" },
    16: { name: "PendingExternalFraud", phase: "payment", label: "Fraud Screen (Ext)", desc: "External fraud check (Forter)", buyerSees: "Verifying order...", sellerSees: "—" },
    17: { name: "PendingInternalFraud", phase: "payment", label: "Fraud Screen (Int)", desc: "Internal fraud screening", buyerSees: "Verifying order...", sellerSees: "—" },
    20: { name: "PendingSellerConfirmation", phase: "seller", label: "Seller Confirm", desc: "Awaiting seller to confirm sale", buyerSees: "Order confirmed - awaiting seller", sellerSees: "You have a new sale!" },
    30: { name: "ConfirmedPendingSettlement", phase: "settlement", label: "Settlement", desc: "Seller confirmed, pending settlement", buyerSees: "Seller confirmed", sellerSees: "Confirmed" },
    31: { name: "PendingSubstitutionNoCharge", phase: "substitution", label: "Sub (No Charge)", desc: "Substitute without charging seller", buyerSees: "Finding replacement tickets", sellerSees: "Fee applied, find replacement" },
    33: { name: "PendingSubstitutionCharge", phase: "substitution", label: "Sub (Charge)", desc: "Substitute with seller charge", buyerSees: "Finding replacement tickets", sellerSees: "Charged, find replacement" },
    35: { name: "PendingShipmentCreation", phase: "fulfillment", label: "Ship Creation", desc: "Ready for shipment setup (KEY STATE)", buyerSees: "Preparing your tickets", sellerSees: "Fulfill order" },
    40: { name: "PendingShipment", phase: "fulfillment", label: "Pending Ship", desc: "Shipment pending", buyerSees: "Preparing your tickets", sellerSees: "Package & ship" },
    43: { name: "PendingTransfer", phase: "fulfillment", label: "Pending Transfer", desc: "Pending mobile/digital transfer", buyerSees: "Transfer pending", sellerSees: "Initiate transfer" },
    46: { name: "PendingDropoff", phase: "fulfillment", label: "Pending Dropoff", desc: "Pending dropoff at location", buyerSees: "Preparing your tickets", sellerSees: "Drop off tickets" },
    48: { name: "PendingCourierPickup", phase: "fulfillment", label: "Courier Pickup", desc: "Awaiting courier pickup", buyerSees: "Shipped - track here", sellerSees: "Awaiting courier" },
    50: { name: "InTransit", phase: "fulfillment", label: "In Transit", desc: "Shipment in transit", buyerSees: "In transit - track here", sellerSees: "In transit" },
    55: { name: "PendingPickup", phase: "fulfillment", label: "Buyer Pickup", desc: "Pending buyer pickup", buyerSees: "Ready for pickup", sellerSees: "—" },
    60: { name: "PendingSellerPayment", phase: "settlement", label: "Seller Payment", desc: "Awaiting seller payment settlement", buyerSees: "Delivered", sellerSees: "Awaiting payment" },
    70: { name: "Complete", phase: "success", label: "Complete ✓", desc: "Transaction successfully complete", buyerSees: "Complete", sellerSees: "Payment received" },
    75: { name: "AuthFailed", phase: "terminal", label: "Auth Failed", desc: "Payment authorization failed", buyerSees: "Payment failed", sellerSees: "—" },
    85: { name: "ShipmentFailed", phase: "terminal", label: "Ship Failed", desc: "Shipment delivery failed", buyerSees: "Delivery issue", sellerSees: "Shipment failed" },
    100: { name: "CancelledByCS", phase: "terminal", label: "CS Cancel", desc: "Cancelled by CS agent", buyerSees: "Order cancelled", sellerSees: "Order cancelled" },
    101: { name: "CancelledByBuyer", phase: "terminal", label: "Buyer Cancel", desc: "Cancelled by buyer", buyerSees: "Cancelled", sellerSees: "Buyer cancelled" },
    102: { name: "Refunded", phase: "terminal", label: "Refunded", desc: "Transaction refunded", buyerSees: "Refund processed", sellerSees: "Refunded" },
    106: { name: "SettlementDispute", phase: "terminal", label: "Dispute", desc: "Chargeback/dispute", buyerSees: "Under review", sellerSees: "Dispute filed" },
    107: { name: "CancelledFraudInt", phase: "terminal", label: "Fraud (Int)", desc: "Cancelled - internal fraud", buyerSees: "Order cancelled", sellerSees: "—" },
    108: { name: "CancelledFraudExt", phase: "terminal", label: "Fraud (Ext)", desc: "Cancelled - external fraud", buyerSees: "Order cancelled", sellerSees: "—" },
  },
  flows: {
    0: { // Paper Ticket
      happyPath: [10, 20, 35, 40, 48, 50, 60, 70],
      shipmentStates: [1, 2, 5, 10, 15, 20],
      alternativePaths: [
        { name: "3DS Required", path: [10, 15, 20, 35, 40, 48, 50, 60, 70] },
        { name: "External Fraud Check", path: [10, 16, 20, 35, 40, 48, 50, 60, 70] },
        { name: "Seller Substitution", path: [10, 20, 31, 35, 40, 48, 50, 60, 70] },
        { name: "Shipment Lost", path: [10, 20, 35, 40, 48, 50, 85] },
        { name: "Chargeback", path: [10, 20, 35, 40, 48, 50, 60, 70, 106] },
      ],
      notes: "Physical tickets require courier shipment. Seller prints label, packages tickets, hands to courier. Full shipment state tracking."
    },
    1: { // Italian Paper to E-Ticket
      happyPath: [10, 20, 35, 43, 60, 70],
      shipmentStates: null,
      alternativePaths: [
        { name: "3DS Required", path: [10, 15, 20, 35, 43, 60, 70] },
        { name: "Fraud Declined", path: [10, 16, 108] },
      ],
      notes: "Italian market conversion flow. Originally paper tickets converted to digital. Follows digital fulfillment path (PendingTransfer) rather than physical shipment."
    },
    2: { // Tessera Del Tifoso
      happyPath: [10, 20, 35, 40, 48, 50, 60, 70],
      shipmentStates: [1, 2, 5, 10, 15, 20],
      alternativePaths: [
        { name: "3DS Required", path: [10, 15, 20, 35, 40, 48, 50, 60, 70] },
        { name: "Shipment Lost", path: [10, 20, 35, 40, 48, 50, 85] },
        { name: "Seller Substitution", path: [10, 20, 31, 35, 40, 48, 50, 60, 70] },
      ],
      notes: "Italian fan card (Tessera Del Tifoso). Physical card delivery required. Same shipment flow as Paper Ticket. Used for Italian Serie A football venues."
    },
    3: { // Season Ticket Card Exchange
      happyPath: [10, 20, 35, 40, 48, 50, 60, 70],
      shipmentStates: [1, 2, 5, 10, 15, 20],
      alternativePaths: [
        { name: "3DS Required", path: [10, 15, 20, 35, 40, 48, 50, 60, 70] },
        { name: "Shipment Lost", path: [10, 20, 35, 40, 48, 50, 85] },
      ],
      notes: "Season pass card exchange between fans. Physical card must be shipped. Seller sends their season ticket card to buyer via courier."
    },
    5: { // E-Ticket Name Change
      happyPath: [10, 20, 35, 43, 60, 70],
      shipmentStates: null,
      alternativePaths: [
        { name: "3DS Required", path: [10, 15, 20, 35, 43, 60, 70] },
        { name: "Fraud Declined", path: [10, 16, 108] },
      ],
      notes: "Name change on existing e-ticket. Digital delivery, no physical shipment."
    },
    6: { // 3rd Party Pre-upload
      happyPath: [10, 20, 35, 43, 60, 70],
      shipmentStates: null,
      alternativePaths: [
        { name: "Immediate Delivery", path: [10, 20, 35, 43, 60, 70] },
      ],
      notes: "Pre-uploaded before sale. No seller action needed post-sale. Immediate delivery. Fast path: 35 → 43 → 60 → 70."
    },
    10: { // External Mobile Transfer
      happyPath: [10, 20, 35, 43, 60, 70],
      shipmentStates: null,
      alternativePaths: [
        { name: "3DS + Transfer", path: [10, 15, 20, 35, 43, 60, 70] },
        { name: "Transfer Rejected → Retry", path: [10, 20, 35, 43, 60, 70] },
        { name: "OXXO Payment", path: [10, 20, 35, 43, 60, 70] },
        { name: "Retransfer from State 60", path: [10, 20, 35, 43, 60, 70] },
      ],
      notes: "Mobile transfer via venue app (TM, AXS, Flash Seats). Buyer must accept transfer. Seller initiates in venue app."
    },
    11: { // E-Ticket URL
      happyPath: [10, 20, 35, 43, 60, 70],
      shipmentStates: null,
      alternativePaths: [
        { name: "3DS Challenge Passed", path: [10, 15, 20, 35, 43, 60, 70] },
        { name: "3DS Challenge Failed", path: [10, 15, 75] },
        { name: "OXXO Payment", path: [10, 20, 35, 43, 60, 70] },
        { name: "External Fraud - Passed", path: [10, 16, 20, 35, 43, 60, 70] },
        { name: "External Fraud - Failed", path: [10, 16, 108] },
        { name: "CS Cancellation", path: [10, 20, 35, 43, 60, 70, 100] },
        { name: "Buyer Cancellation", path: [10, 20, 35, 43, 60, 70, 101] },
        { name: "Refund After Complete", path: [10, 20, 35, 43, 60, 70, 102] },
        { name: "Chargeback", path: [10, 20, 35, 43, 60, 70, 106] },
      ],
      notes: "E-ticket via URL delivery. Seller uploads PDF/URL. System extracts, validates, and delivers to buyer. Most common digital flow."
    },
    13: { // QR Code
      happyPath: [10, 20, 35, 43, 60, 70],
      shipmentStates: null,
      alternativePaths: [
        { name: "PayPal Payment", path: [10, 20, 35, 43, 60, 70] },
        { name: "3DS Required", path: [10, 15, 20, 35, 43, 60, 70] },
      ],
      notes: "QR code e-ticket. Mobile delivery. Similar to E-Ticket URL but rendered as QR code for venue scanning."
    },
    17: { // Passolig
      happyPath: [10, 20, 35, 43, 60, 70],
      shipmentStates: null,
      alternativePaths: [],
      notes: "Turkish venue Passolig system. Mobile transfer specific to Turkish football venues."
    },
    20: { // Barcode
      happyPath: [10, 20, 35, 43, 60, 70],
      shipmentStates: null,
      alternativePaths: [
        { name: "3DS Required", path: [10, 15, 20, 35, 43, 60, 70] },
      ],
      notes: "Barcode e-ticket. Can be digital or printed. Seller uploads barcode, system validates."
    },
    24: { // Account Surrender
      happyPath: [10, 20, 35, 43, 60, 70],
      shipmentStates: null,
      alternativePaths: [],
      notes: "Account delegation/surrender. Seller provides account access to buyer. Special handling required."
    },
  },
  paymentMethods: [
    { id: 1, name: "Credit Card", resultCodes: [1, 3, 9, 21, 22] },
    { id: 2, name: "PayPal", resultCodes: [1, 3] },
    { id: 8, name: "ELV", resultCodes: [1, 3], note: "German direct debit, higher chargeback risk" },
    { id: 74, name: "Apple Pay", resultCodes: [1, 3, 9] },
    { id: 77, name: "OXXO", resultCodes: [35], note: "Mexico cash, 72hr window" },
    { id: 78, name: "Google Pay", resultCodes: [1, 3, 9] },
    { id: 81, name: "Klarna", resultCodes: [1, 3] },
    { id: 83, name: "Pix", resultCodes: [1, 3] },
    { id: 85, name: "Konbini", resultCodes: [35], note: "Japan convenience store" },
  ],
  paymentResultCodes: {
    1: { name: "Success", desc: "Payment authorized", nextState: 20 },
    3: { name: "AuthFailure", desc: "Payment declined", nextState: 75 },
    9: { name: "3DSRequired", desc: "3D Secure challenge", nextState: 15 },
    21: { name: "Fraud", desc: "Flagged as fraud", nextState: 108 },
    22: { name: "InsufficientFunds", desc: "Card insufficient funds", nextState: 75 },
    35: { name: "WaitCash", desc: "Waiting for cash payment", nextState: null },
  },
};

// ─── PHASE COLORS ──────────────────────────────────────────────────
const PHASE_CONFIG = {
  payment: { color: "#6366f1", bg: "#eef2ff", label: "Payment", border: "#c7d2fe" },
  seller: { color: "#f59e0b", bg: "#fffbeb", label: "Seller", border: "#fde68a" },
  settlement: { color: "#8b5cf6", bg: "#f5f3ff", label: "Settlement", border: "#ddd6fe" },
  substitution: { color: "#ec4899", bg: "#fdf2f8", label: "Substitution", border: "#fbcfe8" },
  fulfillment: { color: "#06b6d4", bg: "#ecfeff", label: "Fulfillment", border: "#a5f3fc" },
  success: { color: "#10b981", bg: "#ecfdf5", label: "Success", border: "#a7f3d0" },
  terminal: { color: "#ef4444", bg: "#fef2f2", label: "Terminal", border: "#fecaca" },
};

const CATEGORY_COLORS = {
  Physical: "#d97706",
  Digital: "#6366f1",
  Mobile: "#06b6d4",
  Special: "#8b5cf6",
};

// ─── COMPONENTS ────────────────────────────────────────────────────

function StateNode({ stateId, state, isActive, isHighlighted, isDiff, isSameAsHappy, onClick, showPreview, compact }) {
  const phase = PHASE_CONFIG[state.phase] || PHASE_CONFIG.payment;
  // When in diff mode: divergent states pop, shared states are muted
  const dimmed = isSameAsHappy === true && !isActive;
  return (
    <div
      onClick={() => onClick?.(stateId)}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: compact ? 2 : 4,
        cursor: "pointer",
        transition: "all 0.25s ease",
        transform: isActive ? "scale(1.08)" : isDiff ? "scale(1.04)" : "scale(1)",
        filter: isHighlighted === false ? "opacity(0.35)" : dimmed ? "opacity(0.45) saturate(0.3)" : "none",
        position: "relative",
      }}
    >
      {/* Diff accent ring */}
      {isDiff && !isActive && (
        <div style={{
          position: "absolute",
          inset: -4,
          borderRadius: 14,
          border: "2px dashed #f97316",
          background: "#fff7ed33",
          pointerEvents: "none",
          zIndex: 0,
        }} />
      )}
      <div style={{
        background: isActive ? phase.color : isDiff ? "#fff7ed" : phase.bg,
        color: isActive ? "#fff" : isDiff ? "#ea580c" : phase.color,
        border: `2px solid ${isActive ? phase.color : isDiff ? "#fb923c" : phase.border}`,
        borderRadius: 10,
        padding: compact ? "6px 10px" : "10px 16px",
        fontSize: compact ? 11 : 13,
        fontWeight: isDiff ? 800 : 600,
        fontFamily: "'DM Sans', sans-serif",
        whiteSpace: "nowrap",
        boxShadow: isActive ? `0 4px 16px ${phase.color}44` : isDiff ? "0 2px 12px #f9731633" : "0 1px 3px rgba(0,0,0,0.06)",
        minWidth: compact ? 60 : 80,
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}>
        {isDiff && (
          <div style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#f97316",
            color: "#fff",
            fontSize: 8,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px #f9731666",
            zIndex: 2,
          }}>✦</div>
        )}
        <div style={{ fontSize: compact ? 10 : 11, opacity: 0.7 }}>State {stateId}</div>
        <div>{state.label}</div>
      </div>
      {showPreview && isActive && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginTop: 8,
          background: "#1e293b",
          color: "#f1f5f9",
          borderRadius: 8,
          padding: "12px 16px",
          fontSize: 12,
          width: 220,
          zIndex: 100,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{state.name}</div>
          <div style={{ opacity: 0.7, marginBottom: 8 }}>{state.desc}</div>
          <div style={{ borderTop: "1px solid #334155", paddingTop: 8 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.5, marginBottom: 2 }}>Buyer sees</div>
            <div style={{ color: "#38bdf8" }}>{state.buyerSees}</div>
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.5, marginBottom: 2 }}>Seller sees</div>
            <div style={{ color: "#fbbf24" }}>{state.sellerSees}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlowArrow({ compact }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", padding: compact ? "0 2px" : "0 4px" }}>
      <svg width={compact ? 16 : 24} height="12" viewBox="0 0 24 12">
        <path d="M0 6 L18 6 M14 2 L20 6 L14 10" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function FlowVisualization({ path, states, activeState, onStateClick, label, isHappy, happyPath }) {
  // Use LCS (longest common subsequence) to accurately diff paths
  const diffMap = useMemo(() => {
    if (isHappy || !happyPath) return null;

    // Build LCS table
    const a = happyPath, b = path;
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    // Backtrack to find which indices in b are part of the common subsequence
    const commonIndicesInB = new Set();
    const commonIndicesInA = new Set();
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        commonIndicesInB.add(j - 1);
        commonIndicesInA.add(i - 1);
        i--; j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    // States in alt path NOT in LCS = added/different
    const added = [];
    const diffIndices = new Set();
    for (let k = 0; k < b.length; k++) {
      if (!commonIndicesInB.has(k)) {
        diffIndices.add(k);
        added.push(b[k]);
      }
    }

    // States in happy path NOT in LCS = removed/skipped
    const removed = [];
    for (let k = 0; k < a.length; k++) {
      if (!commonIndicesInA.has(k)) {
        removed.push(a[k]);
      }
    }

    return { diffIndices, added, removed };
  }, [path, happyPath, isHappy]);

  // Dedupe the added/removed for display (a state might appear multiple times)
  const diffSummary = useMemo(() => {
    if (!diffMap) return null;
    const uniqueAdded = [...new Set(diffMap.added)];
    const uniqueRemoved = [...new Set(diffMap.removed)];
    return { added: uniqueAdded, removed: uniqueRemoved };
  }, [diffMap]);

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          color: isHappy ? "#10b981" : "#64748b",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}>
          {isHappy && <span style={{ fontSize: 14 }}>✦</span>}
          {label}
          {/* Diff summary badges */}
          {diffSummary && diffSummary.added.length > 0 && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#ea580c",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 6,
              padding: "2px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}>
              <span style={{ fontSize: 8 }}>✦</span>
              {diffSummary.added.length} new state{diffSummary.added.length > 1 ? "s" : ""}:
              {" "}{diffSummary.added.map(s => states[s]?.label || `State ${s}`).join(", ")}
            </span>
          )}
          {diffSummary && diffSummary.removed.length > 0 && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#dc2626",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 6,
              padding: "2px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}>
              <span style={{ fontSize: 8 }}>—</span>
              {diffSummary.removed.length} skipped:
              {" "}{diffSummary.removed.map(s => states[s]?.label || `State ${s}`).join(", ")}
            </span>
          )}
          {diffSummary && diffSummary.added.length === 0 && diffSummary.removed.length === 0 && (
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#10b981",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 6,
              padding: "2px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}>
              ✓ Same states as happy path (different payment method)
            </span>
          )}
        </div>
      )}
      <div style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 4,
        padding: "12px 16px",
        background: isHappy ? "#f0fdf4" : (diffSummary && diffSummary.added.length > 0) ? "#fffbf5" : "#f8fafc",
        borderRadius: 12,
        border: isHappy ? "1px solid #bbf7d0" : (diffSummary && diffSummary.added.length > 0) ? "1px solid #fed7aa" : "1px solid #e2e8f0",
      }}>
        {path.map((stateId, i) => {
          const hasDiffs = diffMap && diffMap.diffIndices.size > 0;
          const isIdentical = diffMap && diffMap.diffIndices.size === 0;
          const isDiff = hasDiffs && diffMap.diffIndices.has(i);
          const isSame = (hasDiffs && !diffMap.diffIndices.has(i)) || isIdentical;
          return (
            <div key={`${stateId}-${i}`} style={{ display: "inline-flex", alignItems: "center" }}>
              <StateNode
                stateId={stateId}
                state={states[stateId] || { name: "?", phase: "payment", label: `State ${stateId}`, desc: "Unknown", buyerSees: "—", sellerSees: "—" }}
                isActive={activeState === stateId}
                isDiff={isDiff}
                isSameAsHappy={isSame}
                onClick={onStateClick}
                compact
              />
              {i < path.length - 1 && <FlowArrow compact />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhoneMockup({ state, ticketType, phase }) {
  if (!state) return null;
  const p = PHASE_CONFIG[state.phase] || PHASE_CONFIG.payment;
  const isSuccess = state.phase === "success";
  const isError = state.phase === "terminal";
  return (
    <div style={{
      width: 260,
      minHeight: 460,
      background: "#000",
      borderRadius: 36,
      padding: 8,
      boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
      flexShrink: 0,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 28,
        height: "100%",
        minHeight: 444,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 20px 4px", fontSize: 11, color: "#64748b" }}>
          <span>9:41</span>
          <span>⚡ 87%</span>
        </div>
        {/* Notch */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <div style={{ width: 80, height: 20, background: "#000", borderRadius: 12 }} />
        </div>
        {/* Content */}
        <div style={{ flex: 1, padding: "0 16px 16px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
            Order Status
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
            {ticketType?.name || "Ticket"}
          </div>

          {/* Status card */}
          <div style={{
            background: isSuccess ? "#ecfdf5" : isError ? "#fef2f2" : p.bg,
            border: `1px solid ${isSuccess ? "#a7f3d0" : isError ? "#fecaca" : p.border}`,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 12,
              background: isSuccess ? "#10b981" : isError ? "#ef4444" : p.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, color: "#fff", marginBottom: 10,
            }}>
              {isSuccess ? "✓" : isError ? "✕" : state.phase === "fulfillment" ? "📦" : state.phase === "seller" ? "⏳" : "💳"}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
              {state.buyerSees}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
              {state.desc}
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {["payment", "seller", "fulfillment", "success"].map((ph, i) => {
                const phases = ["payment", "seller", "fulfillment", "success"];
                const currentIdx = phases.indexOf(state.phase);
                const isFilled = i <= currentIdx && !isError;
                return (
                  <div key={ph} style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: isFilled ? (isSuccess && i === 3 ? "#10b981" : p.color) : "#e2e8f0",
                    transition: "all 0.3s",
                  }} />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {["Pay", "Confirm", "Fulfill", "Done"].map(l => (
                <span key={l} style={{ fontSize: 9, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>{l}</span>
              ))}
            </div>
          </div>

          {/* Seller view */}
          <div style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#92400e", fontWeight: 700, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
              Seller View
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#78350f", fontFamily: "'DM Sans', sans-serif" }}>
              {state.sellerSees}
            </div>
          </div>

          {/* State badge */}
          <div style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "center",
          }}>
            <div style={{
              background: p.color,
              color: "#fff",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              TransactionState: {Object.keys(PHASE_CONFIG).indexOf(state.phase) > -1 ? Object.entries(DEFAULT_DATA.transactionStates).find(([k, v]) => v === state)?.[0] : "?"} — {state.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CMSEditor({ data, onUpdate, onClose }) {
  const [editingState, setEditingState] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState("states");

  const startEdit = (id, state) => {
    setEditingState(id);
    setEditForm({ ...state });
  };

  const saveEdit = () => {
    if (editingState !== null) {
      const newStates = { ...data.transactionStates, [editingState]: editForm };
      onUpdate({ ...data, transactionStates: newStates });
      setEditingState(null);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(8px)",
      zIndex: 1000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 900,
        maxHeight: "85vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 32px 64px rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          borderBottom: "1px solid #e2e8f0",
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>CMS Editor</div>
            <div style={{ fontSize: 13, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>Edit transaction states, labels, and descriptions</div>
          </div>
          <button onClick={onClose} style={{
            background: "#f1f5f9",
            border: "none",
            borderRadius: 10,
            width: 36, height: 36,
            cursor: "pointer",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e2e8f0" }}>
          {[
            { key: "states", label: "Transaction States" },
            { key: "tickets", label: "Ticket Types" },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: "12px 24px",
              border: "none",
              background: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: activeTab === t.key ? "#6366f1" : "#64748b",
              borderBottom: activeTab === t.key ? "2px solid #6366f1" : "2px solid transparent",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {activeTab === "states" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(data.transactionStates).map(([id, state]) => (
                <div key={id} style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  overflow: "hidden",
                }}>
                  {editingState === id ? (
                    <div style={{ padding: 16, background: "#f8fafc" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Label</label>
                          <input value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })} style={{
                            width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                          }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Phase</label>
                          <select value={editForm.phase} onChange={e => setEditForm({ ...editForm, phase: e.target.value })} style={{
                            width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                          }}>
                            {Object.keys(PHASE_CONFIG).map(p => <option key={p} value={p}>{PHASE_CONFIG[p].label}</option>)}
                          </select>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Description</label>
                          <input value={editForm.desc} onChange={e => setEditForm({ ...editForm, desc: e.target.value })} style={{
                            width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                          }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Buyer Sees</label>
                          <input value={editForm.buyerSees} onChange={e => setEditForm({ ...editForm, buyerSees: e.target.value })} style={{
                            width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                          }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Seller Sees</label>
                          <input value={editForm.sellerSees} onChange={e => setEditForm({ ...editForm, sellerSees: e.target.value })} style={{
                            width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                          }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => setEditingState(null)} style={{
                          padding: "8px 16px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                        }}>Cancel</button>
                        <button onClick={saveEdit} style={{
                          padding: "8px 16px", border: "none", borderRadius: 8, background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                        }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      cursor: "pointer",
                    }} onClick={() => startEdit(id, state)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          background: PHASE_CONFIG[state.phase]?.bg || "#f1f5f9",
                          color: PHASE_CONFIG[state.phase]?.color || "#64748b",
                          border: `1px solid ${PHASE_CONFIG[state.phase]?.border || "#e2e8f0"}`,
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "'DM Sans', sans-serif",
                          minWidth: 36,
                          textAlign: "center",
                        }}>{id}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>{state.label}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>{state.desc}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>Click to edit →</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === "tickets" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {data.ticketTypes.map(tt => (
                <div key={tt.id} style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{tt.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>{tt.name}</div>
                      <div style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: CATEGORY_COLORS[tt.category],
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{tt.category} · Type {tt.id}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>{tt.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────
export default function TransactionStateExplorer() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [activeState, setActiveState] = useState(null);
  const toggleState = useCallback((id) => setActiveState(prev => prev === id ? null : id), []);
  const [selectedPath, setSelectedPath] = useState("happy");
  const [showCMS, setShowCMS] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTicketTypes = useMemo(() => {
    return data.ticketTypes.filter(tt => {
      if (categoryFilter !== "all" && tt.category !== categoryFilter) return false;
      if (searchQuery && !tt.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [data.ticketTypes, categoryFilter, searchQuery]);

  const currentFlow = selectedTicketType !== null ? data.flows[selectedTicketType] : null;
  const currentTicket = data.ticketTypes.find(t => t.id === selectedTicketType);
  const activeStateData = activeState !== null ? data.transactionStates[activeState] : null;

  const categories = ["all", ...new Set(data.ticketTypes.map(t => t.category))];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "#0f172a",
        padding: "24px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 10,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}>🎫</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
              Transaction Flow Explorer
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
            Interactive state machine explorer · Select a ticket type to visualize its transaction lifecycle
          </p>
        </div>
        <button onClick={() => setShowCMS(true)} style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "10px 20px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          ⚙️ CMS Editor
        </button>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 90px)" }}>
        {/* Left sidebar - Ticket Types */}
        <div style={{
          width: 280,
          borderRight: "1px solid #e2e8f0",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}>
          <div style={{ padding: "16px 16px 12px" }}>
            <input
              placeholder="Search ticket types..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                boxSizing: "border-box",
                background: "#f8fafc",
              }}
            />
          </div>

          {/* Category filter */}
          <div style={{ display: "flex", gap: 4, padding: "0 16px 12px", flexWrap: "wrap" }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                padding: "4px 10px",
                border: "1px solid",
                borderColor: categoryFilter === cat ? (CATEGORY_COLORS[cat] || "#6366f1") : "#e2e8f0",
                borderRadius: 6,
                background: categoryFilter === cat ? (CATEGORY_COLORS[cat] || "#6366f1") + "15" : "#fff",
                color: categoryFilter === cat ? (CATEGORY_COLORS[cat] || "#6366f1") : "#64748b",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {cat}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "0 8px 16px" }}>
            {filteredTicketTypes.map(tt => {
              const isSelected = selectedTicketType === tt.id;
              return (
                <div
                  key={tt.id}
                  onClick={() => {
                    setSelectedTicketType(tt.id);
                    setActiveState(null);
                    setSelectedPath("happy");
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    marginBottom: 4,
                    background: isSelected ? "#6366f1" + "10" : "transparent",
                    border: isSelected ? "1px solid #c7d2fe" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{tt.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#4338ca" : "#0f172a" }}>{tt.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: CATEGORY_COLORS[tt.category],
                          background: CATEGORY_COLORS[tt.category] + "15",
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}>{tt.category}</span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>Type {tt.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {!currentFlow ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#94a3b8",
              gap: 12,
            }}>
              <div style={{ fontSize: 48 }}>🎫</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#475569" }}>Select a ticket type</div>
              <div style={{ fontSize: 14 }}>Choose from the sidebar to explore its transaction flow</div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 0 }}>
              {/* Flow area */}
              <div style={{ flex: 1, padding: 24 }}>
                {/* Ticket header */}
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 24,
                  padding: "20px 24px",
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                }}>
                  <span style={{ fontSize: 40 }}>{currentTicket?.icon}</span>
                  <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{currentTicket?.name}</h2>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px", marginTop: 4 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: CATEGORY_COLORS[currentTicket?.category],
                        background: CATEGORY_COLORS[currentTicket?.category] + "15",
                        padding: "2px 8px",
                        borderRadius: 4,
                        whiteSpace: "nowrap",
                      }}>{currentTicket?.category}</span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#64748b",
                        background: "#f1f5f9",
                        padding: "2px 8px",
                        borderRadius: 4,
                        whiteSpace: "nowrap",
                      }}>Delivery: {currentTicket?.delivery}</span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#64748b",
                        background: "#f1f5f9",
                        padding: "2px 8px",
                        borderRadius: 4,
                        whiteSpace: "nowrap",
                      }}>ETicketTypeID: {currentTicket?.id}</span>
                    </div>
                  </div>
                  {currentFlow.shipmentStates && (
                    <div style={{
                      background: "#fef3c7",
                      border: "1px solid #fde68a",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#92400e",
                      whiteSpace: "nowrap",
                    }}>📦 Physical Shipment Required</div>
                  )}
                </div>

                {/* Notes */}
                {currentFlow.notes && (
                  <div style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "#1e40af",
                    marginBottom: 20,
                    lineHeight: 1.5,
                  }}>
                    ℹ️ {currentFlow.notes}
                  </div>
                )}

                {/* Happy path */}
                <FlowVisualization
                  path={currentFlow.happyPath}
                  states={data.transactionStates}
                  activeState={activeState}
                  onStateClick={toggleState}
                  label="Happy Path"
                  isHappy
                />

                {/* Shipment states */}
                {currentFlow.shipmentStates && (
                  <div style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#d97706", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      📦 Shipment State Flow
                    </div>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                      {currentFlow.shipmentStates.map((s, i) => {
                        const shipNames = { 1: "Pending Creation", 2: "In Progress", 5: "Pending Ship", 10: "Pending Pickup", 15: "In Transit", 20: "Delivered" };
                        return (
                          <div key={s} style={{ display: "inline-flex", alignItems: "center" }}>
                            <div style={{
                              background: "#fffbeb",
                              border: "1px solid #fde68a",
                              borderRadius: 8,
                              padding: "6px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#92400e",
                            }}>
                              <div style={{ fontSize: 9, opacity: 0.6 }}>Ship {s}</div>
                              {shipNames[s] || `State ${s}`}
                            </div>
                            {i < currentFlow.shipmentStates.length - 1 && <FlowArrow compact />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Alternative paths */}
                {currentFlow.alternativePaths?.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                        Alternative Paths
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 11,
                        color: "#64748b",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{
                            display: "inline-block",
                            width: 10, height: 10,
                            borderRadius: 3,
                            border: "2px dashed #f97316",
                            background: "#fff7ed",
                          }} />
                          Changed from happy path
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{
                            display: "inline-block",
                            width: 10, height: 10,
                            borderRadius: 3,
                            background: "#e2e8f0",
                            opacity: 0.5,
                          }} />
                          Same as happy path
                        </span>
                      </div>
                    </div>
                    {currentFlow.alternativePaths.map((alt, i) => (
                      <FlowVisualization
                        key={i}
                        path={alt.path}
                        states={data.transactionStates}
                        activeState={activeState}
                        onStateClick={toggleState}
                        label={alt.name}
                        happyPath={currentFlow.happyPath}
                      />
                    ))}
                  </div>
                )}

                {/* Phase legend */}
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 24,
                  padding: "16px 20px",
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginRight: 8, alignSelf: "center" }}>PHASES:</div>
                  {Object.entries(PHASE_CONFIG).map(([key, cfg]) => (
                    <div key={key} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: cfg.color }} />
                      <span style={{ fontSize: 11, color: "#475569", fontWeight: 500 }}>{cfg.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel - Phone preview */}
              <div style={{
                width: 300,
                borderLeft: "1px solid #e2e8f0",
                background: "#f1f5f9",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
                  Product Preview
                </div>
                {activeStateData ? (
                  <PhoneMockup
                    state={activeStateData}
                    ticketType={currentTicket}
                  />
                ) : (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 460,
                    color: "#94a3b8",
                    textAlign: "center",
                    gap: 8,
                  }}>
                    <div style={{ fontSize: 32 }}>👆</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Click a state node</div>
                    <div style={{ fontSize: 12 }}>to preview the buyer & seller experience</div>
                  </div>
                )}

                {activeStateData && (
                  <div style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 14,
                    width: "100%",
                    border: "1px solid #e2e8f0",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>State Details</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{activeStateData.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{activeStateData.desc}</div>
                    <div style={{
                      marginTop: 8,
                      display: "flex",
                      gap: 6,
                    }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: PHASE_CONFIG[activeStateData.phase]?.bg,
                        color: PHASE_CONFIG[activeStateData.phase]?.color,
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: `1px solid ${PHASE_CONFIG[activeStateData.phase]?.border}`,
                      }}>{PHASE_CONFIG[activeStateData.phase]?.label}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCMS && (
        <CMSEditor
          data={data}
          onUpdate={setData}
          onClose={() => setShowCMS(false)}
        />
      )}
    </div>
  );
}
