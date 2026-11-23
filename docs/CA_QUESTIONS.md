# CA questions for clinic billing (task 5.1.1)

**DRAFT - accountant to confirm.** Answers below are placeholders until the clinic CA replies in writing. Do not treat them as tax advice. Software defaults stay conservative (no GST) until confirmed.

| # | Question | Draft answer (placeholder) |
|---|----------|----------------------------|
| 1 | GST registration now or later? | **No GST for now.** Clinic treats work as exempt healthcare until CA says otherwise. Setting `billing.gst_mode` = `off`. |
| 2 | Which procedures count as "beauty / cosmetic" (taxable)? | **None decided.** Categories `exempt` (0%) and `cosmetic` (18% bp stored) exist in schema for later; rates unused while gst_mode is off. |
| 3 | Bill form: bill of supply or tax invoice? | **Bill of supply style** while gst_mode is off. Print says "This is not a GST invoice" until CA confirms. |
| 4 | Cash ₹2 lakh limit (IT Act / s.186)? | **Warn in UI** when a single cash receipt ≥ ₹2,00,000; staff must split or use non-cash. No hard legal block until CA confirms wording. |
| 5 | How many years to keep books and bills? | **Placeholder: 8 years.** Soft retention note only; no auto-delete. |
| 6 | Presumptive tax (44ADA) and cash vs digital share? | **Unknown.** Daily close shows cash vs digital share for the CA; no presumptive logic in code. |
| 7 | What must appear on the bill? | **Clinic name, address, phone, doctor name, patient name+code, bill no, date, items, totals in paise/INR, amount in words, "not a GST invoice" while gst_mode off.** Registration number when set in Settings. |

Owner action: send this page to the CA; replace Draft answers with written replies; then update Settings / print copy if needed.
