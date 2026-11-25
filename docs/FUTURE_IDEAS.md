# Future ideas (FUTURE_IDEAS.md)

Ye file AI ke liye hai. Yahan wo cheezein hain jo ABHI NAHI banani, par future me planning karke banayenge.

## AI ke liye niyam (pehle padho)
1. Is file ki koi bhi cheez tab tak mat banao jab tak owner saaf na kahe ("Part V shuru karo" jaisa). Sirf padhna aur planning karna theek hai.
2. Ye file docs/PLAN.md ko nahi badalti. PLAN me jo pehle se likha hai wahi sach hai; yahan sirf ek jagah par list hai, aur section B me PLAN ke "baad me" wale items ke pointer hain (copy nahi, taaki do jagah na badle).
3. Section A ki cheez banane se pehle: (a) owner se confirm, (b) docs/PLAN.md me naya Part (jaise Part V) ya task likho, (c) docs/DECISIONS.md me faisla, (d) tab code. Phase 11 ke niyam (ek samay par ek feature, kill criteria, "mahine me kitni baar use karoge?") yahan bhi lagu hain.
4. Naya idea mile to Section A me jodo: ek heading, "Kyun", "Kya", "Kab uthao", "Kya na karo", "Status".
5. UI sirf English (docs/DECISIONS.md, 2026-11-22). Final design (docs/design/final/) proposal par jeet-ta hai.

---

# A. Naye ideas (chat se, abhi PLAN me nahi)

## A1. Doctor without receptionist (Part V ka draft)
Status: idea, 2026-11-25. PLAN me abhi nahi. Design: owner ka HTML chahiye (ya agent app ke maujooda styling me banaye, owner se poochho).

Kyun: Part T (Doctor Today) maanta hai ki desk par receptionist hai. Agar kisi doctor ke paas receptionist hi nahi, to patient ko andar bhejna, "Arrived" mark karna, walk-in, naya patient, bill aur payment, sab doctor ko khud karna padega, aur uski Today screen par ye sab hai nahi.

Backend ki sthiti: rukawat nahi. `appointments.manage` aur `patients.edit` doctor ke paas pehle se (packages/db/src/permissions.ts). Kami zyada tar doctor ke UI me hai.

Kya (V1 se V4):
- V1: Settings me clinic setting "Receptionist: Yes / No" (tunable; shared tunables.ts + SETTING_SCHEMAS). Default Yes, taaki maujooda clinic na badle.
- V2: "No" hone par doctor ki Today par: row par "Arrived" (ya Start dabane par apne aap arrived), header me "+ Walk-in" (naam, phone, shikayat) aur "+ New patient" (wahi maujooda form). Late, Skip, Pull forward, Break Part T jaise.
- V3: "Waiting for you" me receptionist ke requests nahi (koi bhejne wala nahi); discount aur refund doctor khud approve kare (bills.adjust pehle se doctor ke paas).
- V4: Visit "Done" ke baad doctor ke liye "Bill" aur "Send receipt" (wa.me link, jaise receptionist ka hai). Reminder aur dues call ki list doctor ke liye ek chhoti card.

Teen tareeke (clinic ke size ke hisaab se):
1. Doctor sab khud kare (V1 se V4).
2. Patient khud check-in kare: phone par QR ya clinic ke tablet par "I'm here". Iske liye naya patient-facing page chahiye (abhi koi nahi; public website cancelled hai, PLAN 8.5 se 8.9). Alag baad ka kaam, privacy aur abuse ka poora socho (koi bhi QR se kisi ka naam daal sakta hai).
3. Koi aur sambhale (compounder, assistant): receptionist role ke login se. Code nahi chahiye, sirf Settings > Staff.

Kab uthao: Part T ka gate pass hone ke baad, aur tab jab koi asli doctor bina receptionist ke use karna chahe. Pehle pilot clinic me puchho ki receptionist hai ya nahi.

Kya na karo: naya role mat banao (roles fixed list: doctor, receptionist, developer); receptionist ke paise ke niyam (D4: refund/cancel doctor se) doctor ke liye dheele mat karo bina owner ke; patient ke self check-in se pehle V1 se V4 mat roko.

Kill criteria: pilot me koi bhi doctor bina receptionist ke nahi chala to V ko Phase 11 ke pool me hi rehne do.

## A2. Prescription: allergy aur pregnancy notice (baad me)
Status: owner ne kaha "baad me dekhenge", 2026-11-25. PLAN me abhi nahi.

Kyun: design review (docs/design/reviews/prescription-tab.md, A1) me mila ki design me allergy/pregnancy notice nahi hai. Owner ne abhi ke liye chhoda hai. Total "approx." abhi jaisa hai waisa rahega.

Kya (jab uthao):
- Dawai add hote hi, patient ki allergy list aur medicine ke `tags` match karke ek line: "Allergy: Penicillin (patient history) - Amoxicillin." Pregnancy alert + pregnancy-tagged dawai par bhi.
- Sirf jaankari, kabhi block nahi (Issue/Print nahi rukte). Receptionist ko kabhi nahi dikhta.
- Free-typed dawai ke tags nahi hote, isliye uske liye notice nahi (brief ka open question 2).

Kaise (backend): `prescription_items.tags` pehle se hai. Patient ki allergies aur pregnancy alert visit ke saath load karni hongi (check: visit-prefetch me hai ya nahi). Computation screen par, koi naya table nahi. Chhota kaam.

Kya na karo: dose calculator, interaction engine, dawai suggest karna (project rule).

## A3. Visit page par AI: shikayat/findings help aur "AI se poochho" (RAG)
Status: idea, 2026-11-25. PLAN me nahi. Bada kaam, pehle privacy sochni hai.

Kyun: doctor visit par complaint aur findings likhta hai; AI usme madad kar sakta hai (jaise bole hue ya chhote notes ko saaf likhna). Doosra: doctor AI se pooch sake "is patient ke bare me kya hai, kya nahi hai" (jaise pehle kaun si dawai di, allergy, kis daant par kya hua).

Kya:
- AI-1: Complaint & Findings box me "Clean up" jaisa button: doctor ke likhe ko saaf/short karna. Doctor accept kare tabhi text badle; kabhi apne aap save nahi.
- AI-2: RAG: us patient ka apna record (visits, notes, prescriptions, plan, files ke naam) index karke doctor sawal pooche; jawab ke saath "yeh record se aaya" ka source link. Jo record me nahi hai usko "record me nahi mila" bole, andaza na lagaye.
- Sirf doctor ke liye. Receptionist ko nahi.

Kya dhyan me rakhna (pehle faisla chahiye): patient ka clinical data kisi bahari AI service ko jaata hai, to privacy: owner ki maanjoori, patient ki sahmati ka tareeka, DATA/PRIVACY docs (PRIVACY_READINESS.md, THREAT_MODEL.md) dekho, health info ka log/retention, aur kharcha (quota). Project rule: koi dawai suggest nahi, dose calculator nahi, interaction check nahi: AI-2 ko ye rule todne nahi dena (sirf record dikhana, salah nahi).

Kab uthao: visit page ke design final hone ke baad, aur privacy ka faisla hone par.

Kill criteria: pilot me doctor mahine me kam use kare to band.

## A4. (khaali, naya idea yahan jodo)

---

# B. PLAN me pehle se likhe future ideas (sirf pointer; PLAN hi sach hai)

Neeche ki har cheez docs/PLAN.md me likhi hai. Ye list sirf jaldi dhoondhne ke liye hai. PLAN badle to yahan line badalna zaroori nahi; PLAN dekho.

## B1. Part T ke baad ke kaam (PLAN "Part T ke baad ke kaam", owner kahe tab)
- T3.1 App-wide re-theme: HTML ke rang, sidebar aur self-hosted fonts (Instrument Sans, Wix Madefor, Spline Sans Mono).
- T3.2 Approval ka auto-apply (emergency insert se appointment apne aap, refund approve par refund form).
- T3.3 "Always allow" toggle (jaise Rs 100 tak ka discount bina poochhe).
- T3.4 Break ke dauran Next patient ko "doctor wapas 1:15" ka message (SMS/WhatsApp).
- T3.5 Visit chalte lunch ka planned break.

## B2. Part U (Doctor Visit page): "Tay hua, design ka intezaar" (U9)
Visit page ka final design aane par ye jude. PLAN me "Part U" dekho.

## B3. Phase 11: launch ke baad ke naye features (PLAN "Phase 11")
Pilot ke 30 din baad hi; ek samay par ek feature. Naye features: perio chart, lab work tracker, kharcha aur stock, imaging ka agla kadam (OHIF/Cornerstone, DICOM), digital consent, ABHA/ABDM ka faisla, badhne ke trigger (paid Cloudflare plan), rajya ke clinic kanoon (CE Act) ka check (11.7.1). Phase 11 me pehle se "Pakka kya hai aur anuman kya hai" bhi hai; use mat dohrao.

## B4. Phase 1 se 10 ke "baad me" tasks ka pool (119 ghante, PLAN "Pehle se likhe 'baad me' tasks ka pool")
Theme-wise table PLAN me hai. Task naam, jaldi dhoondhne ke liye:
- Receptionist ki raftaar: 2.3.9 din ya samay block, 2.3.10 follow-up madadgaar, 2.3.11 waitlist, 2.4.5 appointment slip, 2.4.6 week view.
- Patient: 2.1.10 do patients ko jodna (merge), 2.2.6 CSV export, 2.6.6 paper ki photo jodna, 1.5.5 CSV import.
- Clinical: 3.5.10 visit templates, 3.6.3 sittings ka hisaab (DECISIONS: abhi skip), 3.7.8 DICOM dekhna, 3.9.1 maang ka register (DCI), 3.9.2 records ka bundle.
- Documents: 4.4.4 referral letter, 4.4.5 treatment summary, 4.4.7 aftercare sheets (English only), 4.4.8 parche par QR.
- Billing: 5.3.13 kisht ka schedule, 5.3.14 thermal printer layout.
- Reports: 6.3.9 intezaar aur kursi ka istemal, 6.3.10 umar aur gender, 6.4.3 mahine ka email, 6.4.4 saal-dar-saal.
- Messages: 7.3.5 aaye hue reply ki list, 7.5.4 aftercare WhatsApp templates, 7.5.5 birthday wish, 7.6.1 Brevo email.
- Patient portal: 8.3.10 treatment plan aur documents patient ko dikhao, 8.3.11 home screen icon (portal ka scope PLAN me dekho).
- Staff app: 1.4.10 speed budget, 1.6.5 staff status page, 1.3.6 user admin (ab ho chuka).
- Testing aur launch: 9.4.4 failure drills, 9.5.6 chhote videos, 10.5.4 purane cards ka scan, 10.5.5 poori list ka bulk import.

## B5. Doosri docs me khule sawal / ideas
- docs/HANDOFF.md: cancel Undo ke baad "Your visit is back on" ka apne aap message (template wording doctor ko confirm karna).
- docs/DECISIONS.md: 1.5.2 clinic logo (R2 binding chahiye, deferred); 5.4.2 billing domain events (2.5.1 par depend); D1 refund rule CA se confirm.

## B6. CANCELLED hain, dobara mat uthao (bina owner ke)
Public website (PLAN 8.5 se 8.9, 8.7.3 photo upload, 8.9.2 callback form, 8.5.5 domain email), Hindi/translation (1.4.9, 4.5.3, 8.3.8, 8.6.9), patient education articles (8.6.10). Karan: docs/DECISIONS.md.
