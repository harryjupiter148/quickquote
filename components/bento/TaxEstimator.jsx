// components/bento/TaxEstimator.jsx
"use client";
import { useState } from "react";
import { Calculator } from "lucide-react";
import { naira, takeHome } from "@/lib/format";

const isNum = (v) => v === "" || /^\d*\.?\d*$/.test(v);

export default function TaxEstimator({ defaultRate = 7.5, className = "" }) {
  const [grossFee, setGrossFee] = useState("");
  const [taxRate, setTaxRate] = useState(String(defaultRate ?? ""));

  const feeBad = !isNum(grossFee);
  const rateBad = !isNum(taxRate) || parseFloat(taxRate) > 100;
  const net = feeBad || rateBad ? null : takeHome(grossFee, taxRate);
  const tax = net !== null ? parseFloat(grossFee) - net : null;

  return (
    <div className={`glass flex flex-col gap-4 p-6 ${className}`}>
      <div className="tile-title">
        <Calculator size={18} className="text-cyan-300" />
        <span>Tax Estimator</span>
      </div>
      <div>
        <input
          inputMode="decimal"
          placeholder="Gross Project Fee (NGN)"
          value={grossFee}
          onChange={(e) => setGrossFee(e.target.value.replace(/,/g, ""))}
          className={`glass-input ${feeBad ? "invalid" : ""}`}
          aria-invalid={feeBad}
        />
        {feeBad && <p className="mt-1 text-xs text-red-300">Enter numbers only.</p>}
      </div>
      <div>
        <input
          inputMode="decimal"
          placeholder="Tax Rate (%)"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
          className={`glass-input ${rateBad ? "invalid" : ""}`}
          aria-invalid={rateBad}
        />
        {rateBad && <p className="mt-1 text-xs text-red-300">Enter a rate between 0 and 100.</p>}
      </div>
      <div className="mt-auto text-white/90">
        <p className="text-sm text-white/60">Estimated Take-Home Pay</p>
        <p className="text-2xl font-bold">{naira(net)}</p>
        {tax !== null && (
          <p className="mt-0.5 text-xs text-white/50">Tax set aside: {naira(tax)}</p>
        )}
      </div>
    </div>
  );
}
