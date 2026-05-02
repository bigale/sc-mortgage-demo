"use strict";
var MortgageBundle = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // domains/mortgage/src/index.ts
  var index_exports = {};
  __export(index_exports, {
    amortizationSchedule: () => amortizationSchedule,
    applyDerivations: () => applyDerivations,
    applyVirtualParams: () => applyVirtualParams,
    archetypes: () => archetypes,
    baseRate: () => baseRate,
    buildMortgageScenarios: () => buildMortgageScenarios,
    mortgageDomain: () => mortgageDomain,
    seedScenarios: () => seedScenarios,
    validateScenario: () => validateScenario
  });

  // packages/framework/src/pipeline.ts
  function applyVirtualParams(row, vps) {
    const r = { ...row };
    for (const vp of vps) r[vp.name] = vp.compute(r);
    return r;
  }
  function topoSort(derivations) {
    const byProduces = /* @__PURE__ */ new Map();
    for (const d of derivations) for (const p of d.produces) byProduces.set(p, d);
    const sorted = [];
    const visited = /* @__PURE__ */ new Set();
    const visiting = /* @__PURE__ */ new Set();
    function visit(d) {
      if (visited.has(d.id)) return;
      if (visiting.has(d.id)) throw new Error(`Cycle in derivations at ${d.id}`);
      visiting.add(d.id);
      for (const dep of d.dependsOn) {
        const producer = byProduces.get(dep);
        if (producer && producer.id !== d.id) visit(producer);
      }
      visiting.delete(d.id);
      visited.add(d.id);
      sorted.push(d);
    }
    for (const d of derivations) visit(d);
    return sorted;
  }
  function applyDerivations(row, derivations) {
    const sorted = topoSort(derivations);
    let r = { ...row };
    for (const d of sorted) {
      r = { ...r, ...d.compute(r) };
    }
    return r;
  }
  function validateScenario(row, constraints) {
    const failed = [];
    for (const c of constraints) {
      if (!c.predicate(row)) failed.push(c.id);
    }
    return { valid: failed.length === 0, failed };
  }

  // domains/mortgage/src/domain.ts
  var num = (v) => Number(v);
  var mortgageParameters = [
    // Borrower
    {
      name: "credit_tier",
      label: "Credit Tier",
      kind: { kind: "enum", values: ["Excellent", "Good", "Fair", "Subprime"] },
      description: "760+ / 700-759 / 660-699 / 620-659"
    },
    // Fallback params (used only when budget isn't composed in)
    {
      name: "annual_income_fallback",
      label: "Annual Income",
      kind: { kind: "discrete_numeric", values: [4e4, 6e4, 85e3, 12e4, 175e3, 25e4, 4e5] },
      unit: "USD"
    },
    {
      name: "monthly_debts_fallback",
      label: "Existing Monthly Debts",
      kind: { kind: "discrete_numeric", values: [0, 200, 500, 1e3, 2e3] },
      unit: "USD"
    },
    // Property
    {
      name: "purchase_price",
      label: "Purchase Price",
      kind: { kind: "discrete_numeric", values: [2e5, 3e5, 425e3, 55e4, 7e5, 9e5, 12e5, 18e5] },
      unit: "USD"
    },
    {
      name: "down_pct",
      label: "Down Payment %",
      kind: { kind: "discrete_numeric", values: [0, 3, 3.5, 5, 10, 15, 20, 25, 30] },
      unit: "pct"
    },
    {
      name: "property_type",
      label: "Property Type",
      kind: { kind: "enum", values: ["SFH", "Condo", "Townhouse", "MultiUnit_2_4", "Manufactured"] }
    },
    {
      name: "occupancy",
      label: "Occupancy",
      kind: { kind: "enum", values: ["Primary", "SecondHome", "Investment"] }
    },
    {
      name: "region",
      label: "Region",
      kind: { kind: "enum", values: ["StandardCost", "HighCost"] },
      description: "Drives conforming ceiling: $832,750 standard, $1,249,125 high-cost (2026)"
    },
    // Loan
    {
      name: "loan_type",
      label: "Loan Type",
      kind: { kind: "enum", values: ["Conventional", "FHA", "VA", "USDA", "Jumbo"] }
    },
    {
      name: "term_years",
      label: "Term",
      kind: { kind: "discrete_numeric", values: [15, 20, 30] },
      unit: "years"
    },
    {
      name: "rate_structure",
      label: "Rate Structure",
      kind: { kind: "enum", values: ["FixedRate", "ARM_5_1", "ARM_7_1"] }
    },
    {
      name: "points",
      label: "Discount Points",
      kind: { kind: "discrete_numeric", values: [0, 0.5, 1, 2] }
    },
    // Market
    {
      name: "rate_environment",
      label: "Rate Environment",
      kind: { kind: "enum", values: ["Low", "Current", "High"] },
      description: "Low ~4.5%, Current ~6.5% (2026), High ~8%"
    }
  ];
  var mortgageVirtualParameters = [
    {
      name: "loan_size_band",
      label: "Loan Size vs Conforming Ceiling",
      kind: { kind: "enum", values: ["within_conforming", "above_conforming"] },
      derivedFrom: ["purchase_price", "down_pct", "region"],
      compute: (r) => {
        const loanAmt = num(r.purchase_price) * (1 - num(r.down_pct) / 100);
        const limit = r.region === "HighCost" ? 1249125 : 832750;
        return loanAmt > limit ? "above_conforming" : "within_conforming";
      }
    },
    {
      name: "price_income_ratio_band",
      label: "Price/Income Ratio Band",
      kind: { kind: "enum", values: ["sane", "exotic"] },
      derivedFrom: ["purchase_price", "annual_income_fallback"],
      // Standalone-only: when composed, wired income may differ. PICT generation
      // uses the fallback; runtime validation in the predicate reads whichever
      // income is actually present in the row.
      compute: (r) => {
        const ratio = num(r.purchase_price) / num(r.annual_income_fallback);
        return ratio > 8 ? "exotic" : "sane";
      }
    }
  ];
  var mortgageConstraints = [
    {
      id: "fha_min_down",
      description: "FHA requires >=3.5% down",
      predicate: (r) => r.loan_type !== "FHA" || num(r.down_pct) >= 3.5,
      pict: `IF [loan_type] = "FHA" THEN [down_pct] >= 3.5;`
    },
    {
      id: "usda_zero_down_standard_only",
      description: "USDA is zero-down and standard-cost areas only",
      predicate: (r) => r.loan_type !== "USDA" || num(r.down_pct) === 0 && r.region === "StandardCost",
      pict: `IF [loan_type] = "USDA" THEN [down_pct] = 0 AND [region] = "StandardCost";`
    },
    {
      id: "conventional_min_down",
      description: "Conventional requires >=3% down",
      predicate: (r) => r.loan_type !== "Conventional" || num(r.down_pct) >= 3,
      pict: `IF [loan_type] = "Conventional" THEN [down_pct] >= 3;`
    },
    {
      id: "jumbo_above_conforming",
      description: "Jumbo only when loan amount exceeds 2026 conforming limit for region",
      predicate: (r) => r.loan_type !== "Jumbo" || r.loan_size_band === "above_conforming",
      pict: `IF [loan_type] = "Jumbo" THEN [loan_size_band] = "above_conforming";`
    },
    {
      id: "conventional_within_conforming",
      description: "Conventional must be at or below 2026 conforming limit",
      predicate: (r) => r.loan_type !== "Conventional" || r.loan_size_band === "within_conforming",
      pict: `IF [loan_type] = "Conventional" THEN [loan_size_band] = "within_conforming";`
    },
    {
      id: "credit_floors",
      description: "Conventional and low-down FHA exclude subprime",
      predicate: (r) => {
        if (r.credit_tier !== "Subprime") return true;
        if (r.loan_type === "Conventional") return false;
        if (r.loan_type === "FHA" && num(r.down_pct) < 10) return false;
        return true;
      },
      pict: `IF [credit_tier] = "Subprime" THEN [loan_type] <> "Conventional";
IF [credit_tier] = "Subprime" AND [loan_type] = "FHA" THEN [down_pct] >= 10;`
    },
    {
      id: "investment_loan_types",
      description: "Investment properties: Conventional or Jumbo only",
      predicate: (r) => r.occupancy !== "Investment" || r.loan_type === "Conventional" || r.loan_type === "Jumbo",
      pict: `IF [occupancy] = "Investment" THEN [loan_type] IN {"Conventional", "Jumbo"};`
    },
    {
      id: "second_home_loan_types",
      description: "Second homes: Conventional or Jumbo only",
      predicate: (r) => r.occupancy !== "SecondHome" || r.loan_type === "Conventional" || r.loan_type === "Jumbo",
      pict: `IF [occupancy] = "SecondHome" THEN [loan_type] IN {"Conventional", "Jumbo"};`
    },
    {
      id: "investment_multiunit_min_down",
      description: "Investment multi-unit needs >=25% down",
      predicate: (r) => !(r.property_type === "MultiUnit_2_4" && r.occupancy === "Investment") || num(r.down_pct) >= 25,
      pict: `IF [property_type] = "MultiUnit_2_4" AND [occupancy] = "Investment" THEN [down_pct] >= 25;`
    },
    {
      id: "manufactured_loan_types",
      description: "Manufactured homes: limited program eligibility",
      predicate: (r) => r.property_type !== "Manufactured" || ["FHA", "VA", "Conventional"].includes(String(r.loan_type)),
      pict: `IF [property_type] = "Manufactured" THEN [loan_type] IN {"FHA", "VA", "Conventional"};`
    },
    {
      id: "arm_term_compatibility",
      description: "ARMs only meaningful at 20+ year terms",
      predicate: (r) => r.rate_structure === "FixedRate" || num(r.term_years) >= 20,
      pict: `IF [rate_structure] <> "FixedRate" THEN [term_years] >= 20;`
    },
    {
      id: "income_to_price_sanity",
      description: "Price/income ratio above 8x is exotic; flag as invalid",
      predicate: (r) => {
        const income = num(r.annual_income ?? r.annual_income_fallback);
        return income > 0 && num(r.purchase_price) / income <= 8;
      },
      pict: `[price_income_ratio_band] <> "exotic";`
    }
  ];
  function baseRate(env, loanType, term, points, creditTier, ltv) {
    const envBase = { Low: 4.5, Current: 6.5, High: 8 };
    let rate = envBase[env] ?? 6.5;
    if (term === 15) rate -= 0.75;
    else if (term === 20) rate -= 0.25;
    if (loanType === "FHA") rate -= 0.25;
    else if (loanType === "VA") rate -= 0.375;
    else if (loanType === "Jumbo") rate += 0.125;
    const creditAdj = { Excellent: 0, Good: 0.25, Fair: 0.625, Subprime: 1.5 };
    rate += creditAdj[creditTier] ?? 0;
    if (ltv > 95) rate += 0.25;
    else if (ltv > 90) rate += 0.125;
    rate -= points * 0.25;
    return Math.max(rate, 2);
  }
  function amortize(principal, annualRatePct, termYears) {
    const r = annualRatePct / 100 / 12;
    const n = termYears * 12;
    if (r === 0) return principal / n;
    return principal * r / (1 - Math.pow(1 + r, -n));
  }
  function mortgageInsurance(loanType, ltv, _creditTier, loanAmt) {
    if (loanType === "FHA") {
      return loanAmt * 55e-4 / 12;
    }
    if (loanType === "Conventional" && ltv > 80) {
      const annualPct = ltv > 95 ? 0.012 : ltv > 90 ? 9e-3 : 6e-3;
      return loanAmt * annualPct / 12;
    }
    return 0;
  }
  var mortgageDerivations = [
    {
      id: "loan_amount",
      produces: ["loan_amount"],
      dependsOn: ["purchase_price", "down_pct"],
      compute: (r) => ({
        loan_amount: num(r.purchase_price) * (1 - num(r.down_pct) / 100)
      })
    },
    {
      id: "ltv",
      produces: ["ltv"],
      dependsOn: ["loan_amount", "purchase_price"],
      compute: (r) => ({
        ltv: num(r.loan_amount) / num(r.purchase_price) * 100
      })
    },
    {
      id: "note_rate",
      produces: ["note_rate"],
      dependsOn: ["rate_environment", "loan_type", "term_years", "points", "credit_tier", "ltv"],
      // Fallback derivation: only computes when no explicit note_rate exists.
      // Per spec wire-domain-into-calc.md (Q2), the calc passes the user's input
      // rate as r.note_rate; the domain must not override it. PICT-driven scenarios
      // (without an explicit rate) still get a computed value here.
      compute: (r) => r.note_rate !== void 0 ? {} : {
        note_rate: baseRate(
          String(r.rate_environment),
          String(r.loan_type),
          num(r.term_years),
          num(r.points),
          String(r.credit_tier),
          num(r.ltv)
        )
      }
    },
    {
      id: "monthly_pi",
      produces: ["monthly_pi"],
      dependsOn: ["loan_amount", "note_rate", "term_years"],
      compute: (r) => ({
        monthly_pi: amortize(num(r.loan_amount), num(r.note_rate), num(r.term_years))
      })
    },
    {
      id: "est_tax_ins",
      produces: ["est_tax_ins"],
      dependsOn: ["purchase_price"],
      compute: (r) => ({
        // Rough 1.5% annual placeholder. Real impl would be region-driven.
        est_tax_ins: num(r.purchase_price) * 0.015 / 12
      })
    },
    {
      id: "mortgage_insurance",
      produces: ["mortgage_insurance"],
      dependsOn: ["loan_type", "ltv", "credit_tier", "loan_amount"],
      compute: (r) => ({
        mortgage_insurance: mortgageInsurance(
          String(r.loan_type),
          num(r.ltv),
          String(r.credit_tier),
          num(r.loan_amount)
        )
      })
    },
    {
      id: "total_monthly_housing",
      produces: ["total_monthly_housing"],
      dependsOn: ["monthly_pi", "est_tax_ins", "mortgage_insurance"],
      compute: (r) => ({
        total_monthly_housing: num(r.monthly_pi) + num(r.est_tax_ins) + num(r.mortgage_insurance)
      })
    },
    {
      id: "dti",
      produces: ["dti", "qm_status"],
      dependsOn: ["total_monthly_housing", "monthly_existing_debts", "monthly_take_home", "annual_income_fallback", "monthly_debts_fallback"],
      compute: (r) => {
        const monthlyIncome = r.monthly_take_home !== void 0 ? num(r.monthly_take_home) : num(r.annual_income_fallback) / 12;
        const monthlyDebts = r.monthly_existing_debts !== void 0 ? num(r.monthly_existing_debts) : num(r.monthly_debts_fallback);
        const dti = monthlyIncome > 0 ? (num(r.total_monthly_housing) + monthlyDebts) / monthlyIncome * 100 : 999;
        const qm_status = dti <= 43 ? "SafeHarbor" : dti <= 50 ? "Rebuttable" : "OutsideQM";
        return { dti, qm_status };
      }
    },
    {
      id: "cash_to_close",
      produces: ["cash_to_close"],
      dependsOn: ["purchase_price", "down_pct"],
      compute: (r) => ({
        // Down payment + ~3% closing costs
        cash_to_close: num(r.purchase_price) * (num(r.down_pct) / 100) + num(r.purchase_price) * 0.03
      })
    },
    {
      id: "lifetime_interest",
      produces: ["lifetime_interest"],
      dependsOn: ["monthly_pi", "term_years", "loan_amount"],
      compute: (r) => ({
        lifetime_interest: num(r.monthly_pi) * num(r.term_years) * 12 - num(r.loan_amount)
      })
    }
  ];
  var mortgageDomain = {
    name: "mortgage",
    version: "0.1.0",
    parameters: mortgageParameters,
    virtualParameters: mortgageVirtualParameters,
    constraints: mortgageConstraints,
    derivations: mortgageDerivations,
    publishes: [
      {
        name: "monthly_housing_cost",
        type: "number",
        unit: "USD/mo",
        description: "PI + tax/ins + MI"
      },
      {
        name: "cash_to_close",
        type: "number",
        unit: "USD",
        description: "Down payment + closing costs"
      }
    ],
    subscribes: [
      {
        name: "monthly_take_home",
        type: "number",
        unit: "USD/mo",
        description: "After-tax monthly income, used as DTI denominator"
      },
      {
        name: "monthly_existing_debts",
        type: "number",
        unit: "USD/mo",
        description: "Sum of non-housing debt payments"
      }
    ],
    subscriptionFallbacks: {
      monthly_take_home: "annual_income_fallback",
      // /12 in derivation
      monthly_existing_debts: "monthly_debts_fallback"
    }
  };
  var seedScenarios = [
    // First-time buyer band
    {
      credit_tier: "Good",
      annual_income_fallback: 6e4,
      monthly_debts_fallback: 200,
      purchase_price: 2e5,
      down_pct: 3.5,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "FHA",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    {
      credit_tier: "Good",
      annual_income_fallback: 85e3,
      monthly_debts_fallback: 500,
      purchase_price: 3e5,
      down_pct: 5,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    {
      credit_tier: "Excellent",
      annual_income_fallback: 85e3,
      monthly_debts_fallback: 0,
      purchase_price: 3e5,
      down_pct: 20,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Rural / USDA
    {
      credit_tier: "Good",
      annual_income_fallback: 6e4,
      monthly_debts_fallback: 200,
      purchase_price: 2e5,
      down_pct: 0,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "USDA",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Veteran
    {
      credit_tier: "Good",
      annual_income_fallback: 85e3,
      monthly_debts_fallback: 500,
      purchase_price: 425e3,
      down_pct: 0,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "VA",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Move-up buyers
    {
      credit_tier: "Excellent",
      annual_income_fallback: 175e3,
      monthly_debts_fallback: 1e3,
      purchase_price: 7e5,
      down_pct: 20,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    {
      credit_tier: "Excellent",
      annual_income_fallback: 175e3,
      monthly_debts_fallback: 1e3,
      purchase_price: 7e5,
      down_pct: 20,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 15,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Jumbo / high-cost area
    {
      credit_tier: "Excellent",
      annual_income_fallback: 25e4,
      monthly_debts_fallback: 500,
      purchase_price: 9e5,
      down_pct: 10,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Jumbo",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    {
      credit_tier: "Excellent",
      annual_income_fallback: 4e5,
      monthly_debts_fallback: 0,
      purchase_price: 12e5,
      down_pct: 25,
      property_type: "SFH",
      occupancy: "Primary",
      region: "HighCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 1,
      rate_environment: "Current"
    },
    {
      credit_tier: "Excellent",
      annual_income_fallback: 4e5,
      monthly_debts_fallback: 0,
      purchase_price: 18e5,
      down_pct: 25,
      property_type: "SFH",
      occupancy: "Primary",
      region: "HighCost",
      loan_type: "Jumbo",
      term_years: 30,
      rate_structure: "ARM_7_1",
      points: 1,
      rate_environment: "Current"
    },
    // Condo
    {
      credit_tier: "Good",
      annual_income_fallback: 12e4,
      monthly_debts_fallback: 500,
      purchase_price: 425e3,
      down_pct: 10,
      property_type: "Condo",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Investment SFH
    {
      credit_tier: "Excellent",
      annual_income_fallback: 25e4,
      monthly_debts_fallback: 1e3,
      purchase_price: 425e3,
      down_pct: 25,
      property_type: "SFH",
      occupancy: "Investment",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Multi-unit owner-occupied (house hack)
    {
      credit_tier: "Good",
      annual_income_fallback: 12e4,
      monthly_debts_fallback: 500,
      purchase_price: 55e4,
      down_pct: 5,
      property_type: "MultiUnit_2_4",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Multi-unit investment
    {
      credit_tier: "Excellent",
      annual_income_fallback: 25e4,
      monthly_debts_fallback: 1e3,
      purchase_price: 7e5,
      down_pct: 25,
      property_type: "MultiUnit_2_4",
      occupancy: "Investment",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Second home
    {
      credit_tier: "Excellent",
      annual_income_fallback: 25e4,
      monthly_debts_fallback: 500,
      purchase_price: 55e4,
      down_pct: 20,
      property_type: "SFH",
      occupancy: "SecondHome",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Stretched / Fair credit
    {
      credit_tier: "Fair",
      annual_income_fallback: 6e4,
      monthly_debts_fallback: 1e3,
      purchase_price: 3e5,
      down_pct: 3.5,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "FHA",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Subprime FHA with bigger down
    {
      credit_tier: "Subprime",
      annual_income_fallback: 6e4,
      monthly_debts_fallback: 500,
      purchase_price: 2e5,
      down_pct: 10,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "FHA",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Manufactured home
    {
      credit_tier: "Good",
      annual_income_fallback: 6e4,
      monthly_debts_fallback: 200,
      purchase_price: 2e5,
      down_pct: 5,
      property_type: "Manufactured",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "FHA",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // 15-year aggressive payoff
    {
      credit_tier: "Excellent",
      annual_income_fallback: 175e3,
      monthly_debts_fallback: 0,
      purchase_price: 425e3,
      down_pct: 20,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 15,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Points-bought-down
    {
      credit_tier: "Excellent",
      annual_income_fallback: 175e3,
      monthly_debts_fallback: 500,
      purchase_price: 55e4,
      down_pct: 20,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 2,
      rate_environment: "Current"
    },
    // ARM bets
    {
      credit_tier: "Excellent",
      annual_income_fallback: 25e4,
      monthly_debts_fallback: 500,
      purchase_price: 7e5,
      down_pct: 20,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "ARM_5_1",
      points: 0,
      rate_environment: "Current"
    },
    // Different rate environments (sensitivity scenarios)
    {
      credit_tier: "Excellent",
      annual_income_fallback: 175e3,
      monthly_debts_fallback: 500,
      purchase_price: 55e4,
      down_pct: 20,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Low"
    },
    {
      credit_tier: "Excellent",
      annual_income_fallback: 175e3,
      monthly_debts_fallback: 500,
      purchase_price: 55e4,
      down_pct: 20,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "High"
    },
    // High-cost area moderate buyer
    {
      credit_tier: "Excellent",
      annual_income_fallback: 25e4,
      monthly_debts_fallback: 500,
      purchase_price: 9e5,
      down_pct: 20,
      property_type: "Condo",
      occupancy: "Primary",
      region: "HighCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // 20-year compromise
    {
      credit_tier: "Good",
      annual_income_fallback: 12e4,
      monthly_debts_fallback: 500,
      purchase_price: 425e3,
      down_pct: 15,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 20,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Townhouse first-timer
    {
      credit_tier: "Good",
      annual_income_fallback: 85e3,
      monthly_debts_fallback: 200,
      purchase_price: 3e5,
      down_pct: 5,
      property_type: "Townhouse",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Aggressive jumbo high-cost
    {
      credit_tier: "Excellent",
      annual_income_fallback: 4e5,
      monthly_debts_fallback: 1e3,
      purchase_price: 18e5,
      down_pct: 20,
      property_type: "SFH",
      occupancy: "Primary",
      region: "HighCost",
      loan_type: "Jumbo",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 1,
      rate_environment: "Current"
    },
    // VA jumbo
    {
      credit_tier: "Excellent",
      annual_income_fallback: 175e3,
      monthly_debts_fallback: 500,
      purchase_price: 7e5,
      down_pct: 0,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "VA",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Strained DTI candidate
    {
      credit_tier: "Fair",
      annual_income_fallback: 85e3,
      monthly_debts_fallback: 2e3,
      purchase_price: 425e3,
      down_pct: 5,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "FHA",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    },
    // Mid-range typical
    {
      credit_tier: "Good",
      annual_income_fallback: 12e4,
      monthly_debts_fallback: 500,
      purchase_price: 425e3,
      down_pct: 10,
      property_type: "SFH",
      occupancy: "Primary",
      region: "StandardCost",
      loan_type: "Conventional",
      term_years: 30,
      rate_structure: "FixedRate",
      points: 0,
      rate_environment: "Current"
    }
  ];
  function buildMortgageScenarios() {
    return seedScenarios.map((row, i) => {
      const withBuckets = applyVirtualParams(row, mortgageDomain.virtualParameters ?? []);
      const derived = applyDerivations(withBuckets, mortgageDomain.derivations);
      const { valid, failed } = validateScenario(derived, mortgageDomain.constraints);
      const provenance = {};
      for (const k of Object.keys(derived)) provenance[k] = "mortgage";
      return {
        id: `scn_${String(i + 1).padStart(3, "0")}`,
        row: derived,
        provenance,
        valid,
        failed
      };
    });
  }

  // domains/mortgage/src/amortization.ts
  function amortizationSchedule(input) {
    const { loan_amount, note_rate, term_years } = input;
    const out = [];
    if (loan_amount <= 0 || note_rate <= 0 || term_years <= 0) return out;
    const monthlyRate = note_rate / 100 / 12;
    const n = term_years * 12;
    const monthlyPayment = loan_amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n));
    let balance = loan_amount;
    for (let m = 1; m <= n; m++) {
      const interest = balance * monthlyRate;
      const principal = monthlyPayment - interest;
      balance -= principal;
      out.push({
        month: m,
        year: m / 12,
        principal,
        interest,
        balance: Math.max(0, balance)
      });
    }
    return out;
  }

  // domains/mortgage/src/archetypes.ts
  function rateFor(scenario) {
    const loanAmt = Number(scenario.purchase_price) * (1 - Number(scenario.down_pct) / 100);
    const ltv = loanAmt / Number(scenario.purchase_price) * 100;
    return baseRate(
      String(scenario.rate_environment),
      String(scenario.loan_type),
      Number(scenario.term_years),
      Number(scenario.points),
      String(scenario.credit_tier),
      ltv
    );
  }
  var _archetypes = [
    {
      id: "first-time-buyer-fha",
      name: "First-time Buyer (FHA)",
      tagline: "$200K starter home, 3.5% down, FHA",
      scenario: {
        credit_tier: "Good",
        annual_income_fallback: 6e4,
        monthly_debts_fallback: 200,
        purchase_price: 2e5,
        down_pct: 3.5,
        property_type: "SFH",
        occupancy: "Primary",
        region: "StandardCost",
        loan_type: "FHA",
        term_years: 30,
        rate_structure: "FixedRate",
        points: 0,
        rate_environment: "Current"
      },
      displayedRate: 0
      // computed below
    },
    {
      id: "move-up-buyer",
      name: "Move-up Buyer",
      tagline: "$700K family home, 20% down, 30-year fixed",
      scenario: {
        credit_tier: "Excellent",
        annual_income_fallback: 175e3,
        monthly_debts_fallback: 1e3,
        purchase_price: 7e5,
        down_pct: 20,
        property_type: "SFH",
        occupancy: "Primary",
        region: "StandardCost",
        loan_type: "Conventional",
        term_years: 30,
        rate_structure: "FixedRate",
        points: 0,
        rate_environment: "Current"
      },
      displayedRate: 0
    },
    {
      id: "investor-sfh",
      name: "Investor (SFH)",
      tagline: "$425K rental, 25% down, Conventional",
      scenario: {
        credit_tier: "Excellent",
        annual_income_fallback: 25e4,
        monthly_debts_fallback: 1e3,
        purchase_price: 425e3,
        down_pct: 25,
        property_type: "SFH",
        occupancy: "Investment",
        region: "StandardCost",
        loan_type: "Conventional",
        term_years: 30,
        rate_structure: "FixedRate",
        points: 0,
        rate_environment: "Current"
      },
      displayedRate: 0
    },
    {
      id: "veteran-va",
      name: "Veteran (VA)",
      tagline: "$425K home, 0% down, VA loan",
      scenario: {
        credit_tier: "Good",
        annual_income_fallback: 85e3,
        monthly_debts_fallback: 500,
        purchase_price: 425e3,
        down_pct: 0,
        property_type: "SFH",
        occupancy: "Primary",
        region: "StandardCost",
        loan_type: "VA",
        term_years: 30,
        rate_structure: "FixedRate",
        points: 0,
        rate_environment: "Current"
      },
      displayedRate: 0
    },
    {
      id: "jumbo-high-cost",
      name: "Jumbo / High-cost",
      tagline: "$1.8M home in high-cost area, 20% down, Jumbo",
      scenario: {
        credit_tier: "Excellent",
        annual_income_fallback: 4e5,
        monthly_debts_fallback: 1e3,
        purchase_price: 18e5,
        down_pct: 20,
        property_type: "SFH",
        occupancy: "Primary",
        region: "HighCost",
        loan_type: "Jumbo",
        term_years: 30,
        rate_structure: "FixedRate",
        points: 1,
        rate_environment: "Current"
      },
      displayedRate: 0
    },
    {
      id: "fifteen-year-payoff",
      name: "15-year Payoff",
      tagline: "$425K home, 20% down, 15-year fixed for faster payoff",
      scenario: {
        credit_tier: "Excellent",
        annual_income_fallback: 175e3,
        monthly_debts_fallback: 0,
        purchase_price: 425e3,
        down_pct: 20,
        property_type: "SFH",
        occupancy: "Primary",
        region: "StandardCost",
        loan_type: "Conventional",
        term_years: 15,
        rate_structure: "FixedRate",
        points: 0,
        rate_environment: "Current"
      },
      displayedRate: 0
    }
  ];
  for (const a of _archetypes) {
    a.displayedRate = rateFor(a.scenario);
  }
  var archetypes = _archetypes;
  return __toCommonJS(index_exports);
})();
