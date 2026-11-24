CANCELLED: 8.5-8.9 (public website)

Dental clinic software: ultra detail build plan
Nov 21, 2026  ·  @Shubham Kumar
Summary: pehle ye padho
Seedhi baat. Aapke clinic ka poora software (staff app, patient portal, SMS aur WhatsApp
ke reminders, public website) free tools par ban sakta hai, aur pehle saal ka tay kharcha
lagbhag ₹ 730 hoga (sirf domain). Par ye chhota kaam nahi hai: Phase 0 se 10 me 487 tasks
aur lagbhag 1,097 ghante ka core kaam hai (119 ghante 'baad me' wale alag; Unified Patient
History +34 core, docs/PATIENT_HISTORY.md; pehle 477 tasks / 1,063 h). 20 ghante per
hafte par pilot shuru hone tak lagbhag 51 hafte lagte hain, aur go-live lagbhag 13
December 2027 ko hota hai (kaam 23 November 2026 se shuru maan kar; pehle 1,063 /
29 Nov 2027 tha). Ye meri ganit
hai, kisi data par nahi, aur Phase 1 ke asli ghante milte hi dobara nikalni hai.
Meri salaah: pehle staff app. Pehle clinic ka andar ka kaam (Phase 0 se 6, Phase 9, privacy
ke tasks 8.10 aur 8.2.11, aur Phase 10 ka pilot), portal aur messaging baad me. Isse go-live
lagbhag 12 hafte pehle, 20 September 2027 ko ho jata hai (pehle 6 Sep 2027; Cut A / raasta 2
pre-pilot ab 772 ghante), aur Phase 7 aur 8 ka baaki hissa
(reminders, portal, public website; 243 ghante) pilot ke review ke baad aata hai. Velocity
1.0 par wo 25 January 2028 tak poora hota hai, yani poora plan lagbhag usi samay poora
hota hai jab poore plan ka review khatam hota hai. Agar public website
pehle chahiye to uska alag chhota raasta lagbhag 95 ghante ka hai (20 ghante per hafte
par 5 hafte). Dono raaste aur 10 se 30 ghante per hafte ki tareekhein 'Samay aur mehnat'
section me hain.
Agar kaam dheere hua. Tareekhein is par tiki hain ki mere ghante ke anuman sahi nikle, aur
pehli baar ke anuman aksar kam padte hain (meri soch, koi data nahi). Agar har task
lagbhag 1.4 guna zyada samay le, to poore plan ka go-live lagbhag 24 April 2028 ko jata hai,
aur 2 guna zyada par 17 November 2028 ko. Isliye Phase 1 ke gate par asli ghante milao: wo
lagbhag 133 (plan ke 1.3 guna) se upar nikle to tareekhein badal do.
DPDP ki tareekh pehle aa sakti hai. DPDP ke zyadatar niyam lagbhag 12 ya 13 May 2027 se
lagu hote hain (sources me ek din ka farak hai). Asli patients ka asli data pilot ke shadow
me hi aa jata hai, jo zyadatar scenarios me is tareekh ke baad hoga, isliye privacy notice,
consent, breach plan aur anurodh ka process pilot se pehle taiyar hona chahiye (8.10.1,
9.3.8, 9.3.9, 10.1.14).
Dental clinic software: ultra detail build plan
Page 1 of 150

Phase map
Phase 0 se 10 ka jod 1,097 core ghante hai (pehle 1,063; +34 Unified Patient History).
Har phase ke end me ek gate hai: jab tak wo
pass na ho, agla phase shuru nahi hota.
Mukhya faisle (kyun, Tech decisions me)
Ek hi Cloudflare Worker par sab. Staff app aur patient portal (Vite + React), public
website (Astro, static) aur API (Hono). Database D1 (SQLite), files R2. Pehle research
doc ka Neon aur Next.js badla: free Worker me 10 ms CPU aur 3 MB hi milta hai, aur D1
me 7 din ka restore hai. Ye faisla Phase 0 ka spike pass hone par hi final hota hai.
Phase Kya banta hai Core ghante
0 Discovery aur taiyari: clinic ke sawal, documents,
accounts, hardware, aur spike (free tools sach me
chalte hain ya nahi)
73
1 Foundation: repo, database, login, app shell, backup 102
2 Patient aur appointment, kagaz ka data 107
3 Clinical record: tooth chart, visit, treatment plan,
files, sahmati, unified History (Stage 1)
166
4 Parcha, dawai ki list aur print (+ History Rx Stage 2) 69
5 Billing: bill, receipt aur CA ke sawal (+ History $ Stage 3) 68
6 Dashboard, reports aur settings (+ History polish Stage 4) 73
7 Reminders aur messaging: SMS, WhatsApp, email 97
8 Patient portal aur public website 155
9 Hardening: backup, downtime, security, speed,
documents
83
10 Pilot aur go-live: kagaz se software par, bina clinic
roke
104
11 Launch ke baad: naye features ek ek karke, trigger
par
88
Dental clinic software: ultra detail build plan
Page 2 of 150

Login. Staff ke liye Cloudflare Access (teen email, one-time PIN). Patient ke liye OTP
aur password dono; password ka hash browser me banta hai aur server par sirf HMAC
milaya jata hai.
Parcha. Browser se print hota hai, aur har finalise record ka ek snapshot rakha jata hai
jo badla nahi ja sakta. Server par PDF nahi.
Messaging. SMS ek purane Android phone se (alag SIM, sms-gate.app ka gateway),
WhatsApp receptionist ke ek click se (wa.me), email Brevo se. SMS ya WhatsApp me
ilaaj ya dawai ki jaankari kabhi nahi.
Data ki suraksha. Finalise hua record lock, sudhaar addendum se, delete sirf soft;
paise integer paise me; bill aur receipt ke number har saal gap-free. Teen backup: D1
Time Travel, raat ka encrypted export B2 par, haftawar clinic PC ki copy, aur har ek par
Healthchecks ka alarm.
Badalna aasan. SMS provider, email aur storage interface ke peeche hain. Dawai ki list,
timing aur clinic ki details doctor khud edit karti hain; dose calculator ya interaction
engine nahi.
Kharcha
Pehle saal ka tay kharcha lagbhag ₹ 730 (domain). SIM ka recharge, hardware, vakeel ya CA
ki fees, aur agar kabhi paid Cloudflare plan ($5 per mahina) ya DLT lena pade to wo ₹ 1,000
ke budget se bahar hain, aur sister ki manzoori ke bina nahi. Sarkari eSushrut@Clinic ( ₹ 299
per mahina) bhi dekha: budget se bahar hai aur daant ka chart nahi dikha, isliye nahi liya
(Sources section me).
Sabse bade khatre
Risk register me 21 khatre hain, bachav ke tasks ke saath. Upar ke chhe (score 6):
Developer akela hai (busy, beemar ya chhod de): bachav README, runbooks, sab
accounts sister ke naam, aur ek dost developer.
Mehnat andaaz se zyada nikle: 'baad me' tags, phase gates, spike pehle, Phase 1 par
dobara hisaab.
Receptionist shadow me thak jaye: shadow sirf 2 hafte, super-user, rollback ke triggers.
Sister ko software kagaz se behtar na lage: parcha unke saath design, har gate par
demo, jo wo use nahi karegi wo banega nahi.
Asli patient data developer ke laptop par: encrypted laptop, har drill ke baad secure
delete, staging me asli data kabhi nahi.
Scope badhta jaye: gates, 'Mat karo' lists, ek feature ek samay.
Dental clinic software: ultra detail build plan
Page 3 of 150

Aapse chahiye
1. Hafte me kitne ghante de sakte ho (10, 15, 20 ya 30)? Saari tareekhein isi par tiki hain.
2. Pehle staff app (meri salaah) ya poora plan ek saath? Aur public website pehle chahiye
ya baad me?
3. Clinic kis rajya me hai? Rajya ka clinic kanoon aur ABDM ka order isi par nirbhar hai
(0.5).
4. SMS ke liye alag SIM kaun si hogi, aur patients jis number par jawab ya call karenge wo
kaun sa hoga (0.3.7, 7.1.4, 7.4)?
5. Ek dost developer ka naam, jo README se project chala sake.
Plan ko kaise padhein
Sabse pehle Phase 0 ke spike (0.6): free tools ke asli test. Koi test fail ho to fallback
Tech decisions me likha hai.
Har phase me: kya banega, tasks (checkbox, size, 'Done jab' test), 'Mat karo' aur gate.
Size: S=1, M=3, L=6, XL=12 ghante. Jis task me 'baad me' likha hai wo core ghanton me
nahi gina.
'Pakka' (link ke saath padha hua) aur 'Anuman' (meri soch ya check nahi kiya) alag likhe
hain. Sources section me har anuman ke saath wo task hai jo use pakka karega.
Research web pages se hui hai; YouTube videos maine nahi dekhe.
Koi naya feature maangna ho to pehle 'Jo nahi banana hai' section dekho.
Tech decisions: kya use hoga aur kyu
Stack Cloudflare par hi rahega, lekin pehle wale research doc se do cheezein badal rahi
hain: database Neon ki jagah D1 (SQLite), aur app Next.js ki jagah Vite React + Hono.
Kaaran free plan ki limits hain, aur yeh faisla Phase 0 ka spike pass hone par hi final hoga.
Free Worker ko har request par sirf 10 ms CPU milta hai aur uska size 3 MB (gzip ke baad)
se zyada nahi ho sakta. Cloudflare ke hisaab se aam Worker ~2.2 ms leta hai, lekin
authentication ya server-side rendering jaise kaam 10 se 20 ms tak jaate hain. OpenNext
ke docs me 3 MiB wali error alag se likhi hai, aur ek developer ne ek simple route par 60 se
120 ms CPU bataya hai. Isliye Next.js free plan par jokhim hai.
D1 free me 500 MB database aur 7 din tak kisi bhi minute par restore deta hai, jabki hamara
data (snapshots aur audit ke saath) 50 se 100 MB per saal ka mera andaza hai, yani 500 MB
me 5 se 10 saal. Neon me restore sirf 6 ghante ka tha aur 5 minute baad scale-to-zero hota
Dental clinic software: ultra detail build plan
Page 4 of 150

tha (meri pehli research ke hisaab se). D1 ki kami yeh hai ki usme BEGIN/COMMIT wala
interactive transaction nahi hota. Kai sources db.batch()  ko atomic tareeka batate hain,
par ek purane README me ulta likha tha, isliye spike 0.6.3 me khud test karenge.
Free limits jo design tay karte hain
Limit Free plan me Design par asar
Worker CPU time per
request
10 ms Password hash, PDF, image
resize server par nahi, browser
me
Worker size (gzip ke
baad)
3 MB Chhoti libraries (Hono,
Drizzle); frontend alag static
files me
External subrequests
per invocation
50 (Cloudflare services ke liye
1,000)
Cron ek baar me 30 se zyada
subrequest nahi karega (7.2.5),
aur default me sirf 5 SMS
bhejega
Requests per day 100,000, midnight UTC (subah
5:30 IST) par reset
Public endpoints par Turnstile
aur rate limit, usage alert
Static asset requests Free aur unlimited Frontend static rahega, sirf API
par Worker chalega
Cron triggers per
account
5 Ek hi cron, har 5 minute, andar
time se branching
D1 database size 500 MB Kai saal ka room
D1 queries per
invocation
50 (ek batch = 1 query) Har API call me kam queries,
multi-step write ek batch me
D1 rows read / written
per day
5 million / 100,000 Indexes zaruri, dashboard
summary tables se
D1 Time Travel 7 din, kisi bhi minute par Galti par restore, monthly drill
D1 export Chalte export me baaki
requests ruk jaati hain, FTS5
tables ke saath fail
Backup raat ko, FTS5 nahi
Dental clinic software: ultra detail build plan
Page 5 of 150

Source (Nov 2026): Workers limits, Workers pricing, subrequests changelog, D1 limits, D1
product page, D1 import and export.
Faisla register (T1 se T10)
# Kaam Faisla Kyu Spike fail ho to plan
B
T1 Hosting Cloudflare Workers
Free: ek Worker me
static frontend aur
Hono API
Static requests free
hain aur average API
request ~2.2 ms
CPU leti hai
CPU kam pade to
Workers Paid $5 per
month, jo ₹ 1,000 per
saal se bahar hai,
isliye pehle sister se
poochna
T2 Database D1 (SQLite), location
hint apac, Drizzle se
migrations
500 MB, 7 din ka
point-in-time
restore, cold start
nahi. Ek developer
ne India se APAC D1
ka response ~300
ms bataya
Neon Postgres free
(Singapore), Drizzle
se port aasan
T3 Staff login Cloudflare Access,
email par one-time
PIN, 50 users tak free
Receptionist ko
password yaad nahi
rakhna, aur staff
login ka code hum
nahi likhte
Khud ka email +
password login
(browser me KDF)
aur authenticator
app
T4 Patient login SMS OTP aur
password dono.
Password ka slow
hash browser me,
server par sirf tez
HMAC check
Free Worker me
strong hash nahi
aata: OWASP kam se
kam 6 lakh PBKDF2-
SHA256 iterations
kehta hai, free-tier
libraries 20,000 se
80,000
Sirf OTP, ya server
par 80,000 tak
iterations (OWASP
se kamzor) aur strict
rate limit
T5 X-ray aur
photo
R2 private bucket, file
Worker auth check ke
baad hi deta hai
10 GB free (meri
pehli research),
public URL kabhi
nahi
Backblaze B2 (S3-
compatible)
Dental clinic software: ultra detail build plan
Page 6 of 150

# Kaam Faisla Kyu Spike fail ho to plan
B
T6 Backup Raat ko GitHub
Actions: D1 export,
age se encrypt, B2 par
upload, Healthchecks
ping. Haftewar clinic
PC par copy
Free Cron Trigger ko
10 ms CPU hi milta
hai. GitHub ka
schedule late ya
drop ho sakta hai,
isliye Healthchecks
alarm
Cloudflare ka
Workflows backup
example, ya clinic
PC ka Task
Scheduler
T7 SMS Purana Android phone
aur clinic SIM par
android-sms-gateway,
cloud mode, E2E
encryption on
App free hai.
TextBee free me sirf
50 per din, 300 per
mahina; hamara
andaza ~700 per
mahina (mera
andaza)
DLT-registered paid
SMS API, ya sirf
manual WhatsApp
aur call
T8 WhatsApp
aur email
WhatsApp:
receptionist ka
manual wa.me click.
Email: Brevo free 300
per din
Official WhatsApp
automation paid hai
(tumhara pehle wala
faisla). Email sirf un
patients ke liye jinka
email ho
Sirf SMS aur call
T9 Monitoring UptimeRobot free (50
monitors, 5 minute)
aur Healthchecks.io
free (20 checks)
UptimeRobot ki help
page ab commercial
use allow karti hai,
par 2024 me terms
badle the.
Healthchecks ke
free plan me 20
checks
StatusCake ya
HetrixTools ka free
plan
T10 Domain .in, kisi aise registrar
se jo .in bechta ho.
DNS Cloudflare par
Cloudflare Registrar
ki supported list me
.in nahi dikha. Rate
limit rule ke liye
domain Cloudflare
par chahiye (free me
1 rule)
.com Cloudflare
Registrar se
Dental clinic software: ultra detail build plan
Page 7 of 150

Chhote niyam jo poore code par lagte hain
Search: indexed normalized columns par LIKE. FTS5 nahi, kyunki D1 export virtual
tables ke saath fail hota hai aur ek reported bug me database atak bhi gaya.
Print: browser print (HTML + @page CSS) aur finalise par JSON snapshot. Server-side
PDF nahi, kyunki 10 ms aur 3 MB me nahi aata.
Paise integer me, time UTC me store aur IST me dikhao, receipt number financial year
(April se March) ke hisaab se.
Ek cron (har 5 minute) aur andar branching, kyunki free me cron triggers sirf 5 per
account hain.
Frontend: Vite + React (staff aur portal), Astro (public site), Hono (API), Drizzle (D1),
Zod (validation), Vitest aur Playwright (tests). Static files ke liye alag limits hain:
20,000 files, har file 25 MiB tak.
Teen alag hostname: public site, staff app, patient portal. Cookies alag rahengi aur rate
limit rule alag lagega.
Phase 0: Discovery aur taiyari (lagbhag 73 ghante)
Phase 0 me code nahi likhna: sirf woh cheezein tay karni hain jinke galat hone par baad me
sabse zyada kaam dobara padta hai, aur ek chhota technical test (spike) jo bataega ki free
stack sach me chalega ya nahi. Size ka matlab: S = 1 ghanta, M = 3 ghante, L = 6 ghante, XL
= 12 ghante (testing ke saath, typical). Jis task ke size me "baad me" likha hai, use pilot ke
baad tak taal sakte ho. Yeh sab mere andaze hain.
0.1 Clinic ka asli workflow dekhna (clinic me 1 din)
0.1.1 Patient ka poora safar likhna (L). Receptionist ki table se shuru karo: kaun kya
likhta hai (register, file, parcha, bill book), kahan, aur kaunsi cheez dobara-dobara likhi
jaati hai. 5 naye patient ke registration ka samay stopwatch se naapo. Yeh software ka
target banega (jaise abhi 6 minute, software me 2 minute). Done jab: ek page ka flow
aur naapa hua samay.
0.1.2 Teen tarah ke patient alag dekhna (M). Naya patient, purana patient (follow-up),
aur dard wala walk-in (emergency). Har ek me kya alag hota hai: kaunsa form, kitni der,
bill kab banta hai.
0.1.3 Ek multi-sitting treatment shuru se aakhir tak follow karna (M). Jaise RCT: pehli
sitting se aakhri tak kya likha jaata hai, paisa kaise liya jaata hai (advance, kisht), agli
date kaise tay hoti hai. Yahi sabse mushkil flow hai, isliye pehle samajhna.
Dental clinic software: ultra detail build plan
Page 8 of 150

0.2 Documents aur data jama karna
0.1.4 Din ke ant ka hisaab dekhna (S). Cash kaun ginta hai, UPI ka record kahan rehta
hai, din ka total kaise nikalta hai, kitna paisa baaki (due) rehta hai aur uska hisaab
kahan hai.
0.1.5 Abhi ki dikkatein poochna (S). Doctor aur receptionist se 5-5 sawal: sabse zyada
samay kahan jaata hai, kabhi record kho gaya ya nahi mila, kya cheez bhool jaati hai
(follow-up, due paisa). Jawab se tay hoga ki pehle kya banega.
0.1.6 Clinic ke fixed facts note karna (S). Kaam ke ghante, lunch break, band din,
chairs ki sankhya, ek sitting ki aam length, kya visiting doctor aate hain.
0.2.1 Parcha ka abhi ka format (S). Letterhead par likhti hain ya printed parcha?
Kaunse khane hain (BP, allergy, agli date)? Photo lo. Naya parcha isi par design hoga.
0.2.2 Bill aur receipt ka format (S). Receipt number kaise likhte hain, GST registration
hai ya nahi (agar hai to GSTIN), bill me kya-kya dikhta hai.
0.2.3 Treatments ki poori list ek sheet me (L). Naam, category (scaling, filling, RCT,
extraction, crown, implant, ortho), aam price, kitni sitting, lab kaam lagta hai ya nahi,
aur GST wala rate (doctor aur CA se confirm). Yeh procedure_catalog  ka seed
banega.
0.2.4 Dawai list (M). Jo dawai doctor aam taur par likhti hain: naam, form (tablet,
syrup, gel, mouthwash), strength, aam dose pattern, kitne din, khane se pehle ya baad.
Isme se kuch bhi hum tay nahi karenge: yeh sab doctor khud likhengi aur verify
karengi. Saath me "set" bhi (jaise extraction ke baad ka pack) jo ek click me lagte hain.
0.2.5 Diagnosis aur chief complaint ki aam list (S). Doctor ki apni bhasha me, taaki
dropdown me wahi dikhe.
0.2.6 Medical history ke sawal (S). Abhi ke form me kya poochte hain. Doctor final
karegi.
0.2.7 Consent forms ka abhi ka text (S). Phase 11 me kaam aayega, abhi sirf jama karo.
0.2.8 Clinic ki details ek jagah (S). Naam, logo (badi file), address, phone, email,
doctor ka naam aur degree, dental council registration number, signature ka saaf
photo, timings, holidays. DCI ke niyam 3.4.1 ke hisaab se registration number clinic me,
parche par aur money receipt par dikhna zaruri hai.
0.2.9 Paper register ke 20 page ka photo (S). Patient ka naam dhundhla karke. Isse
data entry ki mehnat aur ganda data (galat spelling, mobile number gayab) ka andaza
lagega.
Dental clinic software: ultra detail build plan
Page 9 of 150

0.3 Accounts aur access (clinic ke naam par)
Sab accounts clinic ke email par honge aur developer sirf member. Kaaran: developer kisi
wajah se available na ho to clinic ko apne system tak pahunch rehni chahiye.
0.4 Hardware aur jagah
0.2.10 Pichle 12 mahine ke asli numbers (S). Har mahine naye aur purane patient,
kamai. Dashboard ka "pehle ka" base yahi banega. Record na ho to abhi se likhna shuru
karo.
0.3.1 Clinic ka alag email (S). Sab accounts isi par. 2-step verification on, recovery
phone sister ka aur developer ka.
0.3.2 Password manager (S). Bitwarden free me ek free organization banao jisme
sister aur developer dono (max 2 users) hon, aur clinic ke saare passwords usi me
rahen. Emergency access free plan me nahi aata (woh Premium me hai), isliye ek
printed emergency kit (master password aur 2FA recovery codes) sister ke paas lock
me rakho. Koi password chat ya sheet me nahi.
0.3.3 Cloudflare account (S). Free plan, authenticator app se 2FA, recovery codes
print karke clinic me rakhna, developer ko member banana.
0.3.4 GitHub private repo (S). Developer ke account me. Branch protection on,
secrets repo me kabhi nahi.
0.3.5 Baaki accounts (M). Backblaze B2 (backup), Brevo (email), UptimeRobot aur
Healthchecks.io (alert). Har ek ki entry Accounts register me: owner, plan, limit,
renewal date, 2FA, recovery.
0.3.6 Domain ka naam sochna (S). Abhi kharidna nahi (Phase 8 se pehle). Naam
shortlist karo, availability dekho, kisi aur clinic ke naam se takrao nahi.
0.3.7 Gateway phone aur SIM (M). Purana Android phone (Android 7 ya naya, battery
theek), clinic ki alag SIM jisme SMS pack ho, SIM ki validity ke recharge ka calendar.
Operator se poochna ki automated appointment-reminder SMS par unki kya policy
hai.
0.4.1 Receptionist PC (S). Chrome ya Edge naya, aur 1366x768 screen par UI sahi dikhna
chahiye. Test karo.
0.4.2 Printer (S). A4 par parcha aur bill ka test print. Letterhead use hota hai to
alignment dekho.
0.4.3 UPS aur internet (M). UPS PC aur router dono ke liye. Backup internet (mobile
hotspot). Router restart hone par apne aap connect ho.
Dental clinic software: ultra detail build plan
Page 10 of 150

0.5 Sister se tay karwane wale faisle
0.4.4 X-ray software dekhna (S). RVG software se image kaise nikalti hai (JPG, PNG
ya DICOM). Phase 11 ke liye abhi sirf note karo.
Sawal Kyun zaruri Default agar jawab na mile
Receptionist alag hai, ya
doctor bhi data bharti hain?
Roles aur screens Dono hain: receptionist data
bharti hai, doctor clinical
likhti hain
Aage koi doctor jud sakta
hai?
Multi-doctor design Database me doctor ka
column abhi se, UI me ek hi
doctor
Patient ID ka format Parche aur bill par dikhega P- ke baad 6 ank, jaise P-
000123 (2.1.5), prefix
settings me badal sakte hain
Parcha ka size Print layout A4, aur header band karne
ka option (letterhead ke liye)
Bill me GST Invoice ka format Receipt me GST wale khane
band, sirf cosmetic
procedure par rate (doctor
aur CA confirm kare)
Reminder ka samay Messaging Ek din pehle shaam 5 baje,
raat 9 se subah 8 tak koi SMS
nahi (7.1.1 aur 7.4.3 ke hisaab
se)
Patient portal par kya dikhe Privacy Appointment, parcha, bill.
Clinical notes nahi
Website par callback form
chahiye?
Phase 8 ka scope Nahi, sirf call button
Discount kaun de sakta hai,
kitna?
Billing rules Sirf doctor, aur kaaran likhna
zaruri
Purane records kitne saal
rakhne hain?
Retention DCI: kam se kam 3 saal, IDA:
8 saal sujhata hai. Default 8
saal, vakeel se confirm
Dental clinic software: ultra detail build plan
Page 11 of 150

0.6 Technical spike (lagbhag 24 ghante): free stack ka asli test
Spike ek chhota "hello clinic" app hai jo asli limits par chalta hai. Maqsad: jo cheez fail hogi
woh abhi pata chale, Phase 4 me nahi. Har test ka result number ke saath Decision log me
likho.
Sawal Kyun zaruri Default agar jawab na mile
Clinic kis rajya me hai, aur kya
wahan clinic registration
(Clinical Establishments Act
ya rajya ka apna kanoon) lagu
hai?
Registration certificate, dar
suchi aur records ke niyam;
kuch rajyon me single-
doctor clinics par bhi lagu
(11.7.1, 11.9)
Maan lo lagu ho sakta hai:
registration number parche
aur receipt par (DCI 3.4.1),
dar suchi catalog se
chhapne layak (11.9.2); sister
ya vakeel se confirm
0.6.1 Ek hi deploy me app aur API (M). Vite + React ka SPA aur Hono wala Worker ek
saath, workers.dev par. Dekho: deploy ho gaya, Worker ka size 3 MB se kitna neeche
hai.
0.6.2 D1 me 5,000 nakli patient (M). 3 table, Drizzle migration, patient search (naam
aur mobile). Dekho: CPU time, response time aur ek patient insert ka rows_written
(index ki rows bhi ginti hain ya nahi: meri samajh hai ki ginti hain, 3.5.5 ka hisaab isi
par). Target: CPU 5 ms se kam, response 500 ms se kam (ek developer ne India se D1
ka response lagbhag 300 ms bataya hai, isliye ek request me queries kam rakhna).
0.6.3 Atomic batch test (M). Ek db.batch()  me 3 statement jisme teesra jaan-boojh
kar fail ho. Dekho: pehle do wapas hue ya nahi. Aur appointment ka overlap check ek hi
INSERT ... WHERE NOT EXISTS statement se. Ye bhi dekho ki overlap par INSERT ke 0
rows banane se batch fail hota hai ya nahi (meri samajh: nahi hota, to baaki statements
ko us INSERT ke natije par depend karna padega).
0.6.4 Cloudflare Access (M). Staging ke aage one-time PIN login. Dekho: card maanga
ya nahi, receptionist ke email se login, session kitne din, Worker me JWT verify karne
ka CPU.
0.6.5 Patient password prototype (M). Browser me PBKDF2 (6 lakh iteration) kitna
samay leta hai, sasti Android phone par bhi. Server par sirf HMAC verify: CPU 1 ms se
kam hona chahiye.
0.6.6 R2 me file (S). 5 MB ki image upload aur login ke baad download, Worker ke
through. CPU dekho. R2 chalu karte waqt card maanga ya nahi, ye bhi likho (sources
me farak hai).
Dental clinic software: ultra detail build plan
Page 12 of 150

Phase 0 ka gate (aage tabhi badho jab)
Treatments, dawai list, parcha aur bill ka format, clinic ki details ek shared folder me
hain.
Sab accounts bane hain, 2FA on hai, Accounts register bhara hai.
Spike ke sab test pass hain, ya jo fail hue unka fallback tay ho gaya hai.
Sister ne 0.5 ke faisle dekh liye hain (default ho to bhi).
Roz ke ghante ka note (date, task number, ghante) shuru ho gaya hai.
Phase 1: Foundation
Phase 1 ek khali lekin pakka dhancha banata hai: repo, deploy, database ke niyam, login,
audit log, design system aur backup. Sister ko is phase ke baad bhi koi naya screen nahi
dikhega, par baaki sab phases isi par bina dobara banaye jud jaayenge, isliye yahan
jaldbaazi sabse mehngi padti hai.
0.6.7 SMS gateway (M). android-sms-gateway cloud mode se Worker se 10 test SMS,
delivery webhook, aur phone ko screen off aur battery saver me raat bhar chhodkar
dekhna ki chalta raha ya nahi. E2E encryption on rakho: unka FAQ kehta hai ki text aur
phone number dono relay se pehle encrypt hote hain, yeh test me confirm karo.
0.6.8 Backup ka poora raasta (M). GitHub Actions: D1 export, encrypt, B2 par upload,
phir naye D1 me restore karke row count milana, aur export aur restore dono ka samay
likho. Healthchecks par ping. Schedule 7 din chalne do aur dekho ki har raat time par
chala ya nahi: GitHub apne docs me kehta hai ki schedule late ho sakta hai ya chhoot
bhi sakta hai. Test private repo me karo (asli repo private hoga): ek post ka daava hai ki
free personal account ke private repo me schedule chalta hi nahi (maine verify nahi
kiya); na chale to Worker ke cron se workflow_dispatch chalao (9.1.2 ka fallback).
Backblaze signup par card maanga ya nahi, ye bhi likho.
0.6.9 Time Travel restore drill (S). Kuch rows delete karo, 10 minute pehle ke
bookmark par restore karo.
0.6.10 Spike ka result likhna (S). Har test pass ya fail, number ke saath. Fail ka fallback
Tech decisions me likha hai.
Dental clinic software: ultra detail build plan
Page 13 of 150

1.1 Repo, tooling aur environments
1.2 Database ke niyam aur base tables
1.1.1 Monorepo (M). pnpm workspaces: apps/web  (staff aur portal SPA), apps/site [note: do not create apps/site]
(Astro public site), apps/worker  (Hono API aur asset routing), packages/shared
(Zod schemas, types), packages/db  (Drizzle schema, migrations, seed). TypeScript
strict, ek hi lint aur format config. Done jab: pnpm dev  se sab chalta hai aur pnpm
build  ek hi deploy output deta hai.
1.1.2 Teen environments (M). local ( wrangler dev , local D1), staging (alag Worker,
alag D1, alag R2 bucket), production. D1 free me 10 databases milte hain, to teen kaafi
hain. Done jab: teeno ke bindings aur secrets README ki table me likhe hain aur ek
command se staging deploy hota hai.
1.1.3 CI/CD (M). GitHub Actions: har PR par typecheck, lint, test, build. main  par
staging deploy aur migrations. Production sirf manual button se, aur tabhi jab staging
smoke test pass ho. Done jab: kharab code merge hone se pehle CI rok deta hai.
1.1.4 Secrets aur tokens (S). Secrets sirf wrangler secrets aur GitHub encrypted
secrets me. Deploy aur backup ke alag API tokens, kam se kam permissions aur expiry
date ke saath. Done jab: repo par secret-scan (gitleaks) chalta hai aur Accounts
register me har token ki entry hai.
1.1.5 Dependency safai (S). Dependabot security updates on, lockfile commit, Node
version pinned. Done jab: haftewar update PR aate hain.
1.1.6 Site routing (M). Ek chhota function tay karta hai ki request public site, staff app [note: only two routes: /app (staff) and /my (portal); /api/* to Hono; everything else static assets]
ya portal ki hai: production me hostname se, workers.dev par pehle path prefix ( /app ,
/my ) se. /api/*  Hono ko jaata hai, baaki static assets ko. Done jab: dono tareeko ka
test hai.
1.1.7 Local data (S). Seed script jo 5,000 nakli patients banata hai (spike ka code). Done [note: fake-patient generator done in 1.1.7; the rest (pnpm db:seed insert and "developer sees data in the app") moved to right after 2.1.1]
jab: naya developer 10 minute me app chala kar data dekh sakta hai.
1.1.8 README aur faisle (S). docs/  me setup, deploy, environments ki table aur T1 se
T10 ke faisle. Done jab: 6 mahine baad bhi bina yaad ke deploy kar sako.
1.2.1 Niyam likhna (S). IDs ULID text. Har table me created_at , updated_at ,
created_by , updated_by , deleted_at , version . Samay UTC ISO text me, local
tareekh YYYY-MM-DD , paisa integer paise me, enums TEXT + CHECK. Done jab: ek test
har table par yeh columns check karta hai.
Dental clinic software: ultra detail build plan
Page 14 of 150

1.3 Login aur roles
1.2.2 Drizzle aur migrations (M). drizzle-kit se SQL migrations, wrangler d1
migrations apply  se lagana. Niyam: laga hua migration kabhi edit nahi, ek migration
me ek badlav, tod-phod wale badlav do releases me (pehle naya jodo, phir purana
hatao). Done jab: staging par apply hua aur production ke liye "pehle Time Travel
bookmark likho" checklist me hai.
1.2.3 Base tables aur seed (M). users , settings , counters , audit_log ,
access_log , files . Seed me roles aur default settings. Done jab: khali database par
migrations saaf chalte hain.
1.2.4 Gap-free numbering (M). Patient code aur receipt number ke liye counters
table: ek batch me counter badhao aur usi se row insert karo, taaki number na doobara
aaye na chhute. Done jab: 50 parallel requests ka test pass hai, aur ek insert jaan-boojh
kar fail karne par counter wapas hota hai (spike 0.6.3 ka natija yahin kaam aata hai).
1.2.5 Audit aur access log (M). Har badlav ka audit row usi batch me likha jaata hai:
kisne, kab, kaunsi table aur row, kya badla (pehle aur baad), request id. Patient record
dekhna aur export karna access_log  me. Done jab: har write endpoint test me ek hi
audit row banata hai, aur app code audit rows ko edit ya delete nahi kar sakta.
1.2.6 Repository layer (L). Saari SQL repositories me, jo ctx  (user, role, request id) leti
hain. Route handler database ko seedha nahi chhuta. Har repository method central
permission table se check karta hai (1.3.4). Done jab: ek test fail hota hai agar koi route
database import kare.
1.2.7 Ek saath edit ka bachav (S). Update me version  ka check. Conflict par 409 aur
UI me saaf sandesh ("Kisi aur ne yeh record badla hai, reload karo"). Done jab: do tabs
ka test pass hai.
1.2.8 Query-plan guard (S). Ek test helper hot queries par EXPLAIN QUERY PLAN
chalata hai aur badi table ke full SCAN par fail hota hai. Kyun: D1 free me roz 5 million
rows read ki limit hai. Done jab: patient search index use karta dikhta hai.
1.3.1 Access app (S). Staff hostname ke aage Cloudflare Access, policy: sirf teen [note: optional outer layer, WAITING on a Cloudflare card (Zero Trust asks for one); the main staff login is 1.3.8 Google sign-in, see docs/AUTH_PLAN.md. When added, Access covers /app and /api/staff only] [status 2026-11-22: still WAITING on a card; not blocking, Google sign-in (1.3.8) is live on staging]
emails (doctor, receptionist, developer), one-time PIN. Done jab: galat email ko PIN hi
nahi aata.
1.3.2 JWT verify (M). Worker har staff request par Cf-Access-Jwt-Assertion  check [note: build as a generic RS256/JWKS verifier: used now for Google ID tokens (1.3.8); the Access JWT check switches on by config when 1.3.1 is added] [DONE 2026-11-22: wrong aud, expired, bad signature and missing token tests pass; used by Google sign-in on staging]
karta hai: signature (Access ke certs endpoint se), aud  aur issuer. Cookie par nahi,
header par bharosa karo, jaisa Cloudflare ke docs kehte hain. Done jab: galat aud,
expired aur bina token ke tests 403 dete hain.
Dental clinic software: ultra detail build plan
Page 15 of 150

Kaun kya kar sakta hai (default, sister confirm karegi)
1.3.3 Users aur roles (M). Email se users  row, roles: doctor, receptionist, developer. [note: with 1.3.8 the user is found by the Google email and bound to the Google "sub"; unknown email = "Access not available" page; first doctor via developer command; see docs/AUTH_PLAN.md] [DONE 2026-11-22: doctor seeded on staging with pnpm staff:seed-doctor; every sign-in and refusal is kept in access_log]
Email Access me hai par users  me nahi to saaf "aapko access nahi hai" page. Har login
access_log  me, kyunki Access ke free plan me login logs sirf 24 ghante rehte hain.
Done jab: login ka record 24 ghante baad bhi hamari table me dikhta hai.
1.3.4 Permission table (M). [status 2026-11-22: code and per-role tests DONE; OPEN until the doctor confirms the table, not blocking] Neeche wali matrix code me ek table, aur har role ke liye
test. Done jab: receptionist se clinical notes ka koi endpoint nahi khulta.
1.3.5 CSRF aur headers (M). [status 2026-11-22: code DONE and on staging; OPEN only for the securityheaders.com grade the owner will send, not blocking] Badlav wali requests par custom header aur Origin check.
Security headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-
Policy. Done jab: securityheaders.com par A grade ya har kami ki likhi hui wajah.
1.3.6 User admin screen (M, baad me). Doctor receptionist ko add ya band kar sake. [note: now needed before go-live as Settings > Staff (doctor only): add Gmail + role, deactivate, reactivate, change role; guards in docs/AUTH_PLAN.md 4] [DONE 2026-11-22: a receptionist was added from Settings > Staff on staging]
Access policy me email abhi haath se jodni padegi, isliye screen par photo ke saath
steps. Pilot me developer khud add karega. Done jab: naya receptionist 10 minute me
add ho jaata hai.
1.3.7 Login ka anubhav (S). [DONE 2026-11-22: on staging the receptionist signed in, saw only her menu, could not open Staff, and was signed out at once when deactivated] Upar naam aur role, logout, aur session khatam hone par
saaf message. Done jab: receptionist bina madad ke login kar leti hai.
1.3.8 Staff Google sign-in (L). [added by owner 2026-11-22; plan: docs/AUTH_PLAN.md] [DONE 2026-11-22: the seeded doctor signed in on staging; an unlisted Gmail got "Access not available"] OIDC code flow
with state, nonce and PKCE in the Worker; ID token fully verified; sessions in D1 (hash only, 12 h
absolute + idle timeout); deny-by-default on /api with a short public list; dev-only login stub that is
not in staging/production bundles; public landing page at / and an "Access not available" page.
Done jab: an unknown Gmail lands on "Access not available" and is logged, the route-walk test passes,
and the seeded doctor signs in on staging.
Kaam Doctor Receptionist Developer (support)
Patient dekhna Haan Haan Nahi
Patient naya, basic
details badalna
Haan Haan Nahi
Clinical notes, chart,
diagnosis
Dekhna aur
likhna
Nahi Nahi
Parcha banana aur
finalise karna
Haan Sirf print aur
reprint
Nahi
Appointments Haan Haan Nahi
Bill banana, payment
lena
Haan Haan Nahi
Discount, refund, bill
cancel
Haan Nahi Nahi
Dashboard, reports,
export
Haan Sirf aaj ka
summary
Nahi
Dental clinic software: ultra detail build plan
Page 16 of 150

Developer ke paas Cloudflare account ka technical access rahega, isliye yeh niyam
bharose aur access_log  par chalta hai: production ka patient data sirf support ke waqt,
sister ki ijazat se, aur har baar log ke saath.
1.4 App shell aur design system
Kaam Doctor Receptionist Developer (support)
Settings aur lists Haan Sirf timings
dekhna
Sirf config, patient data nahi
Audit log dekhna Haan Nahi Sirf troubleshooting, sister
ki ijazat se
Users add ya band karna Haan Nahi Haan
1.4.1 Brand tokens (S). Logo se do rang, neutral greys, success aur warning aur danger [note: Devanagari print font removed, UI and print are English only, see docs/DECISIONS.md]
ke rang, font (Inter ya system font).
Contrast WCAG AA. Done jab: ek style-guide page par sab dikhta hai.
1.4.2 Component base (M). [note 2026-11-22: owner decision: plain CSS + tokens, no Tailwind/shadcn; Radix only for toast, tooltip, dropdown menu; dialogs on native <dialog> (CSP), see DECISIONS.md] Tailwind aur shadcn/ui (accessible Radix components):
button, input, select, dialog, tabs, toast, badge, card. Done jab: har component
keyboard se chalta hai.
1.4.3 Layout shell (M). Left nav (Aaj, Patients, Appointments, Billing, Reports,
Settings), upar global search (shortcut / ), "Naya patient" button, role ke hisaab se
menu. 1366x768 par theek, tablet par bhi. Done jab: receptionist PC par asli screen size
par test hua.
1.4.4 Form kit (M). [note 2026-11-22: owner decision: react-hook-form + zod, own small zod resolver] react-hook-form aur Zod, inline errors, mobile number (+91, 10 digit
check), tareekh DD/MM/YYYY, Enter se save, Tab ka sahi order. Done jab: ek form sirf
keyboard se bhara ja sakta hai.
1.4.5 Data table kit (M). Sort, filter, server-side pagination, khali, loading aur error
state. Done jab: 5,000 rows par bhi tez chalta hai.
1.4.6 Feedback patterns (M). [note 2026-11-22: owner decision: the "bill saved twice creates one" done-when and the server-side idempotency key MOVE TO PHASE 5 (bills); 1.4.6 now covers toasts, confirm dialog, unsaved-change warning and the client-side double-click guard] Toasts, confirm dialog (browser alert kabhi nahi),
unsaved-change chetavani, double-click se duplicate submit ka bachav (idempotency
key). Done jab: ek bill ko do baar save karne ki koshish par ek hi banta hai.
1.4.7 Error page aur offline (S). Har error par chhota error ID jo receptionist developer
ko bol sake, aur internet jaane par upar banner "Internet nahi hai, page band mat karo".
Done jab: wifi band karke test hua.
Dental clinic software: ultra detail build plan
Page 17 of 150

1.5 Settings aur editable lists
1.6 Observability aur backup v0
1.4.8 Print framework (M). PrintLayout  component, @page  A4 aur A5, header band
ya chalu, clinic ke printer par test print. Done jab: ek dummy parcha sahi jagah par
print hota hai.
CANCELLED 1.4.9 Hindi ki taiyari (S, baad me). Saari strings ek t()  function se, abhi sirf English. [CANCELLED note: UI is English only, see docs/DECISIONS.md]
Done jab: ek screen ka Hindi demo chalta hai.
1.4.10 Speed ka budget (S, baad me). Staff app ka pehla JS 300 KB gzip se kam, route-
wise code splitting. Done jab: build report CI me dikhti hai.
1.4.11 Shell restyle to DESIGN.md (S). [added by owner: do this before 1.3.1] Apply docs/DESIGN.md
to the existing web shell: colours, Inter font (self-hosted InterVariable.woff2 from the official
rsms/inter release, OFL licence next to it, font-display: swap), navy sidebar on laptop, top tabs on
tablet, bottom tab bar and round "+" on phone, following S01 and S14. Today shows fake sample data only;
no API calls, no new features. Done jab: /app looks like S01 at 1366 px and S14 at 360 px, works at 768
px, the rupee sign renders in Inter, and pnpm check passes.
1.5.1 Settings store (M). settings  table (key, JSON value, version) aur Zod se check,
har badlav ka audit. Done jab: galat value save nahi hoti.
1.5.2 Clinic profile editor (M). Naam, logo (R2 par upload, size aur type ki limit),
address, phones, email, doctor ka naam aur degree, registration number, signature
image. Done jab: badalne par parcha preview turant badalta hai.
1.5.3 Timings aur holidays (M). Hafte ka schedule (din-wise start, end, lunch), slot
length, chairs, band din aur chhutti. Done jab: Phase 2 ka calendar isi se slots banata
hai.
1.5.4 Generic list editor (L). Ek hi reusable screen jisse doctor kisi bhi list ko edit kare:
jodna, badalna, band karna (delete nahi), order badalna. Procedures, dawai, diagnosis,
referral sources sab isi se. Done jab: ek nayi list ke liye naya screen nahi, sirf config
likhni padti hai.
1.5.5 CSV import (M, baad me). Doctor ki sheet se list import: pehle preview, galtiyan
dikhao, phir save. Done jab: Phase 0 ki procedures sheet bina haath se likhe import
hoti hai.
1.5.6 Seed script (S). Phase 0 ki sheets (procedures, dawai, diagnosis, referral
sources) se seed SQL, jab tak CSV import nahi banta. Done jab: staging par doctor ki
asli lists dikhti hain.
1.6.1 Request ID aur logs (S). Har request ko ID, structured logs, aur patient ka naam,
mobile ya diagnosis kabhi nahi. Workers Logs free me roz 200,000 lines aur kuch din ka
retention deta hai, isliye asli record audit_log  me. Done jab: ek error ka ID se poora
trail mil jaata hai.
Dental clinic software: ultra detail build plan
Page 18 of 150

1.7 Test ka dhancha
Mat karo (Phase 1)
Staff routes ko Access ke bina "bas abhi ke liye" public mat chhodo.
Staging ya local me asli patient ka data mat rakho, sirf nakli data.
Laga hua migration mat badlo.
Route me raw SQL ya SELECT *  mat likho.
Logs me patient ka naam, mobile ya diagnosis mat likho.
Paisa float me mat rakho.
Koi bhi list (procedures, dawai, diagnosis) code me hard-code mat karo.
1.6.2 Health endpoint (S). /api/health : database ko chhoti query aur build version.
UptimeRobot isi par har 5 minute. Done jab: staging par jaan-boojh kar tod kar dekha ki
alert aata hai.
1.6.3 Backup v0 (M). Spike ka pipeline production jaisa: GitHub Actions raat 2 baje IST
ke aaspaas (export chalte waqt baaki requests ruk jaati hain), age encrypt, B2 upload,
Healthchecks ping, key alag jagah. Done jab: 7 raat lagataar chala aur ek restore test
hua.
1.6.4 Alarm (S). Healthchecks: 26 ghante me ping na aaye to developer ko email.
UptimeRobot down par bhi email. Done jab: dono alarm test hue.
1.6.5 Staff status page (S, baad me). Settings me ek page: build version, last backup
ka samay, SMS gateway ka heartbeat (Phase 7 se), D1 size. Done jab: sister ek nazar me
dekh sake ki sab theek hai.
1.7.1 Unit tests (S). Vitest: paisa, tareekh aur samay, numbering, validation ke pure
functions. Done jab: pnpm test  10 second se kam me chalta hai.
1.7.2 Integration tests (M). @cloudflare/vitest-pool-workers  tests ko Workers
runtime ke andar chalata hai aur D1 migrations lagane ka helper deta hai. Done jab:
repository aur API tests asli D1 schema par chalte hain.
1.7.3 End-to-end smoke (M). Playwright: login (Access ka stub), naya patient,
appointment. Done jab: staging deploy ke baad apne aap chalta hai.
1.7.4 Permission test helper (S). Role aur endpoint ki matrix ko loop me test karta hai.
Done jab: naya endpoint jodne par matrix me entry ke bina CI fail hota hai.
1.7.5 Nakli data factories (S). Naam, mobile, history ke factories. Done jab: kisi test me
asli patient ka data nahi hai.
Dental clinic software: ultra detail build plan
Page 19 of 150

Bade frameworks ya kai state libraries mat jodo.
Access ke bina backdoor login mat banao. Access band ho to paper downtime
procedure chalega.
Phase 1 ka gate
CI green hai aur main  par push se staging deploy hota hai.
Access login se doctor aur receptionist ke pages alag dikhte hain, galat email band hai,
aur JWT ke teen negative tests pass hain.
Role aur endpoint ka test matrix pass hai.
50 parallel requests par numbering me na duplicate hai na gap.
Backup 7 raat lagataar chala aur ek restore test hua.
Clinic profile aur timings editor se badla hua naam parche ke print preview me dikhta
hai.
Phase 0 aur 1 ke asli ghante plan ke 73 aur 102 se milaye gaye, velocity nikali, aur Samay
aur mehnat section ki tareekhein usi se update hui.
Phase 2: Patient aur Appointment
Yeh pehla phase hai jo receptionist roz chalayegi. Lakshya chaar hain: naya patient 60
second me darj, kisi bhi patient ko 5 second me dhoondhna, phone par appointment
lagana ya badalna, aur subah "Aaj" screen se din shuru karna. Ilaaj ki koi cheez (diagnosis,
chart) yahan nahi hai, wo Phase 3 me. Sister ko pehli baar asli software yahin dikhega,
isliye buttons ke naam wahi hon jo wo roz bolti hai, aur har screen par ek hi bada kaam ho.
2.1 Patient ka data model
2.1.1 Fields tay karna (M). Phase 0 ke paper register se: patient code, poora naam, [note: right after this task, finish the rest of 1.1.7: pnpm db:seed inserts the 5,000 fake patients into local D1, and a developer sees them in the app]
gender, DOB ya umar, mobile, doosra mobile, pata ya area, email, referral source
(editable list), kisne bheja (text), emergency contact, message ki bhasha,
legacy_ref  (purane register ka number), non-clinical notes, status. Sirf chaar zaruri:
naam, mobile (ya "mobile nahi hai" ka karan), gender, umar. Done jab: har field ke
saamne "zaruri ya optional" aur "kis kaam aata hai" likha hai (jo kisi kaam nahi aata wo
hata do) aur migration staging par chal gayi.
2.1.2 Mobile ka niyam (S). Ek hi function: spaces, +91  aur shuru ka 0  hatao, 10 digit
rakho, pehla digit 6 se 9 (India ke mobile numbers 6, 7, 8 ya 9 se shuru hote hain).
Database me +91XXXXXXXXXX . Niyam sirf ek file me rahe, kyunki naye number series
Dental clinic software: ultra detail build plan
Page 20 of 150

aa sakti hain aur prefix ke bharose carrier ya type tay karna kamzor hai. Done jab: 20
sahi aur galat numbers ke unit tests pass.
2.1.3 Naabalig (S). 18 se kam umar par guardian ka naam, rishta aur mobile zaruri. DPDP
me bachchon ke data ke alag niyam hain (healthcare ke liye chhoot ke saath, jo hamne
pehle dekha tha), isliye final shabd vakeel se. Done jab: 10 saal ke bachche ka form
guardian ke bina save nahi hota.
2.1.4 Umar (S). DOB pata ho to DOB, warna "umar + registration ki tareekh" (zyadatar
log sirf umar batate hain, Phase 0 ke register se check karo). Dikhane wali umar
hamesha hisaab se nikalo, kabhi store mat karo. Done jab: 5 saal purani entry bhi aaj ki
sahi umar dikhati hai.
2.1.5 Patient code (S). P-000123  jaisa, counters  table se (1.2.4), prefix settings me.
Kabhi dobara use nahi hota, archive ke baad bhi nahi. Done jab: yahi code parche, bill
aur portal teeno me chalega (Phase 4, 5, 8).
2.1.6 Search tokens (L). D1 me FTS5 nahi chalega, aur LIKE '%ram%'  poori table
padhta hai (rows-read badhte hain). Isliye patient_search(token, patient_id,
kind) : naam ka har shabd (lowercase, Mr, Mrs, Smt, Shri, Dr, Master, Baby hataye hue),
mobile ke 10 digit, mobile ka ulta (taaki "aakhri 4 digit" bhi prefix search ban jaaye),
code ka number aur legacy_ref . Search hai token >= 'ram' AND token < 'ran'
jaisi range, kyunki SQLite ka LIKE-optimisation default (BINARY) column par index use
nahi karta, NOCASE par karta hai. Pehle shabd se index, baaki shabd app me filter.
Tokens usi batch me badlenge jisme patient. Done jab: 5,000 patients par EXPLAIN
QUERY PLAN  me index dikhta hai aur ek search 100 se kam rows padhta hai (yeh mera
target hai, spike 0.6.2 me naapo).
2.1.7 Duplicate chetavani (M). Naya patient save karte waqt: (a) wahi mobile aur naam
ka koi shabd milta hai, (b) wahi naam aur DOB ya umar se 1 saal ka fark, (c) wahi doosra
mobile. Top 3 dikhao: "Kya yeh wahi hai?" Haan, isko kholo / Nahi, naya hai. Kabhi hard-
block nahi, kyunki parivaar ek number share karta hai aur judwa bhi hote hain. Done
jab: "Rahul Sharma" aur "Rahul Sarma" same mobile par chetavani aati hai, do bhai
same mobile par chetavani ke saath save ho jaate hain, alag log par kuch nahi aata.
2.1.8 Archive aur restore (S). Karan zaruri, default search se chhupa, kabhi bhi wapas.
Hard delete kahin nahi (Phase 1 ka niyam). Archive sirf default search se chhupata hai;
full History doctor (aur permitted receptionist view) se dikhti rahe (docs/PATIENT_HISTORY.md;
test 3.5.15). Done jab: archived patient ke purane appointment ya bill pehle jaise
dikhte hain, aur History tab archived patient par poori tarah khulti hai.
2.1.9 Sahmati ki table (M). consents(patient_id, type, notice_version, given,
given_at, recorded_by, method) . Types: privacy_notice, sms_reminders, marketing
(default band); aage treatment, photo (Phase 3) aur portal (Phase 8). Notice ka text
Dental clinic software: ultra detail build plan
Page 21 of 150

2.2 Receptionist ke screens
settings me version ke saath, taaki pata rahe patient ne kaunsa text dekha. Sahmati
wapas lena bhi ek nayi row (delete nahi). Done jab: ek patient ke liye "kab, kisne,
kaunsa text" ek screen par dikhta hai.
2.1.10 Do patients ko jodna (L, baad me). Sirf doctor, preview ke saath, "MERGE" type
karke. Ek batch me saari child rows (appointments, bills, ...) bache hue patient par,
purane ka tombstone aur poora audit. Code me ek registry batati hai ki patient_id
kin tables me hai, aur ek test fail hota hai agar koi nayi table registry me nahi. Done jab:
do nakli patients jodne par kuch bhi khota nahi.
2.2.1 Naya patient form (M). Ek page: upar chaar zaruri field, mobile likhte hi duplicate
check, "Aur details" neeche fold me. Enter se save. Save ke baad do bade button:
"Appointment lagao" aur "Abhi aaye hain (walk-in)". Done jab: developer ne stopwatch
se 10 baar 60 second se kam me bhara (asli naap Phase 10 me).
2.2.2 Patient profile (M). Upar naam, umar aur gender, code, poora mobile, aur alerts ki
jagah (Phase 3). "Agli appointment" bada dikhe, kyunki patient phone par wahi
poochhta hai. Tabs: Overview aur Appointments; Phase 3 me History tab (3.5.11,
docs/PATIENT_HISTORY.md) Overview ke saath. Visits, Billing, Files, Messages tab
tab tak chhupe jab tak unka phase na bane (feature flag), sister ko adhoore tab nahi
dikhne chahiye. Done jab: koi dead button nahi.
2.2.3 Search box (M). Har page ke upar, shortcut / , 250 ms debounce, upar-neeche
aur Enter. Result me naam, umar aur gender, mobile ke aakhri 4 digit, code, last visit.
Kuch na mile to bada button "Naya patient banao: <jo likha>". Done jab: bina mouse ke
search karke profile khul jaata hai.
2.2.4 Patient edit (S). Basic details receptionist badal sakti hai. Mobile badalne par
confirm aur audit me purana aur naya. Done jab: audit row banti hai aur do tabs me edit
par version-check (1.2.7) rokta hai.
2.2.5 Patient list (M). Table kit (1.4.5) se. Filters: is mahine naye, 6 mahine se nahi aaye,
archived. Default sort: haal me aaye. Done jab: 5,000 rows par page jaldi khulta hai
(pagination server par).
2.2.6 CSV export (S, baad me). Sirf doctor, chetavani "isme personal data hai",
access_log  me entry. Done jab: receptionist ko button dikhta hi nahi.
2.2.7 Notice aur sahmati lena (M). Registration ke saath ek chhota panel: "notice
dikhaya", "SMS reminders ke liye sahmati", "promo messages" (band rehta hai). A5
notice clinic me lagao aur form ke saath do. DPDP ki "voluntarily provided" chhoot par
akele bharosa nahi karte: ek commentary ke hisaab se yeh tab theek baithta hai jab
patient ne khud pehal karke data diya ho, aur jahan clinic ka staff poochhe wahan sthiti
Dental clinic software: ultra detail build plan
Page 22 of 150

2.3 Scheduling ka dimaag
dhundhli hai. Isliye notice dena aur sahmati ka record rakhna. Niyam 13 May 2027 se
lagoo hain, par record abhi se banana sasta hai. Notice ka final text vakeel se (Phase
0.5 ka faisla). Done jab: sahmati ke bina bhi patient banta hai (ilaaj sahmati par nahi
tikta), bas SMS reminders band rehte hain.
2.2.8 Bina mobile aur ek hi mobile (S). Bachche ya buzurg ke liye "mobile nahi hai" aur
guardian ka mobile. Ek mobile par kai patients ho to profile par "isi number par 3 aur"
link. Done jab: har patient ka ek "contact mobile" aur uske maalik ka rishta (khud, pita,
pati...) store hai, jo Phase 8 ke OTP login me kaam aayega.
2.3.1 Appointments ka schema (M). appointments : patient, chair_id  (abhi ek hi, UI
me chhupa), visit type, start_at  (UTC), date_local  (IST ki tareekh), start_min  aur
end_min  (IST me raat 12 baje se minute, taaki overlap check SQL me time-zone ke bina
ho), status, source (phone, walk_in, referral, other), priority (normal, emergency),
overbook flag, complaint (phone par jo bataya), cancel reason, rescheduled_from,
arrived_at, started_at, ended_at, version. Indexes: (chair, date_local, start_min),
(patient, date_local), (date_local, status). Done jab: "ek din ki saari appointments"
query EXPLAIN  me index use karti hai.
2.3.2 Visit types (S). Editable list (1.5.4): naam, default duration, rang. Shuruaat:
Consultation 20, Follow-up 15, Cleaning 30, RCT sitting 45, Extraction 30, Ortho
adjustment 20, Emergency 20 minute (andaza, sister ki Phase 0 sheet se badlo).
Duration slot length ke multiple me upar round hoti hai. Done jab: doctor duration
badle to naye bookings par asar aata hai, purane par nahi.
2.3.3 Khaali slot nikaalna (L). Din ke working hours, minus lunch, minus holidays aur
blocks, minus maujooda appointments. Input: visit type aur "kab se", output: agle 5
khaali slots. Hisaab app code me, agle 14 din ki appointments padhta hai (~150 rows,
mera andaza). Aaj ke liye "ab se 15 minute baad". Done jab: 12 unit tests: khaali din,
bhara din, lunch ke paas, holiday, aadhe ghante ka gap, 45 minute ka RCT, aaj ka din.
2.3.4 Booking aur overlap check (L). Ek hi batch me INSERT ... WHERE NOT EXISTS
(overlap) , audit aur event. Dhyan: D1 batch me 0 rows wala INSERT fail nahi maana
jaata, isliye audit aur event bhi "agar appointment bani ho tabhi" wali shart ke saath
likho (meri samajh, spike 0.6.3 me test). Insert na ho to 409 aur UI naye slots dikhaye.
Done jab: ek hi slot par 50 parallel requests me sirf ek jeetti hai, aur har haar par audit
ya event nahi bana.
Dental clinic software: ultra detail build plan
Page 23 of 150

Status ka chakra
2.3.5 Booking ke niyam aur override (M). Beete samay me booking nahi, band din ya
lunch me nahi, 90 din se aage nahi (setting). Par asli clinic me "emergency" aur "jaan-
pehchaan" hota hai, isliye har niyam par "override" (karan likhkar) jo audit me jaata hai
aur overbook flag lagata hai. Done jab: har niyam ka aur override ka test.
2.3.6 Status ka chakra (M). Neeche ki table code me ek jagah, baaki sab 409. Har
badlav ka samay (arrived_at, started_at, ended_at), jo baad me wait-time dikhane ke
kaam aayega. no_show  appointment ke samay se 15 minute baad hi. Done jab: har
galat badlav ke liye test, aur UI me sirf valid buttons dikhte hain.
2.3.7 Walk-in aur emergency (M). Walk-in matlab abhi ke naam par appointment,
queue arrival ke kram me. Emergency (dard, sujan, khoon) queue me upar, laal tag,
overbook ki ijazat. Screen par "kitni der se baithe hain". Done jab: 3 walk-in aur 1
emergency ke scenario me kram sahi.
2.3.8 Reschedule aur cancel (M). Reschedule = nayi appointment aur purani par
rescheduled  aur link, taaki history dikhe. Cancel me karan list (patient ne kaha,
doctor available nahi, emergency, anya + text). "Patient ko batana hai" checkbox ek
event banata hai (SMS Phase 7 me). Done jab: profile par reschedule ki poori kadi
dikhti hai aur koi appointment delete nahi hoti.
2.3.9 Din ya samay block (M, baad me). Doctor kisi din ko block kare ("kal
conference") to us din ki appointments ki list aaye, har row par "naya slot dhundo" ya
"cancel aur batao". Done jab: 10 appointments wale din ki saari 10 ek screen se nipti.
2.3.10 Follow-up madadgaar (S, baad me). Visit ke baad "7 din baad" button: calendar
us din khule, suggested slots ke saath. Done jab: sahi tareekh khulti hai.
2.3.11 Waitlist (M, baad me). Jisne jaldi ka slot maanga wo list me, aur cancel hote hi "in
logon ko call karo". Done jab: cancel karne par list apne aap dikhti hai.
Abhi Agla ho sakta hai
scheduled confirmed, arrived, cancelled, no_show,
rescheduled
confirmed arrived, cancelled, no_show, rescheduled
arrived in_chair, cancelled (patient chala gaya)
in_chair completed
completed koi nahi (badlav sirf addendum se, Phase 3)
Dental clinic software: ultra detail build plan
Page 24 of 150

2.4 Calendar aur "Aaj" screen
Abhi Agla ho sakta hai
cancelled, no_show scheduled (galti sudharne ke liye, 24 ghante tak,
audit ke saath)
2.4.1 Day view (L). Working hours ka vertical timeline. Card ka status rang ke saath
icon aur text se bhi dikhe (akele rang par bharosa nahi). Abhi ke samay ki line. Khaali
slot par click se quick-book, card par click se details, drag se reschedule (confirm ke
saath). Apna CSS grid banao, bhaari calendar library nahi, kyunki chair ek hai aur 300
KB ka budget (1.4.10) hai. Done jab: poora din ek scroll me padha ja sake aur khulte hi
"abhi" ka samay beech me ho.
2.4.2 Quick-book dialog (M). Patient search, visit type, tareekh, 5 suggested slots,
confirm, aur "phone par kya bataya" ka note. Done jab: patient chun lene ke baad 3
click me appointment lag jaati hai.
2.4.3 "Aaj" screen (L). Receptionist ka home: aaj ki list, har row par status ka ek-click
button, walk-in button, agla patient highlighted, bina-mobile wale patients, kal ki call-
list (aaj ke no-show). Doctor ka view alag: sirf "Ab" aur "Agle 3". Done jab: ek poora din
(aana, kursi, khatam) sirf is screen se chalta hai.
2.4.4 Aaj ki list print (S). A4 par naam, samay, type, mobile. Server ya internet band ho
to bhi kaam aaye: roz shaam ko kal ki list print, yahi downtime procedure ka pehla hissa
hai. Done jab: sister ke printer par test print theek.
2.4.5 Appointment slip (S, baad me). Chhote kagaz par "Agli appointment: tareekh,
samay, clinic ka phone" aur logo. Done jab: printer par test.
2.4.6 Week view (M, baad me). Din-wise count aur bhare ya khaali slots. Done jab: ek
nazar me pata chalta hai kaun sa din khaali hai.
2.4.7 Auto-refresh (S). Receptionist aur doctor ke screens har 60 second me refresh,
tab chhupa ho to ruk jaaye. Hisaab: 2 screens × 10 ghante × 60 = 1,200 requests roz,
har ek ~30 rows, yani lagbhag 36,000 rows. Free limit (100,000 requests aur 5 million
rows) ka 1.2% aur 0.7% (meri ganit). Done jab: dusre screen par badlav ek minute me
dikhta hai.
Dental clinic software: ultra detail build plan
Page 25 of 150

2.5 Events
2.6 Paper se software
2.5.1 Domain events (M). events(id, type, entity_id, payload_json,
created_at, processed_at) . Appointment ban, badal, cancel ya arrived hone par usi
batch me ek event. Phase 7 (reminders) aur Phase 6 (stats) inhe padhenge, taaki
appointment ke code ko messaging ka kuch pata hi na ho. Done jab: ek booking = ek
event, aur rollback par event nahi.
2.6.1 Scope tay karo (S). Teen raaste: (A) sirf naye patients, purane tab daalo jab wo
aayen, (B) jinka ilaaj abhi chal raha hai unko pehle se bulk me, (C) saare. Meri salaah A
aur B. Entry ka waqt: patients × 2 minute ÷ 60, yani 400 patients ke liye lagbhag 13
ghante (andaza). Kaun daalega: receptionist khaali samay me ya part-time sahayak.
Done jab: sister ne likhkar haan kiya aur ginti register se aayi.
2.6.2 CSV template, generator aur validator (L). Fixed columns wali sheet. Node
script: CSV padhe, mobile normalize kare, file ke andar aur database me duplicate
dhoondhe, row-wise galtiyon ki report de, aur SQL file banaye jisme patient, tokens,
audit rows aur counters hon. import_batch_id  taaki dubara chalane par duplicate na
bane. Lagana wrangler d1 execute --file  se, Worker se nahi (CPU limit aur login
dono se bachne ke liye). Done jab: 200 nakli rows par report sahi aur dubara chalane
par 0 nayi rows.
2.6.3 Sirf validate chalao (M). Asli CSV par validate mode, database ko chhue bina,
developer ke laptop par. Galtiyon ki report receptionist theek kare. Staging me asli
data nahi jaata (Phase 1 ka niyam), isliye dry-run nakli rows par hota hai. CSV ko chat ya
email me mat bhejo aur kaam ke baad safely hata do. Done jab: asli CSV ki saari
galtiyan theek aur validate mode me 0 error.
2.6.4 Production import (S). Pehle Time Travel bookmark aur ek manual export.
Import. Phir ginti: CSV rows = database rows. 10 random patients ko paper se milao.
Done jab: ginti aur 10 ka match sahi.
2.6.5 Purana number aur dheere bharna (S). legacy_ref  search me, "purana patient,
paper file #123" ka flag. Doctor ke paas paper file hi rahegi. Done jab: purane register
number se patient mil jaata hai.
2.6.6 Paper ki photo jodna (L, baad me). Receptionist jab patient aaye to purane
parche ki photo uske profile me jode (Phase 3 ke Files module se). Done jab: ek patient
ke profile par purani photo khulti hai.
Dental clinic software: ultra detail build plan
Page 26 of 150

2.7 Test aur usability
Mat karo (Phase 2)
Mobile number ko unique mat banao, parivaar ek number share karta hai.
Duplicate par hard-block mat lagao, sirf chetavani.
Appointment delete mat karo, cancel aur karan.
Client ki ghadi par bharosa mat karo, "abhi" hamesha server se.
LIKE '%text%'  search mat likho, poori table padhta hai.
Aadhaar number mat maango, zarurat nahi aur risk bada.
Adhoore tab ya buttons mat dikhao.
Patient ko online booking mat do. Faisla: appointment sirf phone se, portal sirf dekhne
ke liye.
Bhaari calendar library mat jodo.
ABHA ya ABDM ka integration abhi mat banao. ABDM voluntary hai. Ek vendor ke blog
me "mandate aa rahe hain" likha tha par koi sarkari source nahi mila. Phase 11 me
dobara dekhenge.
Dashboard ke liye alag counters badha kar mat rakho, Phase 6 me appointments se
ginenge, warna ginti bigad jaati hai.
Staging ya local me asli patient ka data mat rakho. Gate ke test ke liye nakli paper
cards banao.
2.7.1 Automated tests (M). 50 parallel booking, har status badlav, time-zone ka kinara
(23:30 IST aur 00:15 IST ki appointment ka date_local  sahi), mobile ke niyam,
duplicate ke cases, role ke permissions, sahmati wapas lena. Done jab: CI green.
2.7.2 Search ka budget test (S). 5,000 nakli patients par 50 alag searches. Har ek ke
rows-read 100 se kam, aur CPU ms ki report. Done jab: report CI me dikhti hai.
2.7.3 Usability session (M). Receptionist ko 10 kaam do: naya patient, aadha naam se
dhoondho, aakhri 4 digit se dhoondho, appointment lagao, badlo, cancel karo, walk-in,
no-show, aaj ki list print, galat mobile theek karo. Developer chup rahe, sirf dekhe aur
note kare kahan atki. Done jab: 8 kaam bina madad ke, baaki ki issues list ban gayi.
2.7.4 Usability ke sudhar (M). Sirf top 5 issues. Done jab: dobara test me wahi issues
nahi aate.
Dental clinic software: ultra detail build plan
Page 27 of 150

Phase 2 ka gate
Receptionist ne 10 nakli paper cards (asli register jaisi, nakli naam) se 10 patients bina
madad ke darj kiye, har ek 90 second se kam, average 60 second ke aaspaas.
Aadha naam ya aakhri 4 digit se 10 me se 10 patients 5 second me mile.
Same slot par 50 parallel booking me overlap kabhi nahi bana, aur haari hui booking ne
audit ya event nahi likha.
"Aaj" screen se ek poora nakli din chala: 10 appointments, 3 walk-in, 1 emergency, 1
cancel, 1 no-show.
Search ka budget (100 rows se kam per search) pass hai.
Aaj ki list sister ke printer par theek print hui.
Sahmati ke bina bhi patient banta hai par SMS reminders band rehte hain.
Agar bulk import chuna: validate mode me 0 error, production import ke baad ginti
match.
Phase 3: Clinical record (ilaaj ka record)
Yeh doctor ka phase hai. Lakshya: doctor ka kaam badhe nahi, ghate. Nayi consultation
lagbhag 5 minute me aur routine follow-up 60 second me bhar jaaye. Chart, plan aur X-ray
ek jagah ho. Aur ek baar finalise hone ke baad record chupke se kabhi na badle, sirf
addendum (jod kar sudhaar) se. Software sirf yaad dilata hai, salaah nahi deta: koi dose
calculator ya dawai-takraav engine nahi, alerts wahi hain jo doctor ne khud tay kiye.
Daanton ke shabd (developer ke liye, meri jaankari, sister se ek baar check karwa lo)
Shabd Matlab App me kahan
Caries (cavity) daant me sadan ya ched chart ki condition,
diagnosis
Filling (composite,
GIC)
cavity bharna procedure aur chart
RCT (root canal) daant ki nas ka ilaaj, aksar 2 se 3 baithak plan aur sittings
Pulpitis, abscess daant ke andar ki nas me sujan, ya jad ke
paas pus
diagnosis list
Scaling tartar hatakar safai procedure
Dental clinic software: ultra detail build plan
Page 28 of 150

3.1 Doctor ke saath tay karna
3.2 Clinical data model
Shabd Matlab App me kahan
Extraction daant nikalna procedure, sahmati
Crown (cap), bridge daant par topi, ya gap par paul plan (aksar 2 baithak)
Implant jad me screw jaisa nakli daant lamba plan
Impacted tooth akal daadh jo poori bahar nahi nikli chart, diagnosis
IOPA, OPG 1 se 2 daant ka X-ray, poore jabde ka X-ray files ka kind
Gingivitis,
periodontitis
masude ki sujan, masude aur haddi ka
nuksaan
diagnosis
Surfaces M, D, O, B, L mesial (aage, beech ki line ki taraf), distal
(peeche), occlusal (chabane wali sataha),
buccal (gaal ki taraf), lingual (jeebh ki
taraf)
chart ke surface
Dudh ke daant 20 primary teeth chart 51 se 85
3.1.1 Doctor ke saath 90 minute (M). Teen kaam: (a) ek asli naye patient ka paper
parcha dekhna, wo kis kram me kya likhti hai; (b) lists ka draft sheet me: diagnosis,
procedures aur daam, tooth conditions, medical alerts, quick phrases; (c) chart ki
aadat: FDI ya Palmer, aur dayen-bayen ka drishya. Phase 3 isi ke bina shuru nahi hota.
Done jab: ek "clinical decisions" page hai jisme har list ka final draft aur sister ka "haan"
likha hai.
3.1.2 Reference projects dekhna (S). open-dentist (MIT, aapke jaisa stack: React, Vite,
Hono, D1; agenda, tooth chart, treatment plan, notes, invoices; par README me login
ya privacy ki baat nahi aur sirf 14 commits) aur react-odontogram (MIT, FDI numbering
aur bachchon ke daant, par sirf poora daant chunta hai, surface nahi). Sirf schema aur
screens ke idea lo, 2 ghante ki seema. Code asli patient data ke saath tab tak mat
chalao jab tak khud review na ho. Done jab: ek paragraph "kya liya, kya nahi, kyun".
3.2.1 Visit schema (M). visits : patient, appointment (khaali ho sakta hai), doctor,
visit_date_local , status (draft, final, void), chief complaint, history note, exam note,
gum condition (dropdown), vitals (BP, pulse, optional), advice, next-visit note,
Dental clinic software: ultra detail build plan
Page 29 of 150

3.3 Medical history aur alerts
finalised_at aur by, snapshot, hash, version. Ek appointment par ek hi visit. Done jab:
migration staging par aur ek test: dusra visit usi appointment par nahi banta.
3.2.2 Tooth events (M). Append-only tooth_events(patient, tooth_fdi, surface,
condition_code, visit_id, noted_at, noted_by) . Maujooda chart = har daant aur
surface ki sabse nayi row. Isse "us tareekh ka chart" aur audit muft me milte hain.
Daant hamesha FDI me store (11 se 48, 51 se 85). Done jab: chart ek patient ke liye 400
se kam rows padhkar banta hai.
3.2.3 Lists aur visit ki bachchi tables (M). Editable lists (1.5.4): diagnoses, procedures
(naam, default daam, optional code), conditions, allergens, quick phrases.
visit_diagnoses  (list se ya free text, optional daant) aur visit_procedures
(procedure, daant, surfaces, note). Done jab: doctor nayi diagnosis jodta hai aur wo
turant autocomplete me aati hai.
3.2.4 Medical history aur alerts ki schema (M). medical_history  (versioned jawab,
kab, kisne), alerts  (code, label jo doctor ne likha, restricted flag, active). Done jab:
purani history kabhi overwrite nahi hoti, nayi version banti hai.
3.2.5 Treatment plan schema (M). plan_items : daant, procedure, estimate (paise),
phase, status (planned, accepted, declined, deferred, in_progress, completed,
cancelled), sittings, bataya_on, created aur completed visit. Estimate badalne par
purani value plan_item_versions  me. Done jab: estimate badhane par karan zaruri.
3.2.6 Finalise, snapshot, addendum (M). Finalise par ek immutable JSON snapshot
(visit, procedures, chart ke badlav, plan ke badlav) aur uska SHA-256. Finalised rows
par UPDATE repository se bhi rukta hai aur DB ke trigger se bhi (D1 me trigger chalte
hain ya nahi, 1 ghante me test karo; na chale to sirf repository check, tests ke saath).
Addendum alag table: text, karan, samay, kisne. Done jab: finalised visit par seedha
UPDATE dono jagah fail hota hai.
3.2.7 Clinical permissions (S). Doctor: sab. Receptionist: patient ke basic aur alerts ka
sirf icon, notes ya chart nahi. Developer: kuch nahi. 1.3.4 ki matrix me jodo. Done jab:
receptionist ke token se clinical API 403 deti hai (test).
3.3.1 Medical history form (L). Checklist (editable list, Haan, Nahi, Pata nahi aur note),
jaise aise standard dental checklists me hote hain: dil ki bimari ya artificial valve, BP,
diabetes, thyroid, dama, mirgi, bleeding ki dikkat ya khoon patla karne wali dawai,
hepatitis, TB. Alag se: allergies (list se: penicillin ya antibiotic, local anaesthetic,
aspirin, latex...), abhi ki dawaiyan (text aur tag jaise "blood thinner", "steroid",
"bisphosphonate" (osteoporosis ki dawa jo extraction ke jokhim se judi hai, doctor ki
Dental clinic software: ultra detail build plan
Page 30 of 150

3.4 Tooth chart
list me)), garbhavastha ya stanpaan (mahila, 12 se 50 saal), aadatein (tambaku, paan-
gutka, sharab; bharat me mooh ke cancer ki screening ke liye kaam ki, meri jaankari),
aakhri review ki tareekh. Done jab: doctor 2 minute me ek poori history bhar sake aur
wo agle visit par dikhe.
3.3.2 Alerts ki patti (M). Checked items se alerts, text wahi jo doctor ne har item ke
liye likha ("Bleeding risk", "Penicillin allergy"). Software koi salaah nahi jodta. Dikhna:
patient profile, visit screen, appointment card par chhota icon. SMS, WhatsApp ya
print par kabhi nahi. Done jab: ek allergy jodne par teeno jagah dikhti hai.
3.3.3 Restricted alerts (M). Doctor jis item ko restricted kare (jaise HIV ya hepatitis),
uska detail sirf doctor ko. Receptionist ko sirf " ⚠  Doctor ko dekhna hai", API se bhi detail
nahi, aur doctor ke dekhne ka access_log  me record. Done jab: receptionist ke login me
detail na screen par na network response me.
3.3.4 "Koi badlav?" (S). History 6 mahine (setting) se purani ho to visit khulte hi ek-
click sawal "Medical history me koi badlav?" Haan khole form, Nahi to review ki
tareekh badle. Done jab: 7 mahine purani history par sawal aata hai, 2 mahine purani
par nahi.
3.4.1 Chart UI ka faisla (M). 3 ghante ka spike: (a) apna SVG, (b) react-odontogram, (c)
ek surface-wala package (jaise react-advanced-odontogram, maturity pata nahi).
Kasauti: surfaces, bachchon ke daant, keyboard, size, license, kitna badla ja sakta hai.
Meri salaah (a), kyunki surfaces chahiye aur UI badalna sasta rahe isliye schema UI se
alag hai. Done jab: ek table me teeno ke number aur faisla.
3.4.2 Chart component banana (XL). 32 permanent aur 20 dudh ke daant FDI layout
me. Har daant paanch hisson me (M, D, O ya I, B ya F, L ya P) ki surface chun sako, aur
poore daant ki condition (missing, implant, RCT) ke liye alag jagah. Keyboard (arrow,
Enter), screen-reader label ("Daant 46, neeche daayan pehla molar"), legend. Done
jab: bina mouse ke ek surface par filling lag sakti hai.
3.4.3 Disha aur notation (S). Chart dentist ke drishya me, jaisa FDI ke chart me
parampara hai: patient ka daayan chart ke baayen. Saaf label "R (patient ka daayan)".
Display FDI, Universal ya Palmer, store hamesha FDI. Active notation ka naam hamesha
dikhe, kyunki 11 se 18 ka matlab Universal aur FDI me alag hai. Done jab: sister ne
likhkar haan kiya ki disha uski aadat jaisi hai.
3.4.4 Conditions ki list aur rang (M). Editable. Shuruaat: caries, filling, RCT, crown,
bridge, missing, extracted, implant, fracture, mobile, impacted, root stump, sensitivity.
Har condition ke saath icon aur text (rang akela nahi), aur kis par lag sakti hai (surface
Dental clinic software: ultra detail build plan
Page 31 of 150

3.5 Visit screen (doctor ki main screen)
ya poora daant). Done jab: doctor nayi condition jode to chart me turant aati hai.
3.4.5 Chart lagana aur itihaas (L). Daant par click, condition chuno, aaj ke draft visit
me tooth_events banti hain. "Aaj badla" highlight. Dropdown se kisi purane finalised
visit ka chart dekho. Done jab: 3 daant badal kar purani tareekh ka chart dekhne par
badlav alag dikhte hain.
3.4.6 Dudh ke daant (M). Umar se default view (6 saal se kam: dudh, 6 se 12: mixed,
usse upar: permanent), haath se badalna. Dudh ke daant ki jagah permanent aaye to
alag event. Done jab: 8 saal ke bachche ka chart dono dikhata hai.
3.5.1 Visit kholna (M). "Aaj" screen ke "Ab" card se ek click par draft visit (ek
appointment par ek). Bina appointment ke bhi patient profile se "Naya visit". Done jab:
dobara click karne par wahi draft khulta hai, naya nahi.
3.5.2 Layout (L). Upar alerts ki patti. Tabs: Aaj ka visit, Chart, Plan, History, Files. Side
me pichle 3 visits ka saar. 1366x768 par theek, tablet par bhi. Keyboard pehle. Done jab:
doctor ek visit bina scroll ke aadhe se zyada kaam kar sake.
3.5.3 Complaint, exam, diagnosis, advice (M). Diagnosis autocomplete (list se, free
text bhi, optional daant). Quick phrases: doctor ki list, ;scal  likhne par poora text.
Vitals optional. Done jab: ek routine follow-up ka note 60 second se kam me
(developer ki stopwatch).
3.5.4 Procedures (M). Procedure chuno, daant aur surfaces chart ke selection se
bhare hue, note, default daam dikhe (billing Phase 5 se judega). Done jab: chart se
daant chunkar procedure 3 click me jud jaata hai.
3.5.5 Autosave aur save ki halat (L). Badle hue fields hi bhejo (patch), 1.5 second ruk
kar aur 5 second me ek baar. Chip: Saved, Saving, Not saved (laal, dobara koshish chal
rahi hai). Internet jaye to badlav memory me ruke aur wapas aate hi jaayein. Page band
karne par chetavani. version  check. Draft par har autosave ka audit row nahi likhte,
warna roz hazaron rows ban jaate hain: audit sirf draft bana, finalise, addendum aur
entered-in-error par. Yeh Phase 1 ke "har write par audit" niyam ka likha hua apvad hai.
Hisaab: roz 20 visit × 60 saves × 3 rows (index bhi ginte hain, meri samajh) = 3,600
rows, free limit (100,000) ka 3.6%. Done jab: network 30 second band karke wapas
laane par kuch khoya nahi.
3.5.6 Finalise (M). Naram chetavaniyan: diagnosis nahi likhi, procedure ke baad plan
update nahi hui. Phir snapshot, hash, lock. Sirf doctor. Done jab: finalise ke baad sab
fields read-only.
Dental clinic software: ultra detail build plan
Page 32 of 150

3.6 Treatment plan
3.5.7 Addendum aur "galti se darj" (M). Finalise ke baad sirf addendum (text, karan,
samay, kisne). Galat patient ya galat visit "entered in error": lakeer ke saath dikhe,
karan, audit, delete nahi. Done jab: addendum visit ke neeche samay ke saath dikhta
hai aur purana text jaisa tha waisa hi.
3.5.8 Adhoore visits ki yaad (S). "Aaj" screen par "3 visit finalise nahi hue" widget.
Kabhi auto-finalise nahi. Done jab: kal ke draft aaj subah dikhte hain.
3.5.9 Visit timeline (M). Patient ke saare visits ulte kram me, filter (procedure,
diagnosis), khol kar poora dekho, finalised read-only. Done jab: 30 visits wale patient
ka timeline tez khulta hai.
3.5.10 Visit templates (M, baad me). "Scaling", "RCT ka agla step", "Review" jaise
bundle jo procedure aur advice pehle se bhar de. Done jab: ek click me 4 fields bharte
hain.
Unified Patient History (docs/PATIENT_HISTORY.md) — Stage 1, Phase 3 (3.5.9 ke paas)
3.5.11 History tab shell aur summary strip (M). Patient profile (S04/S17) par Overview
ke saath History tab; returning patient (kam se kam ek past visit) par default.
Pinned strip: first/last visit, total visits, active allergies/alerts, outstanding due,
next appointment. Naya patient: empty state "Add first appointment". Filters strip
ke neeche (chips baad me polish 6.7.1). Done jab: tab 360/768/1366 par; empty aur
strip dikhte hain; pnpm check.
3.5.12 Merged history feed API (L). Ek staff endpoint merged, newest-first feed
(cursor pagination, 30 entries); indexes; har history view audit_log me (kaun, patient,
kab). 10 saal fake history <1 s clinic PC. Sources jo abhi maujood nahi wo khaali.
Done jab: seed patient par pehla page <1 s; cursor "load more"; audit row; tests.
3.5.13 Stage-1 feed sources (L). Appointments (status chain reschedule), visits
(complaint/diagnosis/notes/doctor/draft|finalised; amendment entries), treatments
(tooth, procedure, status, cost), files (thumbnail/type; open viewer), medical/allergy
changes (old→new), consents given/withdrawn. Row tap → asli screen. Done jab: har
type ka unit/API test; missing module = khaali, crash nahi.
3.5.14 History permissions (M). Doctor sab; receptionist read-only: basic, appointments,
bills/payments/dues (jab Stage 3 aaye), scan aur consent files. API se filter: clinical
notes, diagnosis, tooth chart, restricted medical, X-rays, clinical photos receptionist
response me nahi. Medical alerts icon only. Done jab: receptionist call tests assert
hidden types absent.
3.5.15 Archived patient history (S). 2.1.8: archive sirf default search se chhupata hai;
History doctor + permitted receptionist view se poori. Done jab: archived patient
History khulti hai; acceptance test.
3.6.1 Chart se plan banana (L). Daant par click, "Plan karo": procedure, estimate
(default daam, badal sakte ho), phase (1 turant, 2 bimari rokna, 3 marammat, 4
sundarta; naam editable), sittings. Done jab: 4 items 2 minute se kam me jud jaate
hain.
3.6.2 Plan screen (M). Phase ke hisaab se, total rupaye, status chip, patient ka faisla
(accepted, declined, deferred) aur "estimate patient ko kab bataya". DCI ke hisaab se
fees ilaaj se pehle batani hain (3.8) aur har procedure ka kharch aur anumaan saaf
hona chahiye (5.7.1). Done jab: bataya_on ke bina item "accepted" nahi hota.
3.6.3 Sittings ka hisaab (M, baad me). RCT, crown, implant jaise multi-sitting kaam: har
procedure ke steps (editable, jaise RCT: access, naap, bharna, crown), visit me step
tick, "agla step" par quick-book (2.3.10). Done jab: 3 sitting wale RCT ka hisaab ek
screen par.
3.6.4 Plan aur visit ka jod (M). Visit me jo procedure hui use plan item se milao (sitting
ya item poora). Plan ke bina hui procedure ek "completed" item ban jaye. Done jab:
plan item ka status visit finalise par apne aap badalta hai.
3.6.5 Estimate me badlav (S). Badhane par karan zaruri (DCI 5.7.1 kehta hai badhotri ka
aadhaar hona chahiye), purani value version me. Done jab: karan ke bina save nahi
hota.
Dental clinic software: ultra detail build plan
Page 33 of 150

3.7 Files: X-ray, photo, scan
R2 me jagah ka andaza (meri maanyata)
3.7.1 Source tay karo (S). X-ray ka software ya RVG kaunsa hai, JPEG ya PNG me
export karta hai ya sirf DICOM, USB ya shared folder se. Photo kis phone se. Scanner
hai ya phone. Done jab: ek line me likha hai ki X-ray kaise computer se browser tak
aayega.
3.7.2 Upload API (M). Login ke baad Worker file R2 me rakhta hai. Key
p/{patient}/{ulid} , kind (iopa, opg, photo, scan, consent, other), mime, bytes,
sha256, tareekh, optional daant, caption. Types: jpg, png, webp, pdf. Seema 15 MB.
Kabhi public URL nahi, file Worker ke raste auth ke baad. Done jab: bina login ke URL
401 deta hai.
3.7.3 Browser me taiyari (M). Thumbnail canvas se (300 px), phone ki photo 2000 px
aur JPEG 85% par chhoti, X-ray jaisa hai waisa (dobara compress nahi). iPhone ki HEIC
photo Chrome me nahi khulti (meri jaankari), camera ko JPEG par rakho. Done jab: 4
MB ki photo ~500 KB bani, X-ray ke bytes wahi.
3.7.4 Files tab aur viewer (L). Grid (kind, tareekh, daant ke hisaab se), viewer me
zoom, pan, brightness, contrast, invert (CSS filters, asli file nahi badalti), rotate, do
images saath-saath (pehle aur baad). Daant se jodo. Done jab: 2 X-ray saath-saath
dekh kar contrast badla ja sakta hai.
3.7.5 Ijazat aur access log (S). Doctor sab files. Receptionist sirf scan  aur consent
upload aur dekh sake. Clinical image khulne par access_log . Done jab: receptionist se
X-ray ka URL 403.
3.7.6 Storage ka panel (S). files.bytes  ka jod (R2 API nahi), 7 GB par peela aur 9 GB
par laal alert. Done jab: nakli 8 GB par panel peela dikhta hai.
3.7.7 File hatana (S). Sirf soft delete karan ke saath, R2 me object retention tak rahe.
Done jab: hatayi file listing se gayab par audit me hai.
3.7.8 DICOM dekhna (L, baad me). Agar RVG software sirf DICOM deta ho. Tab tak
JPEG export. Done jab: ek DICOM file browser me khulti hai.
Halat Maanyata MB per
mahina
10 GB kitne me
bharega
Halka 100 naye patients, 0.6 file per patient,
0.5 MB
30 lagbhag 28 saal
Madhyam 200 patients, 1.5 file, 0.8 MB 240 lagbhag 3.6 saal
Dental clinic software: ultra detail build plan
Page 34 of 150

Isliye photo chhoti karna, 15 MB ki seema aur 7 GB par alert zaruri hain. R2 ka free hissa 10
GB-month, 1 million write aur 10 million read hai, bandwidth free; usse upar $0.015 per GB-
month, yani 10 GB extra lagbhag $0.15 per mahina. Operations kam hain: madhyam halat
me ~600 write aur ~3,600 read per mahina. Card chahiye ya nahi, Phase 0 ke account
setup me test karo (yeh pakka nahi pata). Plan B: Backblaze B2.
3.8 Sahmati (consent)
3.9 Records ki maang (DCI 3.3.2)
Halat Maanyata MB per
mahina
10 GB kitne me
bharega
Bhaari 200 patients, 3 file, 2.5 MB 1,500 lagbhag 7 mahine
3.8.1 Consent ke templates (M). Editable text: extraction, RCT, implant, whitening ya [note: Hindi version removed, printed documents are English only, see docs/DECISIONS.md]
sundarta ke kaam, anaesthesia, photo aur X-ray ka istemal. Versioned, sirf
English. DCI ke code ke text me informed consent ka alag clause mujhe nahi mila, par
invasive ya wapas na hone wale kaam par likhit sahmati achha tareeka hai (meri salaah,
vakeel ya IDA se poochho). Done jab: sister ne har template padhkar haan kiya.
3.8.2 Sahmati darj karna (M). consents  me visit_id  aur plan_item_id  ke naye
nullable columns, template version, kisne samjhaya, zubani ya likhit, tareekh. Print
(Phase 4), sign ho kar scan consent  kind me. Done jab: extraction jaise procedure par
sahmati ke bina "Done" karne par naram chetavani.
3.8.3 Photo ki sahmati (S). Staff app me case ki photo upload par photo-sahmati check.
Marketing ke liye alag marketing_photo  sahmati, aur wo bhi tab tak istemal nahi jab
tak DCI ke vigyapan ke niyam (8.1 se 8.3) vakeel se na dekh lo (Phase 8). Done jab:
sahmati ke bina upload par chetavani.
3.9.1 Maang ka register (M, baad me). DCI 3.3.2 ke hisaab se maang par records 72
ghante me, valid receipt lekar, aur diye hue ki certified copy rakhne ki salaah. Register:
kisne maanga (patient, attendant, kanooni), kya, kab, due (maangne ke 72 ghante,
setting), 48 ghante par yaad, receipt number (counter). Tab tak paper register
chalega. Done jab: 48 ghante par yaad aati hai.
3.9.2 Records ka bundle (M, baad me). Treatment summary ka print, files ki list, diya
gaya sab access_log  me, aur diye hue ka metadata aur hash ek jagah (copy ka
saboot). Done jab: ek nakli maang ka poora bundle 10 minute me.
Dental clinic software: ultra detail build plan
Page 35 of 150

3.10 Test aur usability
Mat karo (Phase 3)
Dose calculator, dawai-takraav engine, AI diagnosis mat banao. Alerts sirf doctor ke
likhe label.
Finalised record par seedha UPDATE mat chalne do, sirf addendum.
Poora perio chart (masude ki gehrayi ke naap) v1 me mat, sirf gum condition
dropdown. Phase 11 me dekhenge.
Images D1 me (base64) mat rakho, sirf R2. Public URL kabhi nahi.
X-ray dobara compress mat karo. Sirf phone ki photo chhoti karo.
Restricted alerts receptionist ko mat dikhao. Medical alerts SMS, WhatsApp ya print me
mat daalo.
Kabhi auto-finalise mat karo.
Notations mat milao: hamesha dikhao kaun sa chal raha hai.
UI library ko schema tay mat karne do: FDI, surface aur condition code store karo.
open-dentist ya kisi aur ka code bina license aur security review ke asli data ke saath
mat chalao.
ICD ya insurance coding v1 me mat.
Galat entry delete mat karo, "entered in error" karo.
3.10.1 Automated tests (L). Clinical permissions (receptionist API se notes ya restricted
alerts nahi paata), finalise lock (repository aur DB), addendum, entered-in-error,
tooth_events se chart banna, plan ka status badlav, upload ki ijazat. Done jab: CI green.
3.10.2 Autosave ki tod-phod (M). Internet ka aana-jaana, do tabs, version conflict,
browser band. Done jab: koi bhi sequence me note nahi khota.
3.10.3 Doctor ke saath usability (M). 8 kaam, samay naapkar: nayi consultation poori
(history, exam, chart 3 daant, diagnosis, plan 4 items) 5 minute se kam, follow-up 60
second se kam, X-ray upload, finalise, addendum, pichle visit ka note dhoondhna.
Developer chup, sirf note. Done jab: 6 kaam bina madad ke, baaki ki issues list.
3.10.4 Sudhar (M). Top 5 issues. Done jab: dobara test me wahi issues nahi.
3.10.5 Nakli clinical data (S). 200 nakli patients, charts, visits, files (asli kuch nahi)
demo aur speed-test ke liye. Done jab: ek patient ka chart aur timeline 400 se kam
rows padhkar khulta hai.
Dental clinic software: ultra detail build plan
Page 36 of 150

Phase 3 ka gate
Doctor ne ek nayi consultation (history, exam, chart me 3 daant, diagnosis, plan me 4
items) 5 minute ke aaspaas me bhari aur ek follow-up 60 second se kam me.
Network 30 second band karke wapas laane par autosave me kuch nahi khoya.
Finalise ke baad edit API aur DB dono se rukta hai, addendum chalta hai.
Receptionist ke login se clinical notes aur restricted alerts API se bhi nahi milte.
X-ray upload, viewer aur access log chalte hain, R2 par koi public URL nahi.
Chart ki disha aur notation sister ne manzoor kiye.
Ek patient ka chart aur timeline 400 se kam rows padhkar khulta hai.
Extraction par sahmati ke bina naram chetavani aati hai aur scan link hota hai.
Phase 4: Parcha, dawai ki list aur print
Yeh wo hissa hai jo patient ke haath me jaata hai, isliye sister ko sabse zyada yahin se
"professional" lagega. Aapki baat: doctor diagnosis likhe, dawai par click kare, parcha ban
jaye, print ya PDF. Yahan wahi banta hai, ek upgrade ke saath: har dawai ke saath uski dose,
kitne din, khane se pehle ya baad, English me, sab doctor ki apni list se, taaki
click ke baad kuch dobara likhna na pade. Aur ek niyam: parcha ek baar issue hone par
badalta nahi, badlav naya "revised" parcha banata hai.
DCI ke niyam jo yahan lagu hote hain (maine DCI code ka text padha, vakeel ya IDA se
confirm): registration number clinic me aur har prescription, certificate aur receipt par
(3.4.1); prescription ke letterhead par naam, designation, degree aur registration (5.7.2);
dawai generic roop me likhne ki koshish (3.5); agar dentist ne khud dawai di to
prescription me saaf likhna (5.7.1); medical certificate ka register aur har certificate ki
copy, patient ka pata, signature ya angootha aur kam se kam ek pehchaan ka nishan
(3.3.3); letterhead par dentist ki photo nahi (8.3.1).
4.1 Dawai ki list
4.1.1 Medicines ki schema (M). medicines : generic naam, brand naam (text), form [note: Hindi instruction column removed, English only, see docs/DECISIONS.md]
(Tab, Cap, Syp, Gel, Mouthwash, Drops, Other), strength, default dose, default
frequency, default din, khane ke saath (pehle, baad, sote waqt, kabhi bhi), instruction
(English), tags, category, active, order. Done jab: migration staging par chal
gayi.
Dental clinic software: ultra detail build plan
Page 37 of 150

4.2 Parcha banana (visit ka "Dawai" tab)
4.1.2 Doctor ki list bharna (M). Sister ki aam istemal hone wali 40 se 60 dawaiyan [note: Hindi instruction removed, English only, see docs/DECISIONS.md]
(Phase 0 ke parchon se), har ek ki default dose aur English instruction unhi ki likhi hui.
Done jab: sister ne har row ke
saamne printout par sign kiya.
4.1.3 List editor (M). 1.5.4 ke generic editor par: jodna, badalna, band karna (delete
nahi), order. Badlav sirf naye parchon par lagta hai, purane issue hue parche jaise the
waise. Generic naam bada, brand chhota. Done jab: dose badalne ke baad purana
parcha nahi badla.
4.1.4 Tags aur allergy ka naata (S). Doctor har dawai par tag lagaye (jaise penicillin ,
nsaid ) aur har allergen se tag jodo. Software sirf match dikhata hai. Done jab:
"Penicillin" allergen ko penicillin  tag wali dawaiyon se jod kar test.
4.1.5 Sets (M). Roz ke combos: "Extraction ke baad", "RCT ka dard", "Scaling ke baad".
Ek click me kai dawaiyan, har ek baad me badli ja sakti. Done jab: ek set se 3 dawaiyan 1
click me judti hain.
4.2.1 Prescription schema (M). prescriptions  (visit, patient, weight_kg [note: language column removed, prescriptions are English only, see docs/DECISIONS.md]
optional, advice, follow_up_date, status: draft, issued, revised, rx_no  financial year ke
hisaab se gap-free, dentist_dispensed  flag aur note) aur prescription_items
jisme dawai ke naam, strength, dose, frequency, din, timing aur instruction ki copy
(snapshot) hoti hai. Master list badle to purana parcha nahi badlega. Done jab: master
me naam badal kar purana parcha dekha, wahi purana naam.
4.2.2 Dawai jodne ki screen (L). Search (generic ya brand), Enter se jodo, default
bhare hue, row me hi badlo, upar-neeche karke order, hatao, set daalo. Keyboard pehle.
Visit screen ke tabs me "Dawai" jodo. Done jab: 4 dawaiyan 45 second me.
4.2.3 Dose aur din ke inputs (M). Frequency presets (1-0-1, 1-1-1, 0-0-1, BD, TDS, SOS,
HS), din (ya "dard rehne tak"), aur sirf-padhne wala "kul goliyan" (dose × frequency ×
din ka seedha jod, doctor ke daale hue number par, koi clinical hisaab nahi). Done jab: 1-
0-1 × 5 din par "10" dikhta hai.
4.2.4 Suraksha ki jaali (M). Allergy ka yaad dilana (rok nahi): patient ki allergy ka tag
dawai ke tag se mile to us row par laal patti "Allergy: Penicillin (patient ki history)". Aur:
ek hi dawai do baar, adhoori row (dose, frequency ya din khaali), garbhavastha ka tag
aur garbhwati patient. Done jab: har ek ka test, aur patti ke saath bhi doctor print kar
sakta hai.
Dental clinic software: ultra detail build plan
Page 38 of 150

4.3 Print ka engine
4.2.5 Advice, agli visit, vajan (S). Advice phrases (list), agli visit ki tareekh (2.3.10 ke
madadgaar se), vajan kg me (bachchon ke liye record aur print, hisaab nahi). Done jab:
advice aur tareekh parche par aate hain.
4.2.6 Issue aur revise (M). "Issue" par parcha lock (print ya issue button se). Uske
baad badlav "Revised" naya version, purana safe, parche par "Revised" likha.
Receptionist sirf issue hua parcha print kar sakti hai. Issue hone par patient portal ke liye
"share" flag (Phase 8 padhega). Done jab: issue ke baad seedha edit fail, revise chalta
hai, dono versions dikhte hain.
4.2.7 Pichla parcha copy (S). Wahi dawai wapas wale marij ke liye ek click. Done jab:
copy ke baad naya draft banta hai, purana nahi chhua.
4.2.8 History feed: prescriptions (M). Unified History (docs/PATIENT_HISTORY.md
Stage 2): medicines list, date, doctor; row opens original; reprint original date.
Stage 1 feed tootna nahi. Done jab: issued Rx History me; reprint watermark/log
4.3.5 ke saath; receptionist clinical Rx detail nahi (3.5.14).
4.3.1 Print layout engine (L). 1.4.8 ka PrintLayout  poora karo: A4 aur A5, header ya [note: Hindi font and Hindi sample removed, print is English only, see docs/DECISIONS.md]
footer chalu ya band, margins, page-break ke niyam, parche ke liye ek page ka niyam
(zyada ho to chetavani). Font: Inter ya system font. Done jab: English sample bina kate, bina
kharab akshar ke print.
4.3.2 Letterhead aur niyam (S). Header me clinic ka naam, logo, pata, phone, timings,
doctor ka naam, designation, degree aur registration number, saath me dastakhat ki
image. Doctor ki photo nahi (8.3.1). Registration number khaali ho to parcha,
certificate aur receipt print hi na ho: "Settings me registration number bharo". Done
jab: test: khaali number par print blocked.
4.3.3 Parche ka template (M). Sister ke saath baith kar: A5 portrait, patient ka hissa, [note: language setting removed, English only, see docs/DECISIONS.md]
diagnosis (dikhao ya chhupao), Rx ki list, advice, agli visit, "dawai clinic se di" ka line
(agar lagu), signature. Settings: font size, header chalu ya band, kya dikhana
hai. Live preview. Koi drag-drop designer nahi. Done jab: sister ne preview par likhkar
haan kiya.
4.3.4 Asli printer par test (S). Sister ka asli printer aur kagaz: A4 ya A5, pehle se
chhape pad par bhi (header band ke bina, upar ka offset). Offset settings me. Ek "test
print" page. Done jab: 10 test print, ek bhi kata nahi.
4.3.5 Print ka record aur reprint (S). print_log  (kaunsa document, version, kisne,
kab, kitni copy). Dobara print par "DUPLICATE" watermark. Done jab: reprint par
watermark aur log dono.
Dental clinic software: ultra detail build plan
Page 39 of 150

4.4 Baaki documents
4.5 Test aur sign-off
4.4.1 Estimate sheet (M). Plan (3.6) se: phase ke hisaab se items, total, valid tareekh,
"yeh anumaan hai" ka note, patient ka sign ka line. DCI 5.7.1 me har procedure ka
kharch aur anumaan saaf hona chahiye aur badhotri ka aadhaar. Done jab: plan badalne
par sheet badalti hai aur purani printed version log me hai.
4.4.2 Consent form print (M). 3.8.1 ke template se, patient, procedure aur doctor ki
details ke saath, sign ke lines (patient ya guardian, gawah), tareekh. Done jab:
extraction ka form A4 par ek page me.
4.4.3 Medical certificate aur register (L). Fields: naam, umar, pata, pehchaan ka
nishan, signature ya angootha, kaaran, tareekh se tareekh, optional diagnosis.
Number financial year ke hisaab se gap-free. Register screen jisme har certificate aur
uski copy. DCI 3.3.3 ke hisaab se. Appendix 2 ka format maine nahi dekha, sister ka
maujooda format hi lo. Done jab: ek certificate ka print aur register me copy dono.
4.4.4 Referral letter (S, baad me). Kisko, kyun, findings, X-ray ka zikr. Done jab: ek
page print.
4.4.5 Treatment summary (M, baad me). Visits, procedures, plan, dawaiyan ka print
(insurance ya records ki maang 3.9.2 ke liye). Done jab: ek patient ka summary 2 page
se kam.
4.4.6 Khaali forms (S). Registration form, medical history form, sahmati ke khaali form.
Paper downtime aur patients ke bharne ke liye. Done jab: 20 copies ek click se print.
4.4.7 Ilaaj ke baad ki salaah ki sheets (M, baad me). Doctor ki likhi chhoti sheets [note: Hindi version removed, printed documents are English only, see docs/DECISIONS.md]
(extraction ke baad, RCT ke baad, scaling ke baad), English me. Done jab: sister
ne har sheet ka text maanjoor kiya.
4.4.8 Parche par QR (S, baad me). QR scan par ek page jo sirf batata hai "yeh parcha is
clinic se is tareekh ko issue hua", medical detail nahi. Naqli parchon se bachav. Done
jab: galat code par "nahi mila".
4.5.1 Print ke regression tests (M). Playwright se sample parche (English, 1 [note: Hindi samples and Hindi font check removed, English only, see docs/DECISIONS.md]
se 8 dawaiyan) ka screenshot compare. Done jab: CI me.
4.5.2 Doctor ka sign-off (M). Purane asli parchon jaisi 10 nakli prescriptions banakar
sister ki apni paper style se milao. Generic naam, typo, dose. Done jab: sister ne 10 par
haan kiya.
CANCELLED 4.5.3 Hindi aur English padhai (S). Saari seed instructions printout par sister ki aankh [CANCELLED note: UI is English only, see docs/DECISIONS.md]
se. Done jab: kuch bhi galat nahi.
Dental clinic software: ultra detail build plan
Page 40 of 150

Mat karo (Phase 4)
Bahar ka drug database ya API mat jodo. Dentist ki 40 se 60 dawaiyan hi kaafi hain aur
galti ka jokhim bada.
Diagnosis se dawai khud mat suggest karo. Alerts sirf doctor ke tag se.
Dose calculator mat banao.
Issue hue parche ko seedha mat badlo, revise karo.
Koi translation system ya Hindi version mat jodo: UI aur print sirf English.
Registration number ke bina letterhead mat chalao.
Letterhead par doctor ki photo mat lagao.
Server par PDF mat banao, browser print aur "Save as PDF" kaafi.
Parcha ya dawai ki jaankari SMS ya WhatsApp se mat bhejo, patient portal ya haath
me.
Mujhe DCI 8.5 ka matlab pakka nahi mila (mere padhne ke tool ne do alag matlab diye),
isliye generic aur brand dono dikhane ka faisla original text padhkar karo.
Phase 4 ka gate
Sister ki 10 nakli prescriptions unke asli printer aur pad par print hui aur unhone
manzoor kiye.
Master list badalne par purane parche nahi badle.
Registration number khaali par parcha, certificate aur receipt print nahi hote.
Allergy ki patti, duplicate aur adhoori row ke tests pass.
Reprint par DUPLICATE watermark aur print log.
English print bina kate sahi.
Estimate, consent aur certificate ke print sister ne manzoor kiye, certificate ka
number bina gap ke.
Dawai list ka audit record bana.
4.5.4 Dawai list ka audit record (S). "Maine yeh list dekhi" ek record: kisne, kab,
kaunsa version. Jab bhi list bade badlav se guzre dobara. Done jab: record settings me
dikhta hai.
Dental clinic software: ultra detail build plan
Page 41 of 150

Phase 5: Billing
Paisa sabse sensitive cheez hai: ek rupaye ka fark bhi bharosa tod deta hai. Isliye is phase
ka lakshya hai ki sister ka paper receipt book jo karta hai wahi software kare, par galti ki
gunjaish ke bina: bill, payment (cash, UPI, card, aadha-aadha), advance, baaki raqam,
refund, roz ka hisaab. Online payment nahi (aapka faisla), sirf yeh darj hota hai ki clinic ko
paisa kaise mila. Card ya UPI PIN jaisi cheez kabhi store nahi hoti, sirf mode aur reference.
Tax ke bare me jo pakka mila (CA se confirm zaruri)
Dental ilaaj GST se mukt hai (notification 12/2017 ki entry 74, ek tax-blog ke hisaab se).
Sirf sundarta ke kaam (whitening, smile designing wale veneers) par Maharashtra
AAR ne 18% GST mana hai (SAC 999722). AAR ka faisla sirf samajhaane wala hai,
kanooni nazeer nahi.
Sirf mukt ilaaj karne wale clinic ko GST registration nahi chahiye, par ek bhi taxable
cheez bechne par mukt ilaaj ki kamai bhi 20 lakh ki seema me ginti hai (usi blog ke
hisaab se).
Ek vyakti se ek din me, ek transaction me ya ek maukey par 2 lakh ya zyada cash lena
mana hai. Naye Income-tax Act 2025 me yeh section 186 hai (purane Act me 269ST).
Kharab ilaaj jaise implant ya full-mouth me yeh zaroor aa sakta hai.
Isliye design: har bill item par tax category aur rate store ho (abhi sab 0%), GST chalu
karna ek setting ho, code dobara na likhna pade.
5.1 Pehle tay karo
5.1.1 CA ke sawal (S). CA se likhit jawab: (1) GST registration abhi ya kabhi, (2) kaun se
procedures sundarta ke maane jaayenge, (3) bill ka roop: bill of supply ya tax invoice,
(4) 2 lakh cash ki seema par kya karein, (5) books aur bills kitne saal rakhein, (6) kya
presumptive tax (44ADA) jaisi koi shart cash aur digital ke share par lagti hai (ek blog
me iska zikr tha, pakka nahi), (7) bill par kya likhna zaruri hai. Done jab: sawalon ke
jawab ek page me.
5.1.2 Number series (S). Alag series: bill B-2627-000123 , receipt R-... , refund
F-... , certificate C-... , financial year (April se March) ke saath, gap-free, counters
se (1.2.4). Parallel-run ke dauran alag "S" series (shadow), jisse asli paper receipt book
ke saath number na takraye. Done jab: 50 parallel requests par na duplicate na gap.
5.1.3 Paise ke niyam (S). Sab integer paise. Percent discount ka rounding half-up. Ek
explicit "round-off" line, ± ₹ 0.99 se zyada nahi. Ek bill ki upari seema (jaise ₹ 10,00,000)
jisse upar pushti maange. Done jab: niyam ek file me aur unit tests.
Dental clinic software: ultra detail build plan
Page 42 of 150

5.2 Billing schema
5.3 Billing ke screens
5.2.1 Bills aur items (M). bills  (patient, visit optional, bill_no, tareekh, status: draft,
issued, cancelled, subtotal, discount, tax, round_off, total, notes), bill_items
(procedure ya custom naam, daant, qty, unit price, discount, tax category, rate, tax,
total). Done jab: migration aur ek test ki total hamesha items ke jod se milta hai.
5.2.2 Payments aur allocation (M). payments  (patient, amount, mode: cash, upi, card,
bank, cheque, other, reference, received_by, received_at, receipt_no, day_local) aur
payment_allocations  (payment, bill, amount). Jo raqam kisi bill par nahi lagi wo
patient ka advance (credit). Done jab: ek payment kai bills par bant sakti hai aur kabhi
bill ke total se zyada nahi.
5.2.3 Refund aur cancellation (M). refunds  (payment, amount, mode, karan,
approved_by). Cancelled bill ka number rehta hai, karan zaruri. Refund kabhi diye gaye
paise se zyada nahi. Done jab: ek test mode aur raqam dono par rokta hai.
5.2.4 Patient credit (S). Advance = payment jo kisi bill par nahi lagi. Dikhna, kisi naye
bill par lagana. Done jab: advance se bill ka aadha bhar jaata hai.
5.2.5 Purane baaki (S). Paper register ke baaki raqam ek "opening balance" bill ke roop
me (tareekh ke saath), taaki purane dues na chhoote. Done jab: 5 purane marijon ka
baaki asli register se mila.
5.2.6 Tax ke columns (S). tax_category  (abhi "mukt" 0% aur "sundarta" 18% jo CA
tay kare), rate_bp , tax_paise . Setting gst_mode  band. Done jab: gst_mode chalu
karke ek test bill me tax sahi jodta hai (sirf test).
5.2.7 Issue hue bill ka lock (S). Phase 3 ki tarah repository aur DB trigger dono se
UPDATE rokna. Sudhaar sirf cancel aur naya bill. Done jab: issue hue bill par seedha
UPDATE dono jagah fail.
5.3.1 Visit se bill (L). "Bill banao" visit ki procedures aur plan ke daam se bhara hua.
Qty aur daam badal sakte ho (list se alag daam par karan), apna item jodna, discount
ka hissa (5.3.6), preview, Issue. Done jab: ek visit ka bill 3 click me.
5.3.2 Payment lena (M). Raqam, mode, reference, split (cash aur UPI), partial. Shortcut
"poora baaki", "aadha". Receipt apne aap. 2 lakh cash par chetavani. Done jab: 1,000
cash aur 500 UPI ek hi payment me, receipt par dono.
5.3.3 Patient ka khaata (M). Charges, payments aur baaki ek list me, filter, statement
print. Done jab: 20 entries wale patient ka baaki hamesha sahi.
Dental clinic software: ultra detail build plan
Page 43 of 150

5.3.4 Baaki ki list (M). Jinka baaki hai, umar ke hisaab se (0 se 30, 30 se 60, 60 se zyada
din), aakhri call ka note. Appointment card par "baaki hai" ka nishan (sirf receptionist ko
raqam). Done jab: list me saare baaki wale aur total khate se milta hai.
5.3.5 Advance lagana (S). Naya bill banate hi credit lagane ka option. Done jab: credit
ke baad baaki sahi.
5.3.6 Discount aur approval (M). Discount ka field aur karan list (mushkil me, staff ya
parivaar, courtesy, anya). Receptionist maang sakti hai, doctor ek click me manzoor
karti hai, tab bill issue hota hai. Discount ka vigyapan kabhi nahi (DCI 8.1.3 inducement
mana karta hai), yeh sirf billing ke waqt ka faisla hai. Done jab: bina approval ke
discount wala bill issue nahi hota.
5.3.7 Refund (M). Sirf doctor, diye gaye paise se zyada nahi, karan, mode. Done jab: ek
refund ka poora raasta test.
5.3.8 Bill cancel (S). Sirf doctor, karan, number bacha rahe, pehle payment refund ya
dusre bill par. Done jab: payment wale bill ko seedha cancel karne par rokta hai.
5.3.9 Roz ka hisaab (L). Mode ke hisaab se jod, ginti hui cash, fark, note, "din band
karo". Band hone ke baad us din ki entry nahi, late entry agle din "late entry" ke naam
se, ya doctor ki ijazat se dobara kholna (audit). Cash aur digital ka share bhi dikhao.
Print. Done jab: 10 payments ka nakli din band hota hai aur fark 0 ya likhit karan ke
saath.
5.3.10 Raqam shabdon me (S). "Rupees one lakh twenty five thousand only", lakh aur [note: Hindi option removed, English only, see docs/DECISIONS.md]
crore ke saath, sirf English. Done jab: 0, 1, 99, 100, 1,000, 1,00,000, 12,34,567,
1,00,00,000 ke tests.
5.3.11 Bill aur receipt print (M). Phase 4 ke engine par: bill (items aur payments
neeche), alag payment receipt. Registration number, patient ka naam aur code, raqam
shabdon me, baaki, "yeh GST invoice nahi hai" (jab tak gst_mode band hai). Reprint par
DUPLICATE. Done jab: A5 par ek page me, sister ne manzoor kiya.
5.3.12 CA ke liye monthly export (S). CSV: tareekh, bill number, patient code (naam
nahi), procedure group, tax category, raqam, discount, tax, mode ke jod. Done jab: CA
ne ek nakli mahine ki file khol kar manzoor ki.
5.3.13 Kisht ka schedule (M, baad me). Lambe plan (braces, implant) me agli kisht ki
tareekh aur raqam, yaad dilane ke liye Phase 7 se. Done jab: 6 kisht ka schedule baaki
ke saath milta hai.
5.3.14 Thermal printer layout (S, baad me). 80 mm ki chhoti receipt agar clinic ke paas
thermal printer ho. Done jab: ek test print.
5.3.15 Plan aur bill ka milan (S). Plan screen par har item ka estimate, bill hua aur mila.
Done jab: ek item par estimate se zyada bill ka fark dikhta hai.
5.3.16 History feed: bills aur payments (M). Unified History (docs/PATIENT_HISTORY.md
Stage 3): bill number, amount, discount, payments, refunds, advances, balance due;
cancelled/voided bills marked cancelled, still listed. Summary strip outstanding due
live. Done jab: billing entries feed me; row → asli bill/payment screen; tests.
Dental clinic software: ultra detail build plan
Page 44 of 150

5.4 Ginti sahi rahe
5.5 Test aur sign-off
Mat karo (Phase 5)
Online payment gateway mat jodo (aapka faisla, aur RBI aur PCI ki jhanjhat).
Card number, UPI PIN ya bank password kabhi store mat karo, sirf mode aur reference.
Issue hua bill ya diya hua payment mat badlo ya hatao, cancel ya refund karo.
Bina karan ke discount, refund ya cancel mat hone do.
Paise float me mat rakho.
Baaki raqam ya treatment SMS ya WhatsApp me mat bhejo (generic yaad hi).
Din band hone ke baad purani tareekh me entry mat daalo (late entry ya doctor ki
ijazat).
Receptionist ko poora revenue mat dikhao, sirf aaj ka summary.
GST ka hisaab code me hard-code mat karo, category aur rate store karo.
Insurance ya TPA v1 me mat.
Dues apne aap "write off" mat karo.
Discount ya offer ka vigyapan mat banao (DCI 8.1.3).
5.4.1 Ginti ki jaanch (M). Har hafte GitHub Action SQL ke aggregate se (Worker ka
CPU nahi) saari bills aur payments dobara jodta hai: har bill ka paid = allocations ka jod,
har payment ke allocations aur refunds uski raqam se zyada nahi, har patient ka baaki
khate se milta hai. Fark par Healthchecks fail aur email. Done jab: jaan-boojh kar galat
row daalkar alarm aaya.
5.4.2 Stats ke liye events (S). Bill issue, payment aur refund par events (2.5.1) taaki
Phase 6 ka dashboard roz ke aankde appointments ki tarah dobara gin sake. Done jab:
ek payment = ek event.
5.5.1 Paise ke tests (M). Rounding aur allocation ke property tests, numbering ka
concurrency, refund ki seema, din band hone ka lock, triggers. Done jab: CI green.
5.5.2 Receptionist ke saath usability (M). 10 kaam: visit se bill, split payment,
advance, partial payment, discount ki maang, refund ki maang, din band karna, baaki
wale dhoondhna, receipt reprint, galat bill ka sudhaar. Done jab: 8 kaam bina madad ke.
5.5.3 CA ki review (S). Sample bills, export aur din ka hisaab CA ko dikhana. Done jab:
CA ne bill ka roop manzoor kiya.
5.5.4 Sudhar (M). Top 5 issues. Done jab: dobara test me wahi issues nahi.
Dental clinic software: ultra detail build plan
Page 45 of 150

Phase 5 ka gate
Pichhle mahine ki paper receipts nakli (shadow) series me daal kar software ka total
sister ke paper total se ₹ 0 ke fark par mila.
Ginti ki jaanch saaf aur jaan-boojh kar ki galti par alarm.
50 parallel bills par numbering me na duplicate na gap.
Din band karna chalta hai aur uske baad purani tareekh me entry rukti hai.
Refund, cancel aur discount-approval ka poora raasta test.
Receipt par registration number, raqam shabdon me aur reprint par DUPLICATE.
Purane baaki asli register se mile.
CA ne bill ka roop aur export manzoor kiya.
Phase 6: Dashboard, reports aur settings
Aapki maang: doctor ko roz aur mahine ke hisaab se dikhe ki kitne patients aaye, aur
growth ka poora chitra. Yahan wahi banta hai, par ek zaruri sharat ke saath: har number ki
ek likhi hui paribhasha ho ("aaye" ka matlab kya hai), warna dashboard sundar dikhega par
bharosa nahi hoga. Saath me sab kuch editable rakhne ka vaada: timings, holidays, lists,
templates, niyam, sab ek Settings page par, har setting ke saath ek line ki samjhaish, taaki
sister bina developer ke badal sake.
Number ki paribhasha (sister se sign karwao)
Number Matlab (kaise ginte hain) Kahan se
Aaye patients din me kam se kam ek appointment jo
arrived, in_chair ya completed hui, har
patient ek baar
appointments
Naye patients pehli baar aaye aur purane register
wale nahi ( legacy_ref  khaali)
patients.first_arrived_on
Wapas aane wale aaye minus naye hisaab se
No-show % no_show ÷ (aaye + no_show), walk-in
nahi ginte
appointments
Cancel % cancelled ÷ saari booking appointments
Billed issue hue bills ka total (cancelled
nahi), bill ki tareekh se
bills
Dental clinic software: ultra detail build plan
Page 46 of 150

6.1 Paribhasha tay karna
6.2 Data ki taiyari
Number Matlab (kaise ginte hain) Kahan se
Collected payments minus refunds, payment ke
din se
payments
Baaki bills ka total minus mile hue, aaj tak bills, allocations
Intezaar ka samay started_at  minus arrived_at  ka
median
appointments
Adhoora ilaaj manzoor hua par 30 din se koi sitting
nahi (din editable)
plan items
Recall due aakhri visit 6 se 9 mahine pehle
(editable)
visits
Treatment
acceptance
manzoor hue items ÷ patient ko
bataye gaye items
plan items
6.1.1 Doctor ke saath 45 minute (S). Upar ki table padho, har ek par "haan, yehi
chahiye", aur chunao: dashboard par sabse pehle kaun se 4 number (meri salaah: aaj ke
aaye, is mahine ke naye, is mahine collected, baaki). Done jab: sister ne table par haan
likha aur 4 top numbers chune.
6.2.1 Pehli baar aane ki tareekh (S). patients.first_arrived_on : pehli baar status
arrived hone par usi batch me set (2.3.6 ke badlav me jodo), purane data ke liye ek baar
backfill. Isse "naya patient" ginne ke liye poori table nahi padhni padti. Done jab: 3 nakli
patients par sahi tareekh, aur import wale patient "naya" nahi ginte.
6.2.2 daily_stats  (L). daily_stats(date_local, metric, dim, value) , jaise
(2026-11-25, arrived_patients , '', 14), ( collected_paise , 'cash', ...), ( appt_status ,
'no_show', 1), ( procedure_count , 'RCT', 2). Har metric ek SQL aggregate (JavaScript
ke loop se nahi, Worker ka CPU kam). Dobara ginna safe ( INSERT OR REPLACE ):
counters badha kar nahi, kyunki wo bigad jaate hain. Mahine ke hisaab ke liye
monthly_stats . Done jab: ek mahine ke nakli data par har metric ka number haath ki
ginti se mila.
Dental clinic software: ultra detail build plan
Page 47 of 150

6.3 Dashboard screens
6.2.3 Dobara ginne ka samay (M). Raat ko ek cron branch (Phase 1 ka ek hi cron):
pichhle 3 din dobara gino. Aaj ke numbers live (chhoti range), baaki daily_stats se.
Doctor ke liye "abhi dobara gino" button (rate-limited). Done jab: kisi purane din ka
data badal kar ginti apne aap theek ho jaati hai.
6.2.4 Din ke data ki safai (M). Din band karte waqt (5.3.9) list: beete samay ki
appointments jo abhi scheduled hain ya arrived par poori nahi hui. Har ek ko
completed, no-show ya cancelled karna padega. Isi se dashboard ke numbers par
bharosa banta hai. Done jab: 3 adhoori appointments ke saath din band nahi hota.
6.2.5 Numbers ke tests (M). Ek tay kiya hua nakli dataset aur haath se nikale hue sahi
numbers: time-zone ka kinara (23:30 IST), legacy patient naya nahi, walk-in no-show
me nahi, refund collected se ghatta hai, cancelled bill billed me nahi. Done jab: CI me,
aur ek number galat karne par test fail.
6.3.1 Dashboard API (M). /api/dashboard?range=...  sirf taiyar arrays deta hai,
Cache-Control: private, max-age=60 . Ek khulne par lagbhag 1,500 rows se kam
padhe (31 din × ~40 metrics), roz 20 baar khule to ~30,000 rows, free limit ka 0.6%
(meri ganit). Done jab: rows-read ka test 2,000 se kam.
6.3.2 Chart components (L). Apne chhote SVG components: bar, stacked bar, line,
heatmap, KPI tile, sparkline (bhaari chart library nahi, 300 KB ke budget me, dashboard
route alag se load). Design tokens (1.4.1) ke rang. Har chart ke saath "table dikhao"
toggle, keyboard se tooltip, rang ke saath text ya pattern, seedha label (legend ki khoj
nahi). Pie chart nahi. Done jab: har chart bina mouse ke padha ja sakta hai.
6.3.3 Doctor ka dashboard (L). Upar 4 tiles (sister ke chune hue, pichhli avadhi se
tulna ke saath). Phir: roz ke patients (30 din, hafte ke din ke saath), mahine-wise naye
aur wapas aane wale (12 mahine, stacked), billed aur collected (mahine-wise),
appointment ka haal (aaye, no-show, cancel), top 8 procedures (ginti aur raqam), top 6
referral sources. Neeche "Dhyan dene wali baatein": 60 din se purana baaki, adhoora
ilaaj, recall due, adhoore visit (3.5.8), storage 70% (3.7.6), aakhri backup ka haal. Done
jab: sister ko pehli nazar me pata chal jaata hai ki mahina kaisa gaya.
6.3.4 Avadhi ke control (S). Aaj, 7 din, is mahine, pichla mahina, 12 mahine, apni
tareekhein, aur "pichli avadhi se tulna". Done jab: har control par sahi tareekhein.
6.3.5 Growth ko sahi dikhana (S). Chhote aankdon par % gumrah karta hai (100 me 10
ka fark 10% hai par shor ho sakta hai). Isliye % ke saath hamesha asli ginti, 3 mahine ka
chalta ausat, aur jahan ek avadhi me 20 se kam ghatnayein hon wahan "kam data". 12
Dental clinic software: ultra detail build plan
Page 48 of 150

6.4 Reports
6.5 Settings hub
mahine baad pichhle saal ke usi mahine se tulna. Done jab: 8 se 12 jaise chhote badlav
par % ke bajaye "kam data" dikhta hai.
6.3.6 Kab bheed hoti hai (M). Hafte ke din × ghante ka heatmap (aaye hue patients),
taaki timings tay karne me madad mile. Done jab: nakli data me sabse vyast ghanta
alag dikhta hai.
6.3.7 Adhoora ilaaj aur recall (M). Do call-lists: (a) manzoor hue plan items jin par 30
din se sitting nahi (kul raqam ke saath, yeh aksar sabse kaam ki list hai), (b) 6 se 9
mahine se nahi aaye (recall). Patient par click, "sampark kiya" ka note, Phase 7 ke yaad
dilane se judne ka hook. Done jab: ek nakli patient dono list me sahi aata hai aur
sampark ke baad list se hat jaata hai.
6.3.8 Receptionist ka "aaj ka summary" (S). Sirf aaj ke aaye, baaki, collected. Poora
dashboard nahi (1.3.4 ki matrix). Done jab: receptionist ke login me dashboard URL 403.
6.3.9 Intezaar aur kursi ka istemal (M, baad me). Intezaar ka median aur kursi kitne
samay bhari rahi. Yeh tabhi sahi hoga jab statuses ka click aadat ban jaye, isliye pilot ke
baad. Done jab: 2 hafte ka data sahi dikhta hai.
6.3.10 Umar aur gender ka batwara (S, baad me). Sirf jod ke aankde. Done jab: chart
par.
6.4.1 Monthly report print (M). A4 ka ek page: aaye, naye, wapas, appointments ka
haal, procedures, billed, collected, baaki, top referral sources, pichhle mahine se tulna.
Phase 4 ke print engine par. Done jab: sister ne ek nakli mahine ki report manzoor ki.
6.4.2 Apni avadhi ki table aur CSV (S). daily_stats se, kisi bhi tareekh se tareekh tak,
CSV (sirf jod ke aankde, patient ka naam nahi). Done jab: ek mahine ka CSV Excel me
khulta hai.
6.4.3 Mahine ka email doctor ko (M, baad me). Mahine ki 1 tareekh ko Brevo se jod ke
aankde (patient ka naam ya detail nahi). Done jab: test email aata hai.
6.4.4 Saal-dar-saal (S, baad me). 12 mahine ke baad. Done jab: chart par.
6.5.1 Settings ka ek ghar (M). Ek page jisme sab editable cheezein, groups me: clinic
ki jaankari (1.5.2), timings aur holidays (1.5.3), visit types (2.3.2), lists (diagnosis,
procedures aur daam, conditions, dawai, allergens, quick phrases, referral sources,
Dental clinic software: ultra detail build plan
Page 49 of 150

6.6 Test aur sign-off
Mat karo (Phase 6)
Bina paribhasha ka koi number mat dikhao.
Counters badha kar stats mat rakho, hamesha dobara gino.
Poori table padhne wala dashboard mat banao (rows-read).
Bhaari chart library mat jodo.
Pie chart ya 3D chart mat banao.
Chhote aankdon par akela % mat dikhao.
discount aur cancel ke karan), templates (parcha, sahmati, notice), messages (Phase
7), users (1.3.6), number series (sirf dekhna), backup ka haal, preferences. Upar
search. Done jab: koi bhi setting teen click ke andar mil jaati hai.
6.5.2 Badlav ka itihaas aur wapas (M). Har setting ke versions (1.5.1) dikhao: kisne,
kab, purani value, "is version par wapas jao" (nayi version banti hai, purani nahi mitati,
audit). Done jab: galat timing badal kar ek click me wapas.
6.5.3 Jadui numbers ki safai (M). Code me jo bhi number chhipa hai (90 din aage
booking, 15 minute ka no-show, 60 second refresh, 6 mahine ka history review, 7 GB
alert, 72 ghante ki maang) settings me default, kam se kam aur zyada se zyada ke
saath. README me list. Done jab: ek test code me ginti ke aise numbers dhoondhta
hai aur fail hota hai agar koi settings se bahar hai (jaise grep  ki suchi).
6.5.4 Holidays (S). Jodna, har saal doharana, band din. Naye saal ke national holidays ki
suchi pehle se (sister badle). Done jab: holiday par calendar me booking nahi.
6.5.5 Preferences (S). Notation (FDI, Universal, Palmer), default views, print ki [note: language preference removed, UI is English only, see docs/DECISIONS.md]
shuruaat. Done jab: badalne par turant lagu.
6.5.6 Har setting ki samjhaish (S). Har setting ke saamne ek line English me: "yeh kya [note: Hinglish changed to English, UI is English only, see docs/DECISIONS.md]
karti hai, ek udaharan, badalne par kya hoga". Sister bina poochhe badal sake. Done
jab: ek bhi setting bina samjhaish ke nahi.
6.6.1 Speed (S). Dashboard kholne ka rows-read budget (2,000) aur clinic PC par pehla
load. Done jab: report CI me.
6.6.2 Doctor ka sign-off (M). Nakli data ke saath layout, rang, paribhasha aur "dhyan
dene wali baatein". Asli data se milan (7 din ka paper register ginti vs dashboard)
Phase 10 me. Done jab: sister ne screens manzoor kiye.
6.6.3 Sudhar (M). Top 5 issues. Done jab: dobara dekhne par wahi issues nahi.
6.7 Unified Patient History polish (docs/PATIENT_HISTORY.md Stage 4)
6.7.1 History filters polish (M). Chips All/Visits/Treatments/Prescriptions/Bills/Files/
Appointments; date range; tooth filter (e.g. 36); search procedure/diagnosis text.
Filters kabhi pinned summary nahi chhupate. Done jab: har filter ka test; 10y patient
tez.
6.7.2 Print history summary (M). Doctor only: A4 English — patient details, allergies,
visits aur treatments table. Receptionist raw export nahi. Done jab: print preview;
role 403 receptionist.
6.7.3 Add past record (M). Doctor only: date, text, optional scan; label "Added later"
for old paper history. Done jab: entry History me; audit; receptionist create 403.
Dental clinic software: ultra detail build plan
Page 50 of 150

Dashboard me patient ka naam ya detail mat do, sirf jod. Lists (baaki, recall) sirf doctor
ko.
Statuses ke click ke bharose wale metrics (intezaar, kursi) pilot se pehle sahi mat
maano.
Koi bhi setting code me chhupi mat rakho.
Receptionist ko poora revenue mat dikhao.
Phase 6 ka gate
Nakli dataset par har number haath ki ginti se milta hai (tests me).
Dashboard ek baar kholne par 2,000 se kam rows padhta hai.
3 adhoori appointments ke saath din band nahi hota.
Sister ne paribhasha, layout aur 4 top numbers manzoor kiye.
Har chart table ke roop me aur keyboard se padha ja sakta hai.
Holiday, timing ya list badalne par ek click me purani value par wapas ja sakte ho.
Receptionist ke login se dashboard aur reports 403, sirf aaj ka summary milta hai.
Adhoora ilaaj aur recall ki list nakli data me sahi.
Phase 7: Reminders aur messaging (SMS, WhatsApp, email)
Yahan patient ko SMS ya WhatsApp se yaad dilane ka poora system banta hai:
appointment confirm, ek din pehle reminder, badlav ya radd hone ki soochna, aur portal ka
OTP. Maksad no-show kam karna aur receptionist ka call karne ka kaam bachana hai. Teen
rules poore phase par lagte hain: (1) message me sirf pehla naam, clinic ka naam, tareekh-
samay aur clinic ka number, ilaaj, dawai, rashi kuch nahi; (2) sirf unhe jinhone anumati di;
(3) koi discount ya offer wala message nahi, kyunki DCI code me inducement aur rebate
(8.1.3) aur apni badai (8.2) mana hai.
Message ka safar: booking, planner, message_outbox  (queued), dispatcher (har 5
minute), adapter, gateway ka cloud server, clinic ke purane phone ki SIM, patient. Wapsi ka
raasta: phone se webhook aata hai aur status badalta hai. Sab kuch ek outbox se guzarta
hai (Phase 1 ke events  table se alag), isliye raasta badalna (SMS se DLT, ya WhatsApp
hath se) sirf ek adapter badalna hai.
Dental clinic software: ultra detail build plan
Page 51 of 150

Chaar raaste
Pakka kya hai aur anuman kya hai
Pakka (padha hua, link ke saath):
TRAI ke Third Amendment 2026 ke press release (18 Sep 2026) ke hisaab se operators
AI aur ML se spam bhejne wale numbers pehchante hain. Ek hi sender ke 5 ya zyada
numbers 10 din me flag hon, ya 3 alag shikayatein 10 din me AI flag ke saath aayein, to
kadi karwai: KYC dobara, bhautik jaanch, outgoing services band, baar-baar par
disconnect. Hamari ek hi SIM hogi, isliye 5-numbers wala threshold seedha nahi lagta
par shikayat wala lag sakta hai (meri samajh).
Raasta Kaise chalta hai Kharcha Dhyan dene wali
baat
Hamara
istemal
SMS, clinic ke
purane Android
phone se
(android-sms-
gateway, cloud
mode)
Worker se
gateway ke
cloud par,
wahan se
phone ki SIM se
SMS
SIM ke recharge
pack ke SMS
(aapne roz ~100
free bataye,
maine check
nahi kiya)
TRAI ke naye
niyam spam par
kade hain
(neeche). Cloud
server ek free
community
sewa hai, koi
SLA nahi
Reminder
aur OTP
(Plan A)
WhatsApp, hath
se (wa.me link)
Receptionist
laptop par link
kholti hai, text
bhara milta hai,
Send khud
dabati hai
₹ 0 WhatsApp ki
shartein bulk aur
automatic
messaging mana
karti hain
Fallback aur
personal
follow-up
DLT wala paid
SMS (Fast2SMS,
MSG91 jaise
provider)
Worker se
provider ki API
Vendor blogs me
registration ₹ 0
se ₹ 5,900 aur
SMS ₹ 0.10 se
₹ 0.18, aapas me
match nahi karte
Sabse safe
raasta
Plan B
Email (Brevo) Worker se
Brevo API
Free plan Kam patient
email dekhte
hain (meri soch)
Sirf doctor
aur staff ke
liye, baad me
Dental clinic software: ultra detail build plan
Page 52 of 150

Saza kitni: Moneylife ke hisaab se AI se pakde sender ke saare telecom resources par
pehli baar 15 din outgoing band, baar-baar par ek saal ka disconnect. 2025 ke
amendment ke liye FoneArena me yahi likha hai. Press release me pehli aur baad ki
saza alag nahi likhi, isliye ye news report par tikta hai.
TRAI ke 2024 consultation paper me 'usage cap' 20 call aur 20 message roz ka hai, jo
shak wale unregistered telemarketer par jaanch ke dauran lagta hai. Ye sab SIM par
lagne wali seema nahi hai.
Purane 100 aur 200 SMS roz per SIM ke niyam 2011-12 ki khabron me hain (Moneylife).
Aaj lagu hain ya nahi, maine confirm nahi kiya.
Gateway ke docs: webhooks HMAC-SHA256 se signed hain, 14 baar tak (~2 din) retry
hote hain, events me system:ping  aur app:started  bhi hain. Encryption me device-
paired E2E (RSA-OAEP aur AES-GCM) aur purana passphrase mode (PBKDF2-SHA1,
default 75,000 iterations) hai. E2E ke bina cloud server text aur numbers dekh sakta
hai. Author ke lekh ke hisaab se phone ke ack ke 15 minute baad message data hash ho
jata hai.
WhatsApp: click-to-chat ka format official FAQ me hai. Terms of Service bulk aur auto
messaging mana karti hain, aur bina authorization ke non-personal use bhi, aur
account band kar sakti hain.
Anuman (spike me ya vakeel se jaanchna hai):
Roz ke message (normal ~25, seema 60), saal ke SMS (~7,200), DLT ka asli kharcha.
Kya clinic ke appointment reminder TRAI ke hisaab se 'commercial communication'
maane jayenge aur normal SIM se bhejna theek hai ya DLT zaruri hai. Ye grey area hai,
operator ya telecom vakeel se poochna hai (7.1.4).
Gateway ke chhote sawal: duplicate id , ttl , ping ka interval, reboot ke baad auto-
start (7.1.2). Cloud server ki shartein aur data ka sthan.
WhatsApp Business app ki shartein (maine padhi nahi) Brevo free plan ki seema baad
me check ho gayi: 300 emails per din ('Accounts, vendors aur kharcha' section me).
7.1 Faisle aur spikes
Pehle sister ke saath message ki list tay hogi. Table meri soch hai, sister badlegi.
Dental clinic software: ultra detail build plan
Page 53 of 150

Message Kab Raasta Shuru
me
Kab tak valid
OTP (portal
login)
patient maange tab,
turant
SMS ON 5 minute
Appointment
confirm
booking ke turant
baad (raat 9 baje ke
baad ho to subah 8
baje)
SMS ON appointment shuru
hone tak
Badlav ya radd badlav ke turant baad SMS ON appointment shuru
hone tak
Reminder ek din pehle shaam 5
baje
SMS, fail ho to
WhatsApp
ON appointment se 2
ghante pehle tak
Same-day
reminder
3 ghante pehle SMS OFF 1 ghanta pehle tak
Recall (6 se 9
mahine)
doctor ke chune
patients, roz 5 se
zyada nahi
WhatsApp
hath se
OFF 7 din
Adhoora ilaaj
follow-up
doctor ke chune, roz 5
se zyada nahi
WhatsApp
hath se
OFF 7 din
Baaki rashi kabhi automatic nahi WhatsApp
hath se
OFF koi nahi
Aftercare,
birthday
baad me WhatsApp
hath se
OFF koi nahi
Doctor ko
mahine ki report
mahine ki 1 tareekh Email baad
me
koi nahi
7.1.1 Message ki list sister ke saath tay karna (S). Upar ki table print karo, sister har
line par haan ya na likhe, aur reminder ka samay (meri salaah: ek din pehle shaam 5
baje) aur bhasha (English ya Hinglish) chune. Done jab: sister ne table par 'ok' likha.
7.1.2 Gateway spike (M). Purane Android phone par app install karo (docs ke hisaab se
Android 5.0 ya upar chahiye, install link GitHub releases par), cloud mode on karo, curl
se ek SMS bhejo. Phir ye 9 sawal test karke likho: (1) states Pending se Delivered tak
kitni der me jaate hain, (2) phone airplane mode me ho to message kab tak Pending
Dental clinic software: ultra detail build plan
Page 54 of 150

rehta hai aur ttl  dene par kya hota hai, (3) same id  dobara bhejne par duplicate
rukta hai ya dobara jata hai, (4) system:ping  ka interval kitna rakh sakte hain aur
battery par asar, (5) reboot ke baad app apne aap chalu hota hai ya nahi aur
app:started  aata hai ya nahi, (6) do SIM ho to simNumber  se chunna, (7) JWT ya
Basic auth (docs Basic ko legacy bolte hain, JWT ka token banana aur expire hona
aasan hai ya nahi), (8) 160 se lamba message partsCount  kitna deta hai, (9) sms-
gate.app ke cloud server ki shartein (free kab tak, uptime ki guarantee, data kahan
rehta hai) padhkar likho. Done jab: ek page ki report jisme har sawal ka jawab likha ho,
aur docs se alag nikli cheezein decision register me.
7.1.3 Encryption spike (M). E2E ke bina gateway ka cloud server patients ke numbers
aur text dekh sakta hai, aur DPDP me third-party ke saath data share karna jawabdehi
hai. Docs ke hisaab se device-paired E2E me server content aur recipients nahi dekh
sakta, par wo RSA-OAEP me digest SHA-256 aur MGF1 SHA-1 maangta hai, jabki
WebCrypto dono ke liye ek hi hash rakhta hai (meri jaankari, docs ki chetavni isi baat ki
hai). Teen raaste aazmao: (a) apna chhota OAEP padding code (BigInt se 2048-bit
modular exponent, SHA-1 aur SHA-256 ke liye WebCrypto digest), jiski sahi hone ki asli
jaanch device par SMS ka sahi aana hai, (b) legacy passphrase mode, jisme chabi
PBKDF2-SHA1 se banti hai (default 75,000 iterations), jo har message par Worker me
10 ms CPU limit se bhaari ho sakta hai, isliye chabi ek baar laptop par nikaal kar secret
me rakho aur fixed salt aur iterations se bhejo (agar device ye accept kare), (c) E2E
band, aur text sirf ek-line ka. Har raste ka CPU time Cloudflare dashboard me dekho.
Done jab: teeno ke number likhe, ek chuna gaya, chuna hua raasta 10 ms ke andar
chalta hai (ya (c) chunne ka kaaran likha hai).
7.1.4 SIM aur TRAI jokhim ka faisla (S). Ek page me tay karo: (1) SMS ke liye alag SIM,
clinic ka mukhya number nahi, kyunki news report ke hisaab se saza sender ke saare
telecom resources par aa sakti hai, (2) SIM kis ke naam par ho, jiske baaki zaroori
numbers (doctor ka personal, clinic ka mukhya) usi naam par na hon, ya clinic ke naam
par business connection (kaun 'sender' maana jayega ye operator se pakka karo), (3)
message sirf service wale, koi offer ya link nahi, (4) roz ki seema aur dheere dheere
bhejna, (5) galat number par message na jaye (7.7.2), (6) warning ya shikayat aate hi
SMS band karke Plan B. Operator ke customer care ya kisi telecom vakeel se ek sawal
poochna: clinic ka apne patients ko appointment reminder normal SIM se bhejna theek
hai ya DLT zaruri hai. Done jab: faisle ka page hai aur operator ya vakeel ka jawab (ya
'abhi pata nahi') likha hai.
7.1.5 Plan B ki shart aur kharcha (S). Likho DLT par kab jaana hai: (a) SIM par warning
ya band, (b) phone aksar offline aur receptionist thak gayi, (c) budget badhe. Kharcha
meri ganit se: 300 visits per mahina, har visit par 2 message, yani 600 per mahina,
Dental clinic software: ultra detail build plan
Page 55 of 150

7.2 Engine: outbox, adapters, dispatcher
Status ki table, jo poore phase me chalti hai:
7,200 per saal, ₹ 0.10 se ₹ 0.18 prati SMS par ₹ 720 se ₹ 1,296 per saal, upar se entity
registration (vendor blogs me ₹ 0 se ₹ 5,900, smsgatewayhub aur Fast2SMS ke aankde
alag hain). Yani ₹ 1,000 per saal se upar ja sakta hai, isliye abhi Plan A. Operator ke DLT
portal par asli fees dekho par registration mat karo. Done jab: ek page 'kab badlenge,
kitna lagega, kaun sa provider' aur decision register me entry.
Status Matlab Aage kahan
queued bhejne ka samay aane tak intezaar sending ya cancelled
held ruka hua (quiet hours, cap, phone down) queued ya WhatsApp task
sending dispatcher ne claim kiya sent, failed, ya 10 minute baad
unknown
sent phone ne SMS bheja delivered ya failed
delivered operator ne pahunchne ki report di (har
baar nahi aati, meri jaankari)
koi nahi
failed permanent error ya koshishein khatam WhatsApp task
expired bhejne ka samay nikal gaya WhatsApp task (agar zaruri)
cancelled appointment badli, radd hui ya anumati
hati
koi nahi
skipped niyam ne roka (anumati nahi, galat
number, flag), wajah ke saath
koi nahi
unknown pata nahi gaya ya nahi, kabhi automatic
dobara nahi
receptionist check karti hai
needs_human WhatsApp: receptionist ko bhejna hai done_manual
done_manual receptionist ne 'bhej diya' dabaya koi nahi
dry_run test mode: banaya par bheja nahi koi nahi
Dental clinic software: ultra detail build plan
Page 56 of 150

Audit ka niyam: insaani kaam (anumati badalna, dobara bhejna, radd, kill switch, template
badalna) audit_log  me jate hain. System ke apne status badlav outbox aur attempts me
hi rehte hain, audit_log  me nahi, warna wo bhar jayega (Phase 3 ke draft autosave jaisa
apvad).
7.2.1 Tables aur indexes (M). message_outbox(id, patient_id, appointment_id,
kind, channel, template_key, lang, params_json, body, segments, status,
priority, dedupe_key UNIQUE, group_key, fallback_of, send_after,
expire_at, claimed_at, attempts, provider_id, last_error_code, created_at,
updated_at, created_by) . message_attempts(id, outbox_id, attempt_no, at,
adapter, result, http_status, error_code)  bina message ke text ke.
webhook_receipts(event_id PRIMARY KEY, received_at) . channel_state(channel
PRIMARY KEY, last_ping_at, last_ok_at, consecutive_failures, state, note) .
message_inbox(id, patient_id, received_at, text, handled_at)  (7.3.5 ke liye).
phone_flags(phone, flag, source, created_at)  jisme flag opted_out,
wrong_number, no_whatsapp, landline me se ek. Indexes: (status, send_after) ,
(appointment_id) , (patient_id, created_at) , (provider_id) . Poora mobile
number outbox me nahi, send ke samay patient ka current number lagta hai, screen
aur log me hamesha masked. Retention: outbox 1 saal, attempts aur webhook_receipts
90 din. Done jab: migration chalta hai, duplicate dedupe_key  insert fail hota hai, aur
EXPLAIN dikhata hai ki 'queued aur due' query index use karti hai.
7.2.2 Channel interface aur adapters (L). Interface MessageChannel : send(msg)  jo
{ok, providerId, retryable, errorCode}  lautata hai, getState(providerId) ,
health() . Teen adapters: FakeAdapter  (tests aur dry-run), SmsGatewayAdapter
(cloud API, 5 second timeout, outbox ka id  gateway ke id  me agar 7.1.2 me duplicate
rukta dikha, ttl  barabar expire_at  minus abhi, deviceId  hamesha set, E2E 7.1.3 ke
faisle ke hisaab se), ManualWhatsAppAdapter  (bhejta nahi, status needs_human ).
Errors do tarah ke: retryable (timeout, 5xx, 429) aur permanent (400, galat phone,
401). Adapter ke bahar koi code gateway ke field ke naam nahi jaanta. Done jab: ek
contract-test suite teeno adapters par ek jaisi chalti hai, aur SmsGatewayAdapter ka
ek asli SMS test number par pahunchta hai.
7.2.3 Template renderer, segment counter, content lint (M). Template me sirf allowed
variables: naam  (pehla naam), clinic , din , tareekh , samay , fone , otp . Galat
variable par error, chup-chaap khali nahi. Segment counter: English-jaise akshar
(GSM-7) me 160, Unicode (Devanagari, emoji, ₹ , curly quotes) me 70 (Fast2SMS ki
pricing page ke hisaab se), lambe message multi-part me kam. Editor me live dikhao.
Lint sirf warning deta hai, rokta nahi: ilaaj ya paise ke shabd (RCT, extraction, ₹ , baaki,
Dental clinic software: ultra detail build plan
Page 57 of 150

balance), offer ke shabd (discount, offer, free, % off), URL, aur 'best' jaise daave. Bheja
gaya text outbox me snapshot ban jata hai (baad me template badle to bhi pata rahe
kya gaya), par OTP wala text kabhi store nahi hota. Done jab: 30 sample inputs ke unit
tests (Hindi naam, bahut lamba naam, 160 ki seema).
7.2.4 Planner (L). Ek pure function plan(appointments, settings, consents,
flags, now)  jo batata hai ki kaun se messages hone chahiye (har ek dedupe_key ke
saath). Enqueuer us list ko outbox se milata hai: jo nahi hai wo queued  banata hai, jo ab
nahi chahiye (appointment radd ya badli, anumati hati) wo cancelled  karta hai. Har
cron tick par agle ~36 ghante ki appointments par chalta hai (self-healing, koi event
kho jaye to bhi theek), aur booking ya badlav par us ek appointment ke liye turant.
Keys: confirm:APPT:START , remind:APPT:START:N , resched:APPT:START ,
cancel:APPT . Niyam: anumati aur theek mobile ke bina skipped  (wajah ke saath),
quiet hours me banne wala message agle 08:00 par, appointment 2 ghante se kam
door ho to reminder nahi, badlav par purane pending radd. Tareekhein IST me
( date_local  aur start_min ), send_after  UTC me. Done jab: neeche 7.9.1 ke saare
tests pass.
7.2.5 Dispatcher (L). Phase 1 ke ek cron me ek branch, har 5 minute, kaam ke ghanton
(08:00 se 21:00) ke bahar turant return. Kadam: (1) channel health dekho, (2) planner
chalao, (3) UPDATE ... SET status='sending' ... RETURNING  se ek tick me sirf
dispatch_per_tick  (default 5) due messages claim karo (D1 par is syntax ko test
karo), (4) har ek adapter se bhejo, (5) natija ek batch me likho, (6) housekeeping
(7.2.6). Subrequest guard: ek tick me 30 se zyada nahi (free limit 50). 5 message per 5
minute ka matlab 30 reminders ~30 minute me, jo dheere bhejne ki zaruri aadat bhi hai
(meri soch: bulk jaisa pattern kam dikhta hai). Rows padhna ~200 per tick, roz ~58,000,
free limit ka ~1% (meri ganit). Done jab: 40 nakli reminders FakeAdapter se ~35
minute me nikalte hain, aur cron do baar ek saath chal jaye to koi message do baar nahi
jata.
7.2.6 Retries, unknown, expiry aur fallback (M). Retryable error par 5, 15, 45 minute
baad dobara (3 koshish, expire_at  ke baad nahi). Message sending  me 10 minute se
zyada atka ho to unknown , aur kabhi automatic dobara nahi bhejna (duplicate ya galat
OTP ka darr), receptionist ki list me 'check karo'. expire_at  guzar jaye to expired . SMS
permanent fail ho, expire hone wala ho, ya cap ya phone-down ki wajah se na ja paye to
automatically whatsapp_manual  ka naya row ( fallback_of ) banta hai, taaki
receptionist ek click me bhej de. Done jab: chaos test me har rasta (timeout, 500, beech
me crash) sahi status par pahunchta hai.
Dental clinic software: ultra detail build plan
Page 58 of 150

7.2.7 OTP ka seedha raasta (M). OTP cron ka intezar nahi karta: portal ka route outbox
row (priority 1, expire 5 minute, body khali) likhta hai aur ctx.waitUntil  me turant
bhejta hai, gateway ko ttl  300 second. Fail ho to auto-retry nahi, patient ko screen
par 'OTP nahi aaya to password se login karein ya clinic ko call karein'. OTP ka code
kahin store nahi, Phase 8 ke otp_requests  me sirf hash. Done jab: nakli adapter par
request se 'bheja' tak 2 second ke andar, aur OTP ka text kisi table ya log me nahi milta
(grep test).
7.2.8 Webhook receiver (M). POST /hooks/sms/TOKEN , token lamba random. Har
request par X-Signature  check: raw body ke baad X-Timestamp  jod kar HMAC-
SHA256, signing key secret me, constant-time compare ( crypto.subtle.verify ),
timestamp 5 minute ke andar (docs ki salah). Dedupe envelope id  par
( webhook_receipts , 3 din, kyunki gateway 14 baar tak ~2 din retry karta hai).
sms:sent , sms:delivered , sms:failed  se status sirf aage badhe, peeche nahi.
sms:received : sirf STOP jaise shabd aur 'galat number' dhundo (list settings me),
baaki text store nahi (7.3.5 ke alawa). system:ping  aur app:started  se
channel_state . Galat signature par 401, baaki par jaldi 2xx. Body ki seema 16 KB.
Done jab: galat signature, purana timestamp, repeat event aur out-of-order events ke
test pass.
7.2.9 Heartbeat, breaker, health (M). system:ping  aur har kamyab send se
last_ok_at . Kaam ke ghanton me 30 minute (setting) se zyada ping nahi aaye to
channel down : naye SMS held  hote hain, aur jinka expire_at  2 ghante se kam bacha
hai unke liye turant WhatsApp task. Lagatar 3 failures par breaker open (SMS pause,
alert), 30 minute baad ek test message ka mauka. Cron ke har run par Healthchecks.io
ko ping (Phase 9 isse monitoring se jodta hai). Ping ka interval 7.1.2 se. Done jab: phone
band karke test: 30 se 35 minute me dashboard par 'SMS phone offline', aur chalu
karne par apne aap theek.
7.2.10 Kill switch, dry-run, test allow-list (S). Settings me: sab messaging band,
channel-wise band, kind-wise band. MESSAGING_MODE : live  ya dry_run  (banao aur
log karo, bhejo nahi), aur staging ya dev me hamesha sirf allowed_test_numbers
(developer aur sister ka number) par, baaki par code hi mana kare. Done jab: staging se
kisi bhi aur number par bhejne ki koshish test me block hoti hai.
7.2.11 Daily cap, OTP reserve, per-number limit (S). sms_daily_cap  (default 60
segments, meri soch: normal din ~25), usme se 10 OTP ke liye reserve, taaki reminders
OTP ko na rok sakein aur koi bug ya abuse poora budget na jala de. Ek number par roz 3
se zyada nahi (OTP alag). Cap poora ho to baaki held , aur shaam ko WhatsApp tasks.
Done jab: test: ek din me 80 messages, 60 se zyada nahi jate, OTP phir bhi jata hai.
Dental clinic software: ultra detail build plan
Page 59 of 150

7.3 Receptionist ke screens
7.3.1 'Aaj ke messages' board (L). Chaar khaane: 'Jaane wale' (queued, held), 'Gaye
aaj' (sent, delivered), 'Dhyan do' (failed, unknown, expired, skipped, wajah ke saath),
'WhatsApp se bhejna hai'. Har row par patient, message, samay, status, aur ek click par
detail (bheja gaya text, koshishein, status ki timeline). Buttons: dobara bhejo (sirf
failed par, unknown par confirm ke saath), radd karo, WhatsApp me badlo. Permissions
1.3.4 ki matrix se. Done jab: sister bina samjhaye ek failed message ko WhatsApp me
badal kar bhej leti hai.
7.3.2 WhatsApp manual queue (M). waLink(mobile, text) : sirf ankon wala number
country code 91 ke saath (format https://wa.me/NUMBER?text=ENCODED , plus, zero,
bracket, dash nahi, official FAQ), text UTF-8 percent-encode. 'Kholo' naye tab me link
kholta hai ( noopener ), receptionist WhatsApp Web me Send dabati hai, wapas aakar
'Bhej diya' ya 'WhatsApp nahi hai' dabati hai (nahi hai to number par flag, agla raasta
SMS ya call). Ek ke baad ek 'agla' flow aur keyboard shortcut. Link sirf browser me
banta hai, hamari site ke URL me patient ka koi detail nahi. Done jab: Hindi naam wale
message ka link phone aur laptop dono par sahi chat kholta hai, aur 20 messages 5
minute ke andar nikalte hain (timing test).
7.3.3 Patient page par messages (M). Patient ke detail me 'Messages' tab: history,
anumati ki sthiti (SMS yaad dilane, marketing) aur 'is number par message na bhejo'
switch, number ke flags (galat number, WhatsApp nahi, landline). Anumati badalna
audit hota hai. Ek patient ko ek-baar ka message bhejna sirf template se, free text
nahi. Done jab: anumati hatane par us patient ke saare queued messages turant
cancelled  ho jate hain.
7.3.4 Appointment par 'ab bhejo' aur 'reminder band' (S). Calendar ke appointment
drawer me: confirmation ya reminder abhi bhejo (cap ke andar), is appointment ka
reminder band karo (wajah ke saath). Done jab: dono kaam ek click me aur audit me.
7.3.5 Aaye hue reply ki list (M, baad me). sms:received  se sirf pehchane hue patient
ka reply (300 akshar tak) message_inbox  me, 30 din baad apne aap delete, 'padh liya'
button. Anjaan number ka kuch store nahi. Done jab: 30 din ke purge ka test.
7.3.6 Poore din ki appointments radd karna (M). Doctor bimar ho ya chhutti ho to ek
wizard: din ya samay chuno, list aur message ka preview dekho, confirm karo, aur
messages cap ke andar chhote tick me jaate hain. Jinki anumati nahi unki alag 'call
karo' list. Done jab: nakli 15 appointments par saare patients ko ya to message gaya ya
call-list me aaye, koi chhoota nahi.
Dental clinic software: ultra detail build plan
Page 60 of 150

7.4 Templates aur settings
Template English (default) Hinglish
Confirm Dear {naam} , your appointment at
{clinic}  is booked for {din}
{tareekh} , {samay} . To change it,
call {fone} .
Namaste {naam} , {clinic}  me aapki
appointment {din}  {tareekh}  ko
{samay}  baje tay hui hai. Badlav ke
liye call karein {fone} .
Reminder Dear {naam} , a reminder of your
appointment at {clinic}  tomorrow
at {samay} . To change it, call {fone} .
Namaste {naam} , yaad dilana: kal
{samay}  baje {clinic}  me aapki
appointment hai. Badlav ke liye call
karein {fone} .
Badlav Dear {naam} , your appointment at
{clinic}  is now on {din}
{tareekh} , {samay} . Questions?
Call {fone} .
Namaste {naam} , {clinic}  me aapki
appointment ab {din}  {tareekh}  ko
{samay}  baje hai. Sawal ho to call
karein {fone} .
Radd Dear {naam} , your appointment at
{clinic}  on {din}  {tareekh} ,
{samay}  is cancelled. To rebook, call
{fone} .
Namaste {naam} , {clinic}  me
{din}  {tareekh}  {samay}  baje ki
aapki appointment radd kar di gayi hai.
Nayi appointment ke liye call karein
{fone} .
Recall Dear {naam} , this is {clinic} . It is
time for your next visit. To book, call
{fone} .
Namaste {naam} , {clinic}  se. Aapki
agli visit ka samay ho gaya hai.
Appointment ke liye call karein
{fone} .
OTP {otp}  is your {clinic}  login code. It
expires in 5 minutes. Do not share it.
{otp}  aapka {clinic}  login code
hai. 5 minute me use karein. Kisi ko na
batayein.
7.4.1 Default templates seed (S). Upar ki table ke templates seed karo (English aur
Hinglish), har ek 160 akshar (GSM-7) ke andar, bina link ke. Done jab: segment counter
har template ko 1 segment dikhata hai (naam 20 akshar ka ho tab bhi).
7.4.2 Template editor (M). Settings me har template ka text badalna, live preview nakli
data se, segment counter, lint ke warning (7.2.3), 'default par wapas', versions Phase 6
ke 6.5.2 se. Variables ki list click karke daalna. Done jab: doctor ne ek template badla,
preview dekha, save kiya, aur ek click me purane par wapas aaye.
Dental clinic software: ultra detail build plan
Page 61 of 150

7.5 Recall aur follow-up
7.6 Email
7.4.3 Messaging ki settings (S). Reminder kitne ghante pehle (default ek din pehle
17:00), same-day reminder (band), quiet hours (21:00 se 08:00), roz ki seema (60), tick
me messages (5), kam se kam lead (2 ghante), STOP ke shabd, har kind ka switch. Har
setting ke saath ek line ki samjhaish (6.5.6). Done jab: har setting kam se kam aur
zyada se zyada ke saath, aur ek test setting badal kar planner ka output badalta
dekhta hai.
7.4.4 Bhasha (S). Clinic ki default (English ya Hinglish) aur patient par optional
override. Devanagari wale template tabhi jab doctor chune, aur editor 'ye 3 SMS
ginega' dikhaye. Done jab: ek patient ko Hinglish aur dusre ko English message jata
hai.
7.5.1 Recall batches (M). Phase 6 ki recall list se doctor ya receptionist 'message banao'
dabate hain: roz zyada se zyada 5 (setting) patients ke liye recall queue hota hai, sirf
anumati wale, default WhatsApp hath se (SMS bhi chun sakte hain). 'Sampark kiya' ka
note apne aap. Jawab me 'galat number' ya 'badal gaye' aaye to number par flag. Done
jab: ek nakli list ke 12 patients pehle din 5, agle din 5, phir 2 queue hote hain.
7.5.2 Adhoora ilaaj follow-up (S). Phase 6 ki 'adhoora ilaaj' list se isi tarah, par text me
ilaaj ka naam kabhi nahi, sirf 'agli visit ka samay ho gaya hai'. Done jab: lint ilaaj ka koi
shabd nahi pakadta.
7.5.3 Baaki rashi: sirf hath se (S). Phase 5 ki dues list se 'WhatsApp yaad dilao' ek
template, raqam ke bina (ya raqam ke saath, doctor ki setting), kabhi automatic SMS
nahi. Done jab: dues list se ek click me link khulta hai aur SMS ka option nahi dikhta.
7.5.4 Aftercare WhatsApp templates (M, baad me). Doctor ke likhe, ilaaj-wise
templates (jaise nikalne ke baad kya dhyan rakhein), hath se bhejna. System khud
dawa ya salah nahi banata (Won't-do list). Done jab: doctor ne 3 templates likhe aur ek
visit se ek click me khulte hain.
7.5.5 Birthday wish (S, baad me). Janmdin par wish, sirf marketing anumati wale ko,
WhatsApp hath se, koi offer nahi. Done jab: anumati ke bina patient list me nahi aate.
7.6.1 Brevo email (M, baad me). EmailAdapter  (Brevo API, free plan, roz ki seema
account me dekhna), pehla istemal doctor ko mahine ki report (6.4.3). Patients ko
email nahi. Domain par SPF aur DKIM lagao (Phase 8 ke domain faisle ke baad). Done
jab: test email aata hai aur spam me nahi jata.
Dental clinic software: ultra detail build plan
Page 62 of 150

7.7 Anumati aur number ki safai
7.8 Monitoring aur runbook
7.7.1 Consent capture aur withdrawal (M). Registration par (aur patient page par)
'appointment ki yaad dilane ke liye SMS ya WhatsApp' ka checkbox, pehle se tick nahi
(DPDP me 'clear affirmative action' chahiye, meri samajh, vakeel se confirm), shabd ka
version, kisne liya, kab, kis raaste se. Wapas lena: STOP reply ya receptionist ka switch,
dono turant lagu. Anumati ka ek printable saboot. Done jab: anumati ke bina kisi
patient ko koi message queue nahi hota.
7.7.2 Number hygiene (M). Ek hi function normalizeIndianMobile()  (10 ank, 6 se 9
se shuru, +91  ke saath save, rule ek jagah taaki badle to ek hi jagah badalna pade).
Landline ya galat format par SMS nahi. Ek number kai patients par ho to STOP sabke
liye. Galat-number flag: reply me 'galat number' ya receptionist ka button. Logs me
hamesha masked number. Done jab: 50 sample numbers (ghar ke, +91 , 0 se shuru,
spaces) ka test.
7.7.3 Notice me messaging ka paragraph (S). Privacy notice (patient portal /my ka login
page aur kagaz) me likho: kya bhejte hain, kis raaste se, gateway third-party sewa hai (7.1.3
ke faisle ke hisaab se), kaise band karein. Done jab: sister ne padha aur samjha.
7.8.1 Dashboard card aur alerts (S). Phase 6 ke 'dhyan dene wali baatein' me: SMS
phone ka haal, aaj kitne gaye aur seema ka kitna, 'Dhyan do' list ki ginti, SIM recharge
ki tareekh (settings me). Developer ko alert (Healthchecks email): breaker open,
phone down  2 ghante se zyada, backlog 50 se zyada. Done jab: phone band karke test.
7.8.2 Phone ka setup aur dainik jaanch (S). Ek page: purana Android, hamesha
charger par, Wi-Fi par (mobile data backup), app ke liye battery optimisation off aur
auto-start on, app recent apps me lock, screen lock ya PIN, SIM ke recharge ki tareekh
(app ke FAQ bhi dekho). Receptionist ki subah ki 20 second ki jaanch: dashboard par
'SMS phone: chalu'. Done jab: phone ko 24 ghante bina chhue chhod kar test, aur
reboot ke baad app chalu.
7.8.3 Runbook aur 'sab hath se' button (M). 'SMS nahi ja rahe' par ek page, 6 kadam:
dashboard dekho, phone chalu aur charger aur net, app me Online, SIM ka balance aur
pack, doosre phone se test, aur 'sab queued SMS ko WhatsApp queue me daalo'
button (ek click, audit ke saath). Phone kho jaye to: SIM block karao, gateway login,
webhook key aur E2E key badlo (7.8.4). Done jab: sister ne drill me button dabaya aur
10 queued SMS WhatsApp tasks ban gaye.
Dental clinic software: ultra detail build plan
Page 63 of 150

7.9 Tests aur sign-off
Mat karo (Phase 7)
Anumati ke bina koi message queue mat karo.
Message me ilaaj, dawai, rashi, report ya bimari ka naam mat likho.
Discount, offer, free check-up ya 'sabse accha' jaisa message mat bhejo (DCI 8.1.3,
8.2).
Clinic ka mukhya number gateway SIM mat banao, aur SIM aise naam par mat lo jis par
aur zaroori numbers hon.
SMS me link mat daalo (meri salaah, sabit nahi).
50 message ek saath mat bhejo, dheere aur chhote tick me.
unknown  message ko automatic dobara mat bhejo.
OTP ka code kahin store ya log mat karo.
WhatsApp ko bot ya extension se automatic mat karo (shartein bulk aur auto
messaging mana karti hain, account band ho sakta hai).
7.1.3 ke faisle ke bina asli patients ke numbers par live mat jao.
7.8.4 Secrets aur rotation (S). Gateway login ya JWT, webhook signing key, E2E key,
webhook token: sab Worker secrets me, repo me kabhi nahi. Rotation ke kadam
README me, 6 mahine me ek baar badalna calendar me. Done jab: rotation drill me ek
secret badla aur system chalta raha.
7.9.1 Planner aur dispatcher tests (M). Property aur table tests: IST ki din ki seema
(cron UTC me chalta hai), quiet hours, dedupe, badlav ke baad purane radd, anumati
beech me hati, same-day booking, appointment 2 ghante ke andar, cap, OTP reserve,
cron dobara chalna. Done jab: CI me, aur ek niyam tod kar test fail hota hai.
7.9.2 Chaos tests (M). FakeAdapter se: timeout, 500, 429, duplicate aur out-of-order
webhook, claim ke baad Worker crash, galat signature, clock 3 minute aage ya peeche.
Done jab: koi message na do baar jata hai, na chup-chaap kho jata hai.
7.9.3 7 din ka asli phone test (M). Asli phone aur asli SIM, sirf staff ke 3 se 4 numbers
par (developer, sister, receptionist), roz 10 messages ka mix. Delivery %, delay, reboot,
battery, ping ka record. Done jab: 7 din ki ek table hai aur koi unknown  bina wajah ke
nahi.
7.9.4 Sister ka sign-off (S). Sab messages ke text, samay, 'Dhyan do' screen, runbook.
Done jab: sister ne haan likha.
Dental clinic software: ultra detail build plan
Page 64 of 150

Webhook ko signature check ke bina mat sunna.
Anjaan number ke reply ka text store mat karo.
Staging ya dev se asli number par kabhi mat bhejo.
Phase 7 ka gate
7.1.2 aur 7.1.3 ki report hai, aur E2E ka faisla decision register me.
40 nakli reminders FakeAdapter se ~35 minute me nikle, duplicate zero.
Asli phone par 7 din ke test me delivery aur delay ka record hai, koi unexplained
unknown  nahi.
Phone band karne par 30 se 35 minute me dashboard par 'down' aaya aur WhatsApp
tasks bane.
Anumati hatane par queued messages turant cancel, STOP reply se anumati hat gayi.
Webhook ke galat signature, purane timestamp aur repeat events sahi se sambhale
gaye.
Kisi table ya log me OTP ya anjaan number ke reply ka text nahi (grep test).
Sister ne message ki list, text aur runbook manzoor kiye, aur 'sab hath se' button ka
drill ho gaya.
Plan B ka page hai aur operator ya vakeel ke sawal ka jawab (ya 'abhi pata nahi')
decision register me.
Phase 8: Patient portal aur public website
Is phase me do alag cheezein banti hain. Hissa A patient portal hai: patient apne mobile
number se login karke sirf dekh sakta hai (appointment, parcha, bill; clinical notes nahi, ye
Tech decisions me tay hua tha), booking nahi, kyunki appointment sirf phone se hogi
(Phase 2 ka faisla). Hissa B public website hai: Google par clinic dikhne, timings, address
aur sampark ke liye, DCI ke niyamon ke andar. Do niyam: (1) patient ka koi data bina 'share'
flag ke portal par nahi aata, (2) public site par kisi patient ki jaankari ya photo kabhi nahi.
Kram: A, Phase 7 ke OTP par tikta hai, isliye uske baad. B domain milte hi kabhi bhi ho sakta
hai, aur uska chhota version (8.5, 8.6, 8.10) pehle nikalna faydemand ho sakta hai, kyunki
Google par dikhne me hafte lagte hain (meri soch, iska sawal comment me hai).
Pakka kya hai aur anuman kya hai
Pakka (padha hua, link ke saath):
Dental clinic software: ultra detail build plan
Page 65 of 150

Static files ke requests free aur unlimited hain, par jo path run_worker_first  me
likhe ho wo hamesha Worker chalate hain (Cloudflare docs). Yani public site aur SPA
ke files 100,000 per din ki seema me nahi ginte, sirf /api/*  aur /hooks/*  jaise
dynamic raaste ginte hain. Seema poore account ki hai (limits), isliye bot ki bheed staff
app ko bhi rok sakti hai (8.2.13 aur Phase 9).
Turnstile free plan: challenges unlimited, 20 widgets tak, har widget 10 hostnames, aur
docs me test keys hain (test secret keys sirf dummy token maanti hain).
DPDP Rules 2025 (PIB): 13 ya 14 Nov 2025 ko notified (sources me ek din ka fark), 18
mahine ka phased period. Har data fiduciary ko sawalon ke liye sampark jaankari saaf
dikhani hai (Rule 9). Breach par prabhavit logon ko bina der batana hai aur Board ko
vistrit report 72 ghante me (Rule 7, kai sources). Security safeguards me encryption
ya masking, access control aur logging aate hain (Rule 6, SCC Online). Access,
correction aur erasure ke anurodh par jawab ki seema 90 din likhi hai (PIB overview).
Bachchon ke data par parent ki sahmati chahiye, jab tak processing healthcare jaisi
zaruri sewa na ho (PIB, Fourth Schedule ka asli text maine nahi padha).
Domain: pehle ke research ke hisaab se workers.dev hobby ke liye hai, patients ko link
dene se pehle .in  domain lena hai (lagbhag ₹ 700 se ₹ 1,000 per saal, registrar par
dekhna), aur free Gmail se bheje email spam me jate hain.
Tech decisions se: teen alag hostname (site, staff, portal), cookies alag, workers.dev
par /app  aur /my  prefix (1.1.6), parcha issue par share flag (4.2.6), consent table me
portal  type (2.1.9).
Anuman (jaanchna hai): Fourth Schedule ka asli text. Rule 6 me log kitne din rakhne hain
(meri yaad: ek saal, original se confirm). _headers  file ka Workers static assets par
support. Free plan me kitne WAF ya rate-limit rules milte hain (ek blog 1 rate-limit rule
likhta hai). DCI: website par doctor ki photo, testimonial, before-after (seedha clause
maine nahi dekha). Google Business Profile ka verification tareeka. Data ka sthan
(Cloudflare, Backblaze) aur DPDP ke hisaab se uska asar.
8.1 Portal ke faisle (Hissa A: patient portal)
Screen Kya dikhta hai Kab Kaun tay karta
hai
Aane wali appointment tareekh, samay, doctor,
clinic ka pata, call
button
hamesha koi nahi
Dental clinic software: ultra detail build plan
Page 66 of 150

Portal ke numbers (Settings me badle ja sakte hain, 6.5.3 ka niyam):
Screen Kya dikhta hai Kab Kaun tay karta
hai
Purani appointments tareekh aur status
(Completed,
Cancelled, Missed)
hamesha koi nahi
Parcha issue hua parcha, jaisa
kagaz par likha hai
jab parche ka
share flag ON
(4.2.6)
doctor, issue ke
samay
Bill aur receipt bill, payments, baaki
rashi
bill issue hone par,
cancelled 'radd' ke
saath
setting, default
doctor chunega
(8.1.1)
Treatment plan kaun sa kaam aur
anumanit kharcha
jab doctor 'patient
ko dikhao' dabaye
doctor (baad
me)
Reports aur X-ray file ya image jab doctor 'patient
ko dikhao' dabaye
doctor (baad
me)
Clinical notes, internal
alerts, discount ka
karan, staff ke notes
nahi kabhi nahi koi nahi
Profile naam, mobile,
janmatithi, pata,
anumatiyan
hamesha, badalna
sirf anurodh se
koi nahi
Cheez Default
OTP 6 ank, 5 minute, ek code par 5 koshish
OTP maangna ek number par 3 per ghanta aur 10 per din, ek IP par
20 per ghanta (mobile network par kai log ek IP
share karte hain, isliye IP seema dheeli, asli rok
number par)
Password kam se kam 10 akshar, common passwords ki list se
check
Galat password 5 baar par 15 minute ka lock
Dental clinic software: ultra detail build plan
Page 67 of 150

8.2 Portal backend: accounts, OTP, password, sessions
Portal ke saare raaste /api/portal/*  par, staff ke raaste /api/staff/*  se alag
middleware ke saath. Free Worker me strong password hash nahi chalta, isliye Phase 0 ke
0.6.5 prototype ka tareeka: browser PBKDF2 chalata hai (6 lakh iterations), server sirf
HMAC se milata hai (1 ms se kam CPU).
Cheez Default
Session 30 minute idle, 12 ghante absolute
Patient ke anurodh ka jawab 30 din (kanoon ki upari seema 90 din)
8.1.1 Doctor ke saath portal ki list (S). Upar ki pehli table doctor ko dikhao: kya
dikhega, kab, aur bill ka default ON ya OFF (parcha issue ke samay doctor tay karta
hai). Done jab: doctor ne table par ok likha aur bill ka default chuna.
8.1.2 Login ka design page (M). Ek page jisme flows likhe hon: activation (staff 'portal
chalu' karta hai, patient OTP se number sabit karke apna password banata hai, staff
password kabhi nahi dekhta), login (password se ya OTP se), reset (OTP se), aur upar
ki numbers table. Shared number: ek mobile par kai patients ho sakte hain, par portal
par wahi dikhte hain jo activate hue aur jinka apna consent hua. Nabalig (18 se kam) ka
record guardian ke consent se, relation guardian . Done jab: page decision register
me hai aur doctor ne shared number aur nabalig ke niyam padhe.
8.1.3 Domain aur hostnames (S). .in  domain kharido (registrar par price dekho),
Cloudflare par DNS, teen hostname: clinic.in  aur www  (site), app.  (staff, Access
ke peeche), my.  (portal), Worker ke custom domains se jodo, HTTPS hamesha, www
se apex par redirect. Domain aur Cloudflare account clinic ke malik (sister) ke naam
par, developer ko delegated access. Registrar par 2FA, auto-renew aur transfer lock
ON. HSTS tab lagao jab teeno hostname kuch din theek chal chuke hon. Done jab:
teeno hostname HTTPS par chalte hain aur sister ke phone me recovery set hai.
8.1.4 Portal ka privacy impact note (S). Repo me ek page: portal par kaun sa data,
kisko dikhta hai, kahan store hota hai, kya galat ho sakta hai (galat patient ko data,
shared phone, chori hua phone, bot attack) aur har ek ka bachav (task number ke
saath). Privacy notice (8.10.1) isi se banta hai. Done jab: page me kam se kam 8 jokhim
aur har ek ke saamne ek task.
8.2.1 Tables (M). portal_accounts(id, mobile, salt, verifier,
password_set_at, failed_count, locked_until, status, last_login_at,
created_at) , portal_links(account_id, patient_id, relation, consent_id,
Dental clinic software: ultra detail build plan
Page 68 of 150

enabled_by, enabled_at, disabled_at) , otp_requests(id, mobile_hash,
purpose, code_hash, expires_at, attempts, used_at, created_at) ,
portal_sessions(id, account_id, token_hash, created_at, last_seen_at,
expires_at, device_label, revoked_at) , rate_limits(key, window_start,
count) , portal_access_log(id, account_id, patient_id, action, resource,
at) , patient_requests(id, patient_id, type, text, status, due_on,
closed_note, created_at, closed_at) . Jahan hash kaafi hai wahan mobile aur IP
plain me nahi ( mobile_hash  HMAC, IP sirf hash). Indexes: portal_accounts(mobile)
UNIQUE, portal_sessions(token_hash)  UNIQUE, otp_requests(mobile_hash,
created_at) , rate_limits(key) . Done jab: migration aur rollback test chalte hain.
8.2.2 Portal activate karna (M). Patient page par 'Portal chalu karo': pehle portal
consent row (2.1.9), phir portal_links  row, audit. Receptionist patient ko batati hai ki
apne mobile number se my.  wale address par jao, password staff kabhi nahi banata ya
dekhta. Bina consent ke button disabled. Nabalig ke liye relation guardian  aur
guardian ka naam aur number zaruri. Band karna ek click me (link disabled, sessions
revoke). Done jab: ek patient activate ho kar login karta hai, doosra (jiska consent
nahi) account me dikhta hi nahi, aur band karne par session turant bekaar.
8.2.3 OTP maangna (M). Pehle Turnstile verify, tab hi koi DB write. Jawab hamesha ek
jaisa ('agar number registered hai to OTP bheja gaya') aur samay bhi ek jaisa (anjaan
number par bhi nakli kaam kar ke). Limits upar ki table ke. Code 6 ank
crypto.getRandomValues  se (modulo bias ke bina), code_hash = HMAC(secret,
request_id + code) , 5 minute expiry, bhejna 7.2.7 se. Done jab: test: anjaan aur jaane
hue number ka response aur samay barabar (20 baar ke median me fark 50 ms ke
andar), ek ghante me chautha OTP block, Turnstile fail par DB me kuch nahi likhta.
8.2.4 OTP jaanchna (M). Ek code par 5 koshish, constant-time compare, ek hi baar use,
safal hone par used_at , aur ya to session ya 'password banao' ka chhota token (10
minute, ek baar). Done jab: test: 10 lakh codes aazmana mumkin nahi (5 ke baad code
dead), purana code dobara nahi chalta.
8.2.5 Password banana aur login (L). Browser me PBKDF2-SHA256 6 lakh iterations
(0.6.5 ka naap). Salt server se aata hai, anjaan number ke liye bhi ek pakka nakli salt
( HMAC(secret, mobile)  se), taaki number ka pata na chale. Browser derived key
bhejta hai, server HMAC(pepper, derived)  banakar stored verifier se constant-time
milata hai, pepper Worker secret me. Galat 5 baar par 15 minute lock (aur galat par aur
badhta), error hamesha generic. Password kam se kam 10 akshar, common list se
check (chhoti list, lazy-load). Done jab: sasti Android par login 1.5 second ke andar,
server CPU 1 ms se kam, 5 galat par lock.
Dental clinic software: ultra detail build plan
Page 69 of 150

8.2.6 Sessions (M). Token 32 random bytes, server par sirf SHA-256, cookie __Host-
pt  ( HttpOnly; Secure; SameSite=Lax; Path=/ ) sirf portal hostname par. Idle 30
minute, absolute 12 ghante, password badalne ya reset par saare sessions revoke aur
naya token. 'Meri jagahein' list (browser aur OS, aakhri istemal, IP nahi) aur 'sab jagah
se logout'. Done jab: cookie flags ka test, revoked session turant fail, fake clock se idle
expiry.
8.2.7 CSRF aur headers (S). Badalne wale raaste (logout, password, consent,
anurodh) sirf JSON aur custom header X-Requested-With  ke saath. Headers: CSP
( default-src 'self' , Turnstile ka origin sirf login page par), frame-ancestors
'none' , X-Content-Type-Options: nosniff , Referrer-Policy: no-referrer ,
chhoti Permissions-Policy , HSTS, aur portal API par Cache-Control: no-store .
Static files ke liye _headers  file (Workers par uska support docs me confirm karo,
warna Worker se). Done jab: ek test saare portal responses ke headers jaanchta hai
aur CSP me koi violation nahi.
8.2.8 Authorization layer (L). Portal ke saare queries ek portalRepo(patientIds)  se,
jahan patientIds  sirf session ke portal_links  se aate hain, request ke params ya
body se kabhi nahi. Response alag DTO me, field allow-list ke saath (internal notes,
staff ke naam, discount ka karan, audit, doosre patients kuch nahi). Anjaan ya doosre
ka ID mile to 404 (403 nahi, taaki pata na chale). Done jab: ek test saare
/api/portal/*  raaston ko ginta hai aur fail hota hai agar kisi par auth middleware ya
doosre-patient wala IDOR test nahi.
8.2.9 Portal ke data raaste (L). GET /api/portal/me , /appointments , /rx  aur
/rx/:id  (issue hua snapshot JSON), /bills  aur /bills/:id , /consents ,
/requests , /sessions . Sirf share flag ON wale parche aur bills. Page-wise (20 per
page), Cache-Control: private, no-store . Parcha browser me Phase 4 ke print
engine se, server par PDF nahi. Paise integer me, screen par 1,23,456  jaisa Indian
grouping. Done jab: Zod schemas aur contract tests, aur ek unshared parcha 404 deta
hai.
8.2.10 Share flag aur 'patient ki nazar se dekho' (M). Staff app me parche (4.2.6 ka
share flag), bill aur (baad me) treatment plan aur documents par 'Patient ko dikhao'
switch, badalna audit hota hai. Patient page par 'Patient ki nazar se dekho' (sirf
padhna, wahi DTO jo portal deta hai), taaki receptionist patient ko guide kar sake. Done
jab: switch OFF karte hi portal API se wo item gayab, aur preview aur portal ka output
ek jaisa (test).
Dental clinic software: ultra detail build plan
Page 70 of 150

8.3 Portal ke screens
8.2.11 Patient ke anurodh (M). Portal par 'meri jaankari badlo, meri jaankari ki copy do,
anumati wapas lo' form, text 500 akshar tak, upar 'emergency ho to call karein'. Staff
ke liye list: type, tareekh, due (default 30 din, kanoon ki upari seema 90 din, PIB
overview ke hisaab se), status, band karne par note. Anumati wapas lene wale anurodh
turant (Phase 7 ka withdrawal). Done jab: anurodh staff list me due date ke saath
dikhta hai, aur late wale dashboard ke 'dhyan dene wali baatein' me.
8.2.12 Portal access log (S). Login, logout, appointments dekhna, parcha ya bill kholna
(ID ke saath, text nahi). Staff ko patient page par sirf login ke samay, poora log
developer ke liye. 1 saal rakho (Rule 6 me logs ka zikr hai, saal ki seema meri yaad se,
original se confirm), phir purge. Done jab: test login aur 2 views se 3 rows, purge job ka
test.
8.2.13 Bheed aur bot se bachav (S). Patient portal (/my) ke bina login wale raaste (OTP
maangna, login, salt, form) par: Turnstile pehle, ek request par ek se zyada DB write nahi,
aur rate_limits  ki writes ghante me 2,000 se upar jayein to 'lockdown': portal auth
raaste 503 ke saath 'abhi clinic ko call karein', aur alert. Wajah: poore account ki
100,000 requests per din ki seema bot se khatam ho to staff app bhi ruk jata hai, aur D1
ki 100,000 writes bhi. Cloudflare dashboard me Bot Fight Mode on karo aur portal auth
raaston par rate limiting rule lagao (free plan me kitne rules milte hain ye check karo).
Done jab: 3,000 nakli requests ke load test me D1 writes 3,000 se kam, aur staff API
chalta rahe (staging me).
8.3.1 Design tokens aur shell (S). 1.4.1 ke tokens ka patient-friendly roop: bada base [note: language toggle removed, UI is English only, see docs/DECISIONS.md]
font (17 se 18 px), khula spacing, mobile par neeche tab bar (Home, Appointments,
Records, Profile), upar clinic ka logo aur naam. Done jab: 360 px chaude
phone par har screen bina horizontal scroll ke.
8.3.2 Login screens (M). Mobile number (7.7.2 ka function), 'password se' aur 'OTP se',
Turnstile, saaf error copy, 'password bhool gaye', pehli baar ka activation. PBKDF2 ke
dauran 'surakshit login ho raha hai' spinner. Form accessible: labels, autocomplete
( username , current-password , new-password , one-time-code ),
inputmode='numeric' , taaki password manager aur SMS autofill chalein. Done jab:
sasti Android par bina madad ke login, aur password manager ne password save kiya.
8.3.3 Home (S). Agli appointment ka card, call button, clinic ka pata aur timings,
neeche parcha aur bill ke shortcut. Done jab: appointment na ho to 'abhi koi
appointment nahi, booking ke liye call karein'.
Dental clinic software: ultra detail build plan
Page 71 of 150

8.4 Portal ke tests aur pilot
8.3.4 Appointments (S). Aane wali aur purani list. Badlav ke liye 'call karein' ( tel:
link), cancel button nahi. Status neutral shabdon me (Completed, Cancelled, Missed),
ilzaam jaisa kuch nahi. Done jab: sab statuses ek jaise dikhte hain, aur koi badalne wala
button nahi.
8.3.5 Parcha (M). Share hue parchon ki list (tareekh, doctor), detail me wahi parcha jo
kagaz par hota hai, 'Revised' likha ho to dikhe, Print button (Phase 4 ka print CSS).
Dant ke number ke saath saadi bhasha ka naam (jaise 16 ke saath 'upar daayein pehli
badi daadh', FDI ka naam). Done jab: parcha kagaz wale se line-by-line milta hai
(screenshot compare).
8.3.6 Bills aur receipts (M). List (tareekh, rashi, status), detail me bill ki lines,
payments, baaki rashi, print receipt. Radd hua bill 'radd' ke saath dikhta hai, chhupta
nahi. Done jab: ek bill ka total, payments aur baaki staff ke screen se paise-paise milta
hai (test).
8.3.7 Profile, anumatiyan, anurodh (M). Profile padhna, anumatiyan (SMS yaad dilane
wapas lena, jisse consents  me nayi row), anurodh ka form (8.2.11), 'meri jagahein' aur
'sab jagah se logout', password badalna. Done jab: SMS ki anumati wapas lene par agla
reminder queue nahi hota (Phase 7 ka test).
CANCELLED 8.3.8 Hindi aur English (M). Portal ke saare text i18n files me, Hindi ka text sister se [CANCELLED note: UI is English only, see docs/DECISIONS.md]
padhwana (bina review ke machine translation nahi), Devanagari font sirf Hindi
chunne par load, tareekh aur rakam local format me. Done jab: pura portal Hindi me
chal jata hai bina tute hue layout ke.
8.3.9 Khali, error aur offline states (S). Kuch nahi hai, session khatam, server error,
net nahi: har jagah clinic ka number aur ek line ka agla kadam. Done jab: har screen par
4 states dekhe gaye.
8.3.10 Treatment plan aur documents (M, baad me). Doctor ke 'patient ko dikhao'
wale items: plan ka saar aur anumanit kharcha, reports aur X-ray image (authenticated
Worker se, nosniff , no-store , download default band). Done jab: unshared image
ka seedha URL 404 deta hai.
8.3.11 Home screen icon (S, baad me). Web app manifest aur icon, taaki patient phone
ki home screen par jod sake. Done jab: Android Chrome 'Add to Home screen' dikhata
hai.
8.4.1 IDOR, auth aur session tests (M). Do accounts, har route par doosre ka ID,
cookie flags, session fixation, OTP brute force, enumeration ka samay, CSRF, aur naam
ya notes me script  tag daalkar XSS (sab text ki tarah dikhna). Done jab: sab CI me,
Dental clinic software: ultra detail build plan
Page 72 of 150

CANCELLED 8.5 Website ke faisle aur content (Hissa B: public website) [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
aur ek jaanboojh kar toda hua check test fail karta hai.
8.4.2 Security review (M). OWASP ASVS ka checklist (auth, session, access control,
validation, errors aur logging, data protection, API, config), pnpm audit , secret
scanning (gitleaks) CI me, dependency updates ka auto PR. Kisi dost developer se
auth code ek baar padhwao (free). Done jab: checklist me har line par haan ya kaaran,
aur dost ki review ke issues band.
8.4.3 Accessibility aur speed (M). axe aur Lighthouse, TalkBack se login aur bill, text
200% zoom, Slow 4G par sasti Android. Done jab: login se bill tak ek patient bina
madad ke 2 minute me.
8.4.4 Pilot (M). Pehle 5 staff ya parivar, phir desk par 10 asli patients jinhone portal
consent diya. Receptionist ke liye ek line ka script ('portal par aap apni appointment,
parcha aur bill dekh sakte hain'). Kagaz par feedback, top 5 issues theek. Done jab: 10
me se kam se kam 8 patients bina madad ke login kar paye.
CANCELLED 8.5.1 Pages ki list (S). Home, About (doctor), Services, Fees (agar doctor chahe), [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
Contact aur Location, FAQ, Privacy Notice, Terms aur Disclaimer, 404, aur 'Patient
login' button jo my.  hostname par jata hai. Har page ka ek maksad aur ek main action
(zyadatar 'call karein'). Patient guides baad me. Done jab: pages ki list par doctor ki
manzoori.
CANCELLED 8.5.2 DCI content checklist (M). Ek page repo me docs/website-content-rules.md : [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
(1) naam, degree, dental council ka naam aur registration number (DCI 3.4.1 clinic,
parche, certificate aur receipt ke liye kehta hai, website par bhi lagao). (2) Sirf tathya:
services, timings, pata, fees (8.2.8 aur 8.2.9 factual website aur fee list ko allow karte
hain, 3.8 aur 5.7.1 ke hisaab se daam pehle bataye jate hain). (3) Mana: apni badai ya
'best', 'No.1' jaise daave aur cases ya results ki badai (8.2), discount ya offer (8.1.3),
referral commission ya inaam (5.1.2, 8.6.1), 'specialist' bina manyata-prapt qualification
ke (8.3.3), signboard ya letterhead par doctor ki photo (8.3.1). (4) Abhi mat lagao jab
tak vakeel ya IDA confirm na kare: testimonials, before-after photos, Google reviews
ka embed, website par doctor ki photo. Done jab: doctor ne checklist padhi aur sign ki.
CANCELLED 8.5.3 Content likhna (L). Har page ka text: doctor ki degree, college, saal, council aur [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
registration number, anubhav (tathya me), services, facilities, timings, pata,
bhashayein, payment ke tareeke (cash aur jo desk par chalta ho, 'online payment' ka
zikr nahi), emergency me kya karein. Draft tum ya Claude likho, sister facts aur
Dental clinic software: ultra detail build plan
Page 73 of 150

CANCELLED 8.6 Site ka build (Astro, apps/site ) [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
certificate deti hai, har dawe ke saamne ek document jisse wo sabit ho. Saadi English
(Hindi baad me), har page 400 shabd ke andar. Done jab: sister ne har page manzoor
kiya aur har claim ke saamne saboot likha hai.
CANCELLED 8.5.4 Photos aur logo (M). Logo (hai to lo, warna saada wordmark), clinic ki asli photos [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
(reception, kursi, bahar ka hissa) din ki roshni me phone se, koi patient frame me nahi,
staff ki photo ke liye unki sahmati, alt text. Doctor ki photo ka faisla: DCI 8.3.1
letterhead aur signboard par photo mana karta hai, website par seedha maine nahi
dekha, isliye abhi sirf degree aur registration likho. Photos developer repo me jodta
hai, app se upload nahi (8.7.3). Done jab: 6 photos ready, har ek 200 KB se kam WebP
me, alt text ke saath.
CANCELLED 8.5.5 Domain ka email (S, baad me). info@  jaisa address Cloudflare Email Routing se [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
Gmail par forward (docs me check karo, maine nahi dekha), bhejna Brevo se (7.6.1).
Done jab: test email aata hai.
CANCELLED 8.6.1 Layout aur components (M). Shared tokens, header (logo, nav, 'Patient login'), [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
footer (naam, pata, phone, timings, registration number, links), mobile par neeche
chipka hua 'Call' aur 'WhatsApp' bar, skip link, focus styles, print stylesheet. Done jab:
sab pages ek hi layout se bante hain.
CANCELLED 8.6.2 Pages (L). Content collections me markdown. Home: ek line ka parichay, 'Call [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
karein' aur WhatsApp, aaj ke timings (khula ya band), 3 main services, pata. About:
degree, council, registration, anubhav. Services: har ek ka naam, 60 shabd me saadi
bhasha ka vivaran, kiske liye, aam taur par kitni visits (doctor ke anusaar), fee (agar
doctor chahe). Contact: pata, 'Maps me kholo' link (iframe nahi), timings, phone,
WhatsApp. FAQ: 8 se 10 sawal (appointment kaise, kya lana hai, payment, emergency).
Koi stock photo nahi jisme nakli mareez ho. Done jab: sab pages build hote hain aur link
checker me koi tuta link nahi.
CANCELLED 8.6.3 Data snapshot aur overlay (M). GET /api/public/site  (bina login, sirf GET): [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
naam, pata, phone, timings, holidays, notice, services, FAQ. Astro build isse data leta
hai (na mile to repo ka site-data.json ), isliye HTML me last-build ke values hote hain
(SEO ke liye). Browser me chhota script sirf timings aur notice ko taaza values se
badalta hai agar alag hon, aur sessionStorage  me 5 minute cache karta hai (har fetch
Worker chalata hai aur 100,000 per din me ginta hai). Cache-Control: public, max-
age=300 , ETag, API fail ho to static values rahein. Raat ko GitHub Action site dobara
Dental clinic software: ultra detail build plan
Page 74 of 150

build karta hai last release tag se (main se nahi, taaki adhoora code live na ho), build
fail ho to purana chalta rahe. Done jab: staff app me timings badalne par overlay 5
minute me aur JSON-LD agli subah tak badal jata hai.
CANCELLED 8.6.4 Structured data (S). Har page par JSON-LD: schema.org ka Dentist  type, [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
naam, pata, geo, phone, openingHoursSpecification , url , logo . Sirf wahi jo sach
hai aur dikhne wale text me bhi hai. Done jab: Google ke Rich Results Test me koi error
nahi.
CANCELLED 8.6.5 SEO basics (M). Har page ka alag title aur description (kisi ki badai nahi), [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
canonical, lang , sitemap.xml , robots.txt , Open Graph image (WhatsApp me link
ka preview achha dikhe), saaf URLs, 404 aur redirects. Search Console DNS TXT se
verify. Done jab: Search Console me sitemap ke pages kuch din baad indexed, aur
WhatsApp me link ka preview theek.
CANCELLED 8.6.6 Performance budget (M). Targets (Core Web Vitals ke thresholds meri jaankari [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
se: LCP 2.5 s, INP 200 ms, CLS 0.1): Slow 4G par sasti Android me LCP 2.5 s ke andar,
home page ka transfer 300 KB se kam, JS 30 KB se kam (sirf overlay aur form), images
WebP me width aur height ke saath aur lazy, font system stack ya ek self-hosted font
( font-display: swap ), koi third-party script nahi (Turnstile sirf form wale page par).
Lighthouse CI GitHub Action me budget ke saath. Done jab: CI me Lighthouse mobile
performance 90 ya upar, aur budget tootne par build fail.
CANCELLED 8.6.7 Accessibility (M). WCAG 2.2 AA ka lakshya: contrast 4.5:1, focus dikhna, tap [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
target 44 px, sahi headings aur landmarks, alt text, form labels, reduced motion, sirf
keyboard se poora chalna. axe CI me, aur ek baar screen reader se manual pass. Done
jab: axe me koi serious issue nahi aur keyboard se Home se Contact tak pahunch gaye.
CANCELLED 8.6.8 Static aur dynamic raaste, headers (S). run_worker_first  sirf /api/*  aur [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
/hooks/*  par, baaki sab static (free aur unlimited). Ek Worker me
not_found_handling  ek hi mode ho sakta hai (Astro ka 404 page ya SPA fallback;
meri jaankari, docs ke routing page se confirm), isliye dono SPA me hash routing (jaise
/my/#/bills ). _headers  se security headers (strict CSP bina inline script ke,
Referrer-Policy ), hashed files par Cache-Control: immutable , aur /.well-
known/security.txt . Done jab: portal par /my/#/bills  refresh karne par wahi page
khulta hai, aur Cloudflare dashboard me static page kholne par Worker requests nahi
badhte.
CANCELLED 8.6.9 Hindi version (L, baad me). /hi/  pages English ke stable hone ke baad, [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
hreflang , Devanagari font subset, sister ki review. Done jab: har English page ka
Hindi jodidaar aur hreflang validator saaf.
Dental clinic software: ultra detail build plan
Page 75 of 150

CANCELLED 8.7 Doctor ke liye website ka content editor [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
CANCELLED 8.6.10 Patient education articles (L, baad me). Doctor ke likhe 8 se 10 chhote articles [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
(jaise daant saaf rakhna, bachchon ke daant), tathya ke saath, koi vaada ya superiority
nahi, Article  schema, 'aakhri update' tareekh. Doctor ka kaafi samay lagega, isliye
baad me. Done jab: doctor ne har article padha aur sign kiya.
CANCELLED 8.7.1 Data aur validation (M). Settings ke versioned store me (1.5.1) site.notice , [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
site.about , site.services  (naam, vivaran, fee, visible, sort), site.faq ,
site.fees , draft aur published alag. Zod se limits (jaise vivaran 300 akshar). Public
DTO alag, sirf published. Done jab: draft badalne se site par kuch nahi badalta.
CANCELLED 8.7.2 Editor screens (L). Settings me 'Website': notice banner (text, kab se kab tak, [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
ON ya OFF), About text (bold, list, link bas), services (jodo, badlo, kram badlo,
chhupao), FAQ, fees table, footer text. Site ke CSS ke saath preview, draft autosave
(audit row nahi, Phase 3 ke draft jaisa apvad), har field ke saath ek line ki samjhaish
(6.5.6). Done jab: doctor ne bina madad ke banner lagaya aur ek service ka vivaran
badla.
CANCELLED 8.7.3 Photo upload (M, baad me). Abhi nahi, kyunki app se upload me patient ki photo [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
galti se public hone ka khatra hai aur har image request Worker chalati hai. Agar baad
me chahiye: browser me resize aur re-encode (EXIF aur GPS hat jate hain), R2 ke alag
public/  prefix me, alt text zaruri, aur invariant test ki patient files kabhi public/  se
serve nahi hoti. Done jab: GPS wali photo upload ke baad metadata khali, aur patient
file ka public URL 404.
CANCELLED 8.7.4 Publish aur history (M). Draft se Published par DCI lint ka natija aur diff dikhta [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
hai, sirf doctor (receptionist nahi) publish kar sakta hai, naya version banta hai, overlay 5
minute me taaza, 'is version par wapas jao' ek click me (6.5.2 jaisa), audit. Done jab:
galat text publish karke ek click me wapas.
CANCELLED 8.7.5 Content lint (M). Warning: 'best', 'No.1', 'leading', 'top', 'guaranteed', '100%', 'cure', [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
'painless', 'permanent', 'better than', 'latest technology', 'patients say', before-after
jaise shabd. Block: discount, offer, free, '% off', package, deal, aur 'specialist' jab
qualification ka field khali ho. Registration number na ho to publish nahi. Wahi lint CI
me repo ke content par. Done jab: ek kharab paragraph 6 warnings deta hai aur
discount wale shabd par block, achha paragraph clean.
CANCELLED 8.7.6 Fees ka format (S). Consultation aur kuch aam services ki fee tathya ke roop me [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
(doctor chune), aur ek line: 'ilaaj ka kharcha case par nirbhar karta hai, ilaaj se pehle
anumanit kharcha bataya jata hai' (3.8, 5.7.1). Koi 'starting from' ya package nahi, wo
offer jaisa lag sakta hai (meri salaah). Done jab: doctor ne fee list manzoor ki.
Dental clinic software: ultra detail build plan
Page 76 of 150

CANCELLED 8.8 Google par maujoodgi [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
CANCELLED 8.9 Sampark aur forms [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
CANCELLED 8.8.1 Google Business Profile (M). Free. Clinic ka asli naam (keyword jodna Google ki [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
policy ke khilaf hai, meri jaankari), category Dentist, hours (holidays ke special hours),
phone, website, photos, services. Owner sister ka Google account, developer
manager. Verification Google tay karta hai (video, phone ya postcard, India me kaun sa
milega maine check nahi kiya). Reviews: kisi ko review ke badle kuch mat do (Google ki
policy aur DCI 8.1.3). Reply me kabhi mat likho ki wo patient hai ya kya ilaaj hua
(confidentiality, DCI 4.2), sirf 'dhanyavaad, kripya clinic ko call karein'. Done jab: profile
verified aur sister ke account se manage hota hai.
CANCELLED 8.8.2 Search Console (S). DNS se verify, sitemap submit, coverage aur mobile [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
usability dekhna. Done jab: 4 hafte baad kam se kam Home, Services, Contact indexed.
CANCELLED 8.8.3 Naam, pata, phone ek jaisa (S). Site, Google profile, parcha, receipt, [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
appointment card sab par bilkul ek jaisa. Directory listing sirf free aur DCI check ke
baad, per-lead ya commission wale platform nahi (DCI 5.1.2, 8.6.1). Done jab: ek table
me har jagah ka naam, pata, phone ek hi.
CANCELLED 8.8.4 QR aur print (S). Static QR (browser me SVG), site ya WhatsApp chat link ke liye, [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
parche ke footer (Phase 4 template), receipt, appointment card aur clinic ki deewar
par. Koi tracking nahi. Done jab: print kiye gaye QR 3 phones par khulte hain.
CANCELLED 8.8.5 Uptime aur link monitoring (S). Site aur portal ke liye koi free uptime monitor [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
(free plan ki seema maine check nahi ki) jo band hone par developer ko email kare, aur
mahine me ek baar link checker. Phase 9 isse monitoring se jodta hai. Done jab: test me
site band karke alert aaya.
CANCELLED 8.9.1 Sampark ka block (S). Click-to-call ( tel: ), WhatsApp ( wa.me  link, text me sirf [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
'Hello, I would like to book an appointment', mareez khud shuru karta hai aur receptionist
jawab deti hai), pata aur 'Maps me kholo', timings (overlay se), 'aaj khula ya band'. Done
jab: phone par ek tap me call aur WhatsApp dono khulte hain.
CANCELLED 8.9.2 Callback form (M, baad me). Naam, mobile, kab call karein (subah, dopahar, [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
shaam), wajah (appointment, poochtaachh), chhota text 200 akshar tak jiske upar
'bimari ki detail na likhein, emergency me call karein'. Consent line aur 30 din me
delete, Turnstile, honeypot, mobile aur IP par rate limit. Staff ki list: naya, call kiya,
booked, jawab nahi. Doosre ka number daalkar kisi ko pareshan karne ka khatra hai,
isliye ek form par ek hi call. Done jab: 100 spam submissions block, aur asli submission
staff list me 5 second me.
Dental clinic software: ultra detail build plan
Page 77 of 150

8.10 Kanooni pages
8.11 QA aur launch
CANCELLED 8.9.3 Emergency ki line (S). 'Dard ya sujan ho to seedha call karein' aur number. Koi [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
salah nahi aur 24 ghante ka vaada tabhi jab sach ho; baad ke ghanton me kya hota hai
wo likho. Done jab: sister ne line manzoor ki.
8.10.1 Privacy Notice (M). Saadi bhasha me: kaun (clinic, registration), kaunsa data
(patient record, sampark, appointment, bill, images), kyun (ilaaj, yaad dilana, billing,
kanooni record rakhna), kaun dekhta hai (staff, SMS gateway, hosting, encrypted
backup), kitne din (DCI ke hisaab se kam se kam 3 saal, clinic ki apni policy likho), haq
(dekhna, sudhaarna, mitana jahan kanoon rokta nahi, sahmati wapas lena), shikayat
aur sawal ke liye sampark (Rule 9 ke hisaab se saaf dikhna chahiye), bachche aur
guardian, aur data ka sthan jo 8.1.4 se aaya. Kisi aise vyakti ko dikhao jo DPDP samajhta
ho. Done jab: notice site, portal aur kagaz teeno par ek hi version ke saath, aur 2.1.9 ki
table me us version ka naam.
8.10.2 Terms aur Disclaimer (S). Site ki jaankari shiksha ke liye hai, mulakat ka vikalp
nahi, site se doctor-patient sambandh nahi banta, emergency me call, links aur
copyright. Done jab: sister ne padha.
8.10.3 Footer ki jaankari (S). Registration number aur council, pata, phone, 'aakhri
update' tareekh, privacy aur terms ke links, sawalon ke liye sampark. Done jab: har
page par footer ek jaisa.
8.10.4 Tracker audit (S). Devtools se har page par dekho ki koi third-party request ya
cookie nahi (Turnstile ke cookies ya storage check karo aur notice me likho). Koi
analytics, Google Fonts ya Maps iframe nahi, isliye cookie banner ki zaroorat nahi
(meri samajh). Done jab: Turnstile ke alawa kisi page par third-party request nahi.
8.11.1 Content sign-off (S). Doctor har page padhe aur 8.5.2 ki checklist par sign kare.
Done jab: sign hua.
8.11.2 Alag devices par test (M). Sasti Android, iPhone (agar mile), Chrome, Safari,
Firefox, 360 se 1440 px, Slow 4G, print, ek baar screen reader. Done jab: ek table me
har combination par pass.
8.11.3 CI ke checks (M). Lighthouse budget, axe, link checker, HTML validation,
spellcheck (cspell, English), content lint, image size check. Done jab: ek kharab
commit teeno me se kam se kam ek check par fail hota hai.
CANCELLED 8.11.4 Soft launch (S). Site domain par live par noindex , 5 patients ya dosto ko dikhao, [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
feedback. Done jab: top issues theek.
Dental clinic software: ultra detail build plan
Page 78 of 150

Mat karo (Phase 8)
Portal par booking, cancel ya koi badlav mat do (faisla: sirf dekhna).
Clinical notes, internal alerts, discount ka karan ya staff ke notes portal par mat
dikhao.
Patient ID request ke params se mat padho, hamesha session se.
Number ya OTP ke baare me alag alag jawab ya alag samay mat do (enumeration).
Password server par plain ya kamzor hash me mat rakho, aur staff ko password banane
ya dekhne mat do.
OTP bina Turnstile aur limits ke mat bhejo.
Google Maps iframe, Google Fonts, analytics ya koi tracker mat jodo (privacy, speed,
cookie banner).
Patient files R2 ke public/  prefix me mat rakho, patient file kabhi public raaste se
serve nahi hoti.
Phase 8 ka gate
Do accounts ka IDOR test har portal route par pass, OTP brute force aur enumeration
tests pass.
Login sasti Android par 1.5 second ke andar, server CPU 1 ms se kam.
Unshared parcha ya bill portal par 404, share flag OFF karte hi item gayab.
Cookie flags aur headers ka test pass, aur lockdown test (3,000 nakli requests) me D1
writes 3,000 se kam.
10 asli patients me se kam se kam 8 bina madad ke login kar paye, aur privacy impact
note aur notice manzoor.
CANCELLED 8.11.5 Public karna (S). noindex  hatao, sitemap submit, Google profile par website [CANCELLED note: no public website in this repo, see docs/DECISIONS.md]
jodo, QR print, desk par batao, 4 hafte Search Console dekho. Done jab: Google par
clinic ke naam se site ya profile dikhti hai.
Dental clinic software: ultra detail build plan
Page 79 of 150

Lighthouse mobile performance 90 ya upar, axe me koi serious issue nahi, aur Turnstile
ke alawa koi third-party request nahi.
Static page kholne par Cloudflare dashboard me Worker requests nahi badhte.
JSON-LD valid, sitemap submit, Google profile verified, aur parche par QR 3 phones
par khulta hai.
Phase 9: Hardening (bharose ke laayak banana)
Ab tak software chalna seekha, ab use bharose ke laayak banate hain. Teen maqsad: (1)
kuch bhi toote to data ek din se zyada purana na khoye, aur har backup ka restore karke
dekha ho; (2) kuch ruke to clinic na ruke (downtime procedure, quota alerts, paper mode);
(3) patient ka data surakshit rahe aur DPDP ke liye taiyari ho (security review, breach plan,
retention). Backup tab tak 'maana hua' hi rehta hai jab tak restore karke na dekha jaye,
isliye har parat ka restore drill hota hai.
Backup ki teen parat
Target (meri soch): data ka nuksaan 24 ghante se kam (Time Travel se 1 minute), aur B2 se
poora restore 4 ghante ke andar (isko 9.1.7 me asli naap se badalna hai).
Pakka kya hai aur anuman kya hai
Pakka (padha hua, link ke saath):
Parat Kya hai Kitna
purana
data tak
Kab kaam aati hai
1. D1 Time Travel Cloudflare ka point-in-
time restore, 7 din tak
kisi bhi minute par
1 minute galat migration, galat
delete, bug
2. Raat ka export,
encrypted, Backblaze
B2 par
wrangler d1 export ,
age  se encrypt, alag
company ka account
24 ghante Cloudflare account ya
D1 hi kharab ho jaye, 7
din se purani galti
3. Haftawar copy clinic
PC par, aur R2 files ka
B2 par backup
encrypted copy 7 din B2 aur Cloudflare dono
se access kho jaye
Dental clinic software: ultra detail build plan
Page 80 of 150

D1: Time Travel free plan par 7 din, 10 restores per 10 minute per database. Export
chalte waqt baaki database requests ruk jati hain, isliye export clinic band hone ke
baad. D1 ke jurisdiction options sirf eu  aur fedramp  hain, India nahi.
Workers free: 100,000 requests per din, reset midnight UTC par (yani subah 05:30 IST),
seema paar karne par Error 1027. CPU time me network ka intezaar (fetch, database)
nahi ginta.
Workers ke requests GraphQL Analytics API se padhe ja sakte hain
( workersInvocationsAdaptive , Account Analytics read wala token).
Cloudflare Zero Trust free plan 50 users tak. Docs ke setup page (preview copy me
dekha) ke hisaab se onboarding me payment details dene padte hain par free plan par
charge nahi. Billing FAQ me card aur PayPal dono accepted hain. R2 ke liye card
chahiye ya nahi, sources alag alag kehte hain (Cloudflare ka marketing page 'no credit
card required', ek guide 'payment method maangi ja sakti hai'), isliye card ya PayPal
taiyar rakho.
R2 free tier: 10 GB-month, 10 lakh Class A, 1 crore Class B, egress free. Backblaze B2:
pehle 10 GB free, egress average storage ka 3 guna tak free, transactions free.
GitHub: private repos par 2,000 free minutes per mahina, public repo me 60 din
inactivity par scheduled workflows band. Ek DEV post kehti hai ki free personal
account ke private repo me schedule trigger chalta hi nahi (official docs me aisa nahi
likha), isliye 9.1.2 me test.
DPDP Rule 7: breach par prabhavit logon ko bina der, aur Board ko pehle turant aur
vistrit report 72 ghante me (Phase 8 ke sources).
Anuman (jaanchna hai): B2 ko card chahiye ya nahi. Export ka asli samay aur block ki
avadhi (database badi hone par). GitHub schedule ka sach. 4 ghante ka restore. age  aur
rclone  ke kadam (meri jaankari). D1 triggers (3.2.6 ka test). Kaun sa Indian card
Cloudflare par chalta hai (pakka nahi, PayPal vikalp hai).
9.1 Backup aur restore
9.1.1 Backup ka design page (S). Upar ki table, kaun kya rakhta hai (B2 account, age
key, Cloudflare), retention (30 roz ke, 12 mahine ke, 3 saal ke, meri soch), export ka
samay 02:30 IST kyunki export chalte waqt baaki requests ruk jati hain, aur target ka
nuksaan aur restore samay. Done jab: page decision register me aur sister ne padha.
9.1.2 Scheduler ka spike (S). Private repo me ek chhota scheduled workflow (har 15
minute) 3 din chalao aur dekho chalta hai ya nahi. Agar nahi chalta: Worker cron raat
02:00 par GitHub ko workflow_dispatch  bhejta hai (fine-grained token, sirf us ek
Dental clinic software: ultra detail build plan
Page 81 of 150

repo ka Actions write, expiry ke saath, calendar me badalna). Dono me Healthchecks
ka dead-man ping. Done jab: kaam karne wala tareeka chuna aur decision register me,
aur Phase 0 ke spike gate me is test ka natija.
9.1.3 Export workflow (M). GitHub Action: wrangler d1 export --remote
(Cloudflare token sirf D1 ke liye), dump ko local SQLite me import karke PRAGMA
integrity_check  aur Phase 5 ke weekly invariant queries (kharab dump upload hi na
ho), age  se encrypt (CI me sirf public key), B2 par tareekh wale naam aur checksum
ke saath upload, Healthchecks ko size aur samay ke saath ping. Retention B2 ke
lifecycle rules se. Done jab: jaanboojh kar toda hua dump upload nahi hota aur alert
aata hai.
9.1.4 Files ka backup (M). R2 se B2 par haftawar rclone copy  (copy, sync nahi, taaki
galti se delete na phail jaye), encrypted ( rclone crypt ), listing ke Class A operations
ka hisaab (free 10 lakh per mahina), ginti aur checksum ka sample verify. Done jab: ek
file R2 se mita kar B2 se wapas laayi ja sakti hai.
9.1.5 Clinic PC par haftawar copy (S). B2 ki read-only key se rclone  latest encrypted
dump aur files ki list ek folder me utaarta hai (Task Scheduler ya cron, ravivaar raat),
taaki B2 aur Cloudflare dono se access kho jaye to bhi ek copy clinic me ho. Disk par
encrypted hi. PC band rahe to Healthchecks alert. Done jab: 3 hafte ki copies PC par,
aur ek band hafte ka alert aaya.
9.1.6 Keys aur accounts ka bandobast (S). age  ki private key kagaz par sealed lifafe
me sister ke ghar, ek copy developer ke password manager me, kabhi repo ya CI me
nahi. Ek table: kiske paas kya hai (B2 login, Cloudflare login aur 2FA recovery codes,
age  key, GitHub, domain registrar, Healthchecks). Kam se kam do log decrypt kar
saken. Har 3 mahine test decrypt. Done jab: sister ne developer ke bina (guide ke
saath) ek dump decrypt karke dekha.
9.1.7 Restore drill 1: B2 se poora (L). Developer ke laptop par (asli data staging me
kabhi nahi): B2 se download, decrypt, local D1 ( wrangler dev --local ) me import,
invariants aur row counts, app khol kar 5 patients ka record dekho, samay naapo. Phir
laptop se wo data hata do. Phir naye production D1 me restore ke kadam likho (naya
DB banana, migrations, import, binding badalna, redeploy). Done jab: restore ka asli
samay likha (meri soch 4 ghante) aur runbook me kadam.
9.1.8 Restore drill 2: Time Travel (M). Ek throwaway D1 par time-travel info  aur
restore  ka abhyas (10 restores per 10 minute ki seema), galat delete ka nakli
scenario, restore ke baad kya jaanchna hai (invariants, aakhri audit rows). Har
production migration se pehle bookmark ka note. Done jab: ek nakli galti 10 minute me
wapas ki gayi.
Dental clinic software: ultra detail build plan
Page 82 of 150

9.2 Downtime aur quota
9.1.9 Migration ki suraksha (M). Har migration se pehle: Time Travel bookmark likho,
taaza export, ek copy par dry run. Pehle naya column jodo, code badlo, phir purana
hatao (do alag deploys), koi destructive migration ek deploy me nahi, har migration ka
rollback plan. Deploy sirf clinic ke samay ke baad. Done jab: ek nakli galat migration ka
rollback karke dikhaya.
9.1.10 Backup ki nigrani (S). Healthchecks me checks: raat ka export (3 ghante grace),
haftawar R2 copy, haftawar PC copy. Action ek signed webhook se Worker ko status
bhejta hai ( ops_status ), aur dashboard ke 'dhyan dene wali baatein' me 'aakhri
backup: kal 02:41, 38 MB, theek'. Done jab: export band karke test: 3 ghante me alert
aur dashboard par laal.
9.2.1 Quota monitor (M). Cron ka ek ghante wala branch GraphQL se (token sirf
Account Analytics read) aaj ke Worker requests padhta hai aur 50,000, 80,000, 95,000
par alert deta hai (Healthchecks fail ping ya email). D1 ke rows read aur written ka
dashboard har hafte hath se dekhna, aur ek 'quota budget' table (har feature ka roz ka
anuman). Done jab: nakli threshold par alert aaya, aur table me har phase ka hissa likha
hai.
9.2.2 Quota khatam hone par kya hota hai (S). Seema paar hone par Error 1027 aur
reset subah 05:30 IST par. Static pages aur SPA ke files phir bhi chalte hain (free aur
unlimited), par API nahi, isliye staff app 'server busy' dikhaye aur paper mode ka link
de. Done jab: staging me seema nakli kam karke ye behaviour dekha.
9.2.3 Kal ki list aur paper kit (M). Receptionist roz shaam 'kal ki appointments' ki list
print karti hai (naam, samay, mobile, alerts ke label) aur file me rakhti hai, taaki app
band ho tab bhi agla din chal sake. Paper kit: naye patient ka form (consent line ke
saath), appointment sheet, parche ka pad, receipt book (alag series, baad me app me
late entry). Done jab: sister ne ek nakli band-app din paper se chalaya.
9.2.4 Downtime runbook (M). Ek page, decision tree: (1) app nahi khul raha:
Cloudflare status aur apna dashboard dekho, (2) Error 1027: quota, (3) D1 error: Time
Travel, (4) kharab deploy: pichhle version par rollback (Workers versions, rollback ka
tareeka test karke likho), (5) Cloudflare ya internet band: paper mode, (6) domain ya
DNS: registrar. Har kadam par kaun, kitni der me, phone numbers. Band hone ke baad
paper ke records 24 ghante me 'late entry' ke label ke saath (seva ki tareekh aur entry
ki tareekh alag). Done jab: drill me developer ne kharab deploy ka rollback 5 minute me
kiya.
Dental clinic software: ultra detail build plan
Page 83 of 150

9.3 Security aur privacy
9.2.5 Uptime aur error alerts (S). 8.8.5 ka monitor, aur server errors ka ek error_log
(patient ka text hatakar, 30 din) jisse spike par alert, browser ke JS errors ek chhote
rate-limited endpoint par. Koi third-party error tracker nahi (error me patient ka data
ja sakta hai). Done jab: nakli error spike par alert aaya, aur log me koi naam ya number
nahi (grep test).
9.3.1 Threat model (M). Teen jagah (staff app aur patient portal /my, gateway aur
webhook, backups aur CI) par 'kaun, kya, kaise bigaad sakta hai' ki list, top 15 khatre,
har ek ka bachav aur kaun dekhta hai. Repo me ek page. Done jab: har khatre ke
saamne task number ya 'sweekaar kiya jokhim'.
9.3.2 Dependencies aur supply chain (M). Lockfile, pnpm audit  CI me, Dependabot,
GitHub Actions ko SHA se pin karna, workflows me kam se kam permissions , naya
package jodne se pehle kaaran (size aur maintenance), CI me install scripts band jahan
ho sake. Secret scanning ke liye gitleaks (CI aur pre-commit). Done jab: ek jaanboojh
kar daali hui nakli key CI pakadti hai.
9.3.3 Secrets ki list aur rotation (S). Sab secrets ki ek table (Cloudflare tokens:
deploy, backup, analytics; Worker secrets: pepper, HMAC keys, gateway login,
webhook key, Turnstile, Brevo; GitHub secrets; B2 keys; Healthchecks URLs): kaun sa
kahan, kitni permission, kab badla. Har ek sabse kam permission wala, 6 mahine ka
rotation calendar me. Done jab: ek secret badlne ka drill, system chalta raha.
9.3.4 Access review (S). Har 3 mahine: Cloudflare, GitHub, Access ke teen emails, B2,
domain registrar, Google profile par kaun hai; jo nahi chahiye hataao. Har jagah 2FA aur
recovery codes kagaz par. Done jab: ek table me har account, malik, 2FA, aakhri review.
9.3.5 Staff app ki suraksha (M). Access JWT jaanch ke tests (galat aud , issuer, expiry,
algorithm), staff SPA ki CSP, Access ka session samay (kaam ke din jitna, 8 se 12
ghante), idle par screen lock, bhaari endpoints par rate limit, export aur bulk print sirf
doctor ko aur audit me. Patient list ka poora export receptionist ke liye nahi, search 25
results se zyada nahi deta. Done jab: tests me galat token, purana token aur receptionist
ka export teeno fail.
9.3.6 Audit log ki akhandta (M). audit_log  sirf jodne wala: har row me pichhli row ka
hash (chhed-chhad dikhe), raat ko jaanch ka job, backups me shamil. Agar D1 triggers
chalte hain (3.2.6 ka test) to UPDATE aur DELETE database level par roko, warna sirf
app level. Done jab: ek row haath se badalne par raat ka job use pakadta hai.
Dental clinic software: ultra detail build plan
Page 84 of 150

9.4 Speed aur bharosa
9.3.7 Pen-test-lite (L). OWASP ZAP baseline staging par, 8.4.1 ke manual tests dobara,
mile hue issues theek. Bahar ka paid pen-test budget me nahi, usko 'baad me, agar
patients badhein' likho. Done jab: ZAP me koi high issue nahi, aur medium ke saamne
faisla.
9.3.8 Privacy readiness (M). Checklist: notice (8.10.1), consent records (2.1.9),
purposes, retention table (9.3.10), anurodh ka process (8.2.11), breach plan (9.3.9),
published contact (Rule 9), bachchon ka data (guardian ki sahmati, clinic ke liye
chhoot ka asli text padhna), processors ki list (Cloudflare, Backblaze, Brevo, SMS
gateway, GitHub, Healthchecks) aur har ek kya dekhta hai, data ka sthan (D1 India me
pin nahi ho sakta, upar ke sources) aur uska notice me zikr, vendors ki shartein
padhna. Kisi aise vyakti ko dikhao jo DPDP samajhta ho. Done jab: ek page 'taiyari ka
haal' jisme har line par haan, nahi ya baaki.
9.3.9 Breach response plan (S). Ek page: pata chalna, rokna (portal band, SMS band,
secrets badlo, 7.2.10 ka kill switch), jaanchna (kiska data, kitna), batana (prabhavit
logon ko bina der saadi bhasha me, Board ko pehle turant aur 72 ghante me vistrit,
Rule 7), likhna. Contact list aur patient notice ka draft. Ek baar tabletop drill. Done jab:
drill me 30 minute me contain ke kadam aur notice ka draft ban gaya.
9.3.10 Retention aur purge (M). Retention table: clinical records kam se kam 3 saal
(DCI 3.3.1), clinic ki policy likho (IDA 8 saal suggest karta hai, meri jaankari); outbox 1
saal, message_attempts 90 din, webhook_receipts 3 din, otp_requests 1 din, expired
sessions, portal_access_log 1 saal, message_inbox 30 din, callback requests band
hone ke 30 din baad, rate_limits har ghante, audit_log rakho, backups lifecycle. Purge
cron branch me row limit ke saath, 'legal hold' flag jahan vivaad ho. Done jab: nakli
clock se tests, aur purge ke baad ginti theek.
9.4.1 Load test (M). k6 ya autocannon se staging par 5 guna load (staff aur portal),
CPU time (10 ms), D1 ka samay, rows read; ek poore din ka nakli use aur 'quota budget'
table ko asli naap se bharna. Done jab: table me har feature ka naap, aur kahin seema
ke 50% se upar to uska plan.
9.4.2 Slow queries (S). Top 30 queries par EXPLAIN QUERY PLAN , indexes, N+1 hatana,
har screen ka rows-read budget (jaise patient page 300, calendar 500). Done jab: har
screen ka budget CI test me.
9.4.3 Logs ka niyam (S). Structured logs, koi PII nahi, levels, Workers Logs ki seema
(free par roz 200k lines aur kam retention, pehle verify kiya) ke andar. Done jab: grep
test me koi naam, mobile ya OTP nahi.
Dental clinic software: ultra detail build plan
Page 85 of 150

9.5 Documentation, training, support
Mat karo (Phase 9)
Backup ko bina restore kiye 'theek' mat maano.
Asli patient data staging ya kisi shared machine par mat laao. Restore drill sirf
developer ke encrypted laptop par, aur baad me hatao.
age  ki private key, B2 ya Cloudflare ke tokens repo, chat ya email me mat rakho.
9.4.4 Failure drills (M, baad me). D1 na mile, gateway band, R2 error, Access galat set:
har ek me UI saaf message deta hai aur kuch toot ta nahi. Done jab: 4 drills ka record.
9.4.5 Asli devices (S). Clinic ke PC ka asli browser aur OS par staff app, clinic ka asli
printer par parcha, bill aur receipt print, kam bandwidth. Done jab: ek table me har
cheez par pass.
9.5.1 README aur architecture (M). README, architecture ka ek page, decision
register ka final roop, runbooks ki list, 'naye developer ke liye pehla din' page (taaki
sab kuch ek insaan ke sar par na rahe). Done jab: kisi dost developer ne sirf README
se local chala liya.
9.5.2 User manual (L). Hinglish me screenshots ke saath, doctor aur receptionist ke liye
alag: roz ka kaam, naya patient, appointment, visit, parcha, billing, din band, backup ka
haal, 'kuch gadbad ho to' (runbook ka saar). In-app samjhaish (6.5.6) ke saath milaakar.
Done jab: receptionist ne bina developer ke ek poora din manual dekhkar chalaya.
9.5.3 Training (M). Do sessions 90 minute ke, mock din, ek page ka cheat sheet print.
Done jab: receptionist aur doctor ne mock din bina madad ke pura kiya.
9.5.4 Support ka process (S). App me 'problem batao' button (page ka naam aur
samay jata hai, patient ka data nahi), developer ka WhatsApp, pehle mahine me clinic
ke samay me jawab ki koshish 2 ghante me, bugs ki ek list, release notes saadi bhasha
me, deploy sirf clinic ke baad ya ravivaar. Done jab: ek nakli problem se developer tak
pahunchne me 1 minute.
9.5.5 Release process (M). Local, staging, production alag. CI: lint, typecheck, unit,
integration, e2e (Playwright) staging par, migrations check, deploy GitHub Actions se
hath ki manzoori ke baad, version tags, changelog, rollback. Phase 1 ke pipeline ke
upar. Done jab: ek test release poore raste se gaya aur rollback bhi.
9.5.6 Chhote videos (M, baad me). 8 videos 2 se 3 minute ke (naya patient,
appointment, parcha, bill, din band, backup ka haal, password reset, paper mode).
Done jab: receptionist ne dekhkar ek kaam bina puchhe kiya.
Dental clinic software: ultra detail build plan
Page 86 of 150

Sab kuch ek account ya ek insaan par mat chhodo (do log, recovery codes).
Production me destructive migration ek deploy me mat chalao.
Clinic ke samay me deploy mat karo.
Third-party error tracker ya analytics me patient ka data mat bhejo.
Audit log ko kabhi edit ya delete mat karo.
Time Travel ko akela backup mat maano (7 din, Cloudflare ke andar hi).
Paper mode ke records ko bina 'late entry' label ke system me mat daalo.
Phase 9 ka gate
Restore drill 1 (B2 se) aur 2 (Time Travel) pass, aur restore ka asli samay likha.
Kharab dump upload nahi hota, aur backup band hone par 3 ghante me alert aur
dashboard par laal.
B2 par 7 din ke dumps, PC par 3 hafte ki copies, aur R2 se B2 files ka check, teeno ka
saboot.
Do log decrypt kar sakte hain, aur keys ki table hai.
Quota alert ka test pass, downtime drill me rollback 5 minute me, aur sister ne ek nakli
band-app din paper se chalaya.
Threat model, secrets ki list, access review aur privacy readiness page poore, aur
breach drill ek baar hua.
ZAP baseline me koi high issue nahi, load test me CPU 10 ms ke andar aur har screen
ka rows-read budget ke andar.
Manual aur training ho gayi, aur receptionist ne mock din kiya.
Phase 10: Pilot aur go-live (kagaz se software par, bina clinic roke)
Ab tak software banaya aur jaancha. Ab use asli clinic me chalana hai. Is phase me sabse
bada khatra code nahi, badlaav hai: ek bhi patient chhute nahi, ek bhi bill gire nahi, aur
kuch bigde to ek din me kagaz par wapas aa sakein. Isliye badlaav kadam-kadam se hota
hai, aur har kadam par saaf likha hota hai ki asli record kaun sa hai (kagaz ya software).
Dono ko ek hi samay asli maanna sabse bada jhagda banata hai.
Clinic ka samay bhi ginna hai (meri andaaz, sister se poochho): Stage 1 me receptionist ko roz
lagbhag 30 minute extra, doctor ko 10 se 15 minute, aur hypercare me roz 10 minute ka
check-in. Ye developer ke ghanton me nahi ginta, par sister ko pehle batana zaroori hai,
warna beech me thakaan aati hai.
Dental clinic software: ultra detail build plan
Page 87 of 150

Stages ek nazar me
Roz kitne patients aate hain ye sister se poochho. 100 naye per mahine ka matlab 4 se 5
naye per din, purane milakar roz 10 se 15 ho sakte hain (meri andaaz). To 2 hafte ke shadow
me sirf 100 se 150 patient-visits dikhte hain, aur itne kam namune me kai galtiyan chhup
jaati hain. Isliye Stage 1 aur 2 milakar 3 se 4 hafte rakhe hain, jabki aam guides bade
practices ke liye 1 se 2 hafte kehte hain (easehealth).
Pakka kya hai aur anuman kya hai
Pakka (padha hua, link ke saath):
HealthIT.gov go-live ke liye checklist deta hai aur patients ke liye notice lagane ko
kehta hai taaki wo dhairya rakhein. Uska NLC checklist chaar hisson me hai: planning,
kuch din pehle, pichhla din aur go-live ka din.
Physitrack ki guide (physiotherapy software vendor ka blog, isliye saavdhaani se):
parallel test na karne se scheduling, notes aur billing me chhoti galtiyan badh jaati
hain; rollback plan na ho to staff ke paas surakshit rasta nahi bachta; data adhoora ho
to cutover rokne ka likha hua maapdand chahiye; busy samay me go-live na karo; ek
super-user banao; aur parallel me tay karo ki asli record kaun sa hai.
Stage Avadhi Asli record Software me kya
hota hai
Patient ko kya
milta hai
Messaging
0 Taiyari 1 se 2
hafte
kagaz staging par mock din kagaz band
1 Shadow 2 hafte
(10 kaam
ke din)
kagaz (register,
parcha, receipt)
appointments turant,
baaki din ke ant me,
bills S  series me
kagaz dry_run
2 Software-
lead
1 se 2
hafte
parcha aur
appointments:
software. Paise:
kagaz receipt book
live entry, bills abhi
bhi S  series me,
milaan ke liye
software ka
parcha, kagaz
ki receipt
day-before
reminder live, sirf
consent walon ko
3 Cutover 1 din sab software live series shuru software ka
parcha aur
receipt
live
4
Hypercare
2 hafte software, kagaz sirf
downtime ke liye
roz milaan wahi live
5 Samiksha 4 hafte software haftawar milaan wahi live
Dental clinic software: ultra detail build plan
Page 88 of 150

Purane kagaz charts ke aam raaste: sab scan karo, sirf zaruri scan karo, ya patient ke
agle visit par allergy, dawa aur problems naye system me daalo (TMA, OpenEMR wiki,
PCC). Ye sab US ke source hain, aur chhote clinic ke liye aakhri raasta sasta hai.
Ek research table (PMC) go-live ke dauran clinic ki capacity kam karne ko kehti hai.
DCI Code 2014, 3.3.1: records kam se kam 3 saal rakhne hain, isliye kagaz cards phenko
ya jalao mat (pehle ke sources se).
DPDP ke operational niyam 13 May 2027 ke baad lagu hote hain (sources me 12 ya 13
May, Phase 8 dekho). Asli patients ka asli data aate hi notice, consent aur breach plan
taiyar hone chahiye.
Anuman (meri soch ya vendor blog ka sanket):
Ek consultancy blog go-live ke baad 2 se 4 hafte me 10 se 25% productivity girne ki
baat karta hai, aur uska doosra lekh duplicate patients ka aam 8 se 12% likhta hai. Dono
US ke bade practices ke sanket hain, chhote clinic ka data nahi.
3 se 4 hafte ki parallel avadhi, receptionist ka 30 minute extra, 20 se 30% kam booking,
aur rollback ka 'agle kaam ke din se kagaz par': sab meri soch.
Raftaar ke targets (naya patient 2 minute, purane ka check-in 30 second, din band 15
minute): pehle kagaz ka baseline naapo (10.1.4), phir ye badal sakte hain.
Pilot ke bugs ka buffer (12 aur 12 ghante): meri soch, kyunki asli use me hamesha kuch
milta hai.
10.1 Taiyari (Stage 0)
10.1.1 Go/No-go ke niyam (S). Cutover ki tareekh tay karne se pehle likh lo ki kab 'haan'
hai aur kab 'ruko': Phase 1 se 9 ke gates pass, restore drill hua, koi khula P0 ya P1 bug
nahi, pre-load ka sample check pass (10.1.9), dress rehearsal pass (10.1.11), privacy
notice ka version live (10.1.14). Faisla sister aur developer milkar karte hain, aur 'ruko'
ka matlab tareekh khisakna hai, kuch kam karke chalu karna nahi. Done jab: ek page
decision register me aur sister ne padh kar sign kiya.
10.1.2 Tareekh aur calendar (S). Pehle chhutti, tyohaar, sister aur receptionist ki
chhutti aur developer ki availability dekho. Shuru Monday ko (developer poora hafta
paas rahe aur Sunday ko backup dekha ja sake), kam bheed wale hafte me, aur 6 hafte
tak kisi ki lambi chhutti nahi. Tareekhein ek table me (Samay aur mehnat section ki
tarah script se nikalo). Done jab: calendar me teen tareekhein (shadow shuru,
software-lead shuru, cutover) aur sister ne manzoor kiya.
Dental clinic software: ultra detail build plan
Page 89 of 150

10.1.3 Zimmedaari aur backup user (S). Ek table: receptionist (super-user: roz ka kaam
aur milaan), doctor (parcha templates, clinical content, publish ke faisle), developer
(fixes aur nigrani), aur faisla karne wala ek (sister). Receptionist ki chhutti par kaam
chalane ke liye ek backup user (sister ya parivar ka koi) ko training do aur Access me
uska email jodo. Do line ke gopniyata niyam: screen kisi ko mat dikhao, patient ka data
WhatsApp par mat bhejo, computer chhodte waqt lock. Done jab: table bhari hui aur
backup user ne ek appointment aur ek bill bina madad ke kiya.
10.1.4 Kagaz ka baseline naapo (S). Kisi ek din stopwatch se 10 patients par naapo:
naya patient register karne me, purane ka record nikalne me, parcha likhne me, bill aur
receipt banane me, aur din band karke jod lagane me kitna samay. Saath me roz kitne
naye aur purane patients aate hain aur kitne no-show. Ye software ke 'tez' hone ka
saboot banega. Done jab: ek chhoti table me paanch samay aur roz ka patient count.
10.1.5 Hardware, bijli aur internet (M). Clinic ke computer par browser ka naya version
aur auto-update, print ke liye popups allow, asli parche ke kagaz par print test
(preview aur asli print ka milaan), UPS ya inverter router aur computer ke liye (bijli jaye
to bhi 15 minute chale, meri soch), internet ka backup (phone hotspot ya doosra
connection, test karke), Wi-Fi password aur router ki jagah, spare keyboard aur
mouse. Computer ka clock IST, screen lock ka samay, Windows update ka samay clinic
ke baad. Done jab: checklist par har line tick aur bijli band karke 15 minute kaam chala.
10.1.6 Phone aur SIM ki taiyari (S). Phase 7 ka Android phone: alag SIM (sirf SMS ke
liye), recharge ka plan aur tareekh calendar me, charger hamesha laga, battery
optimization band, app ka auto-start, phone clinic me surakshit jagah par aur signal
check. Done jab: dashboard par gateway 3 din bina ruke 'online' dikha.
10.1.7 Purane patients ka faisla (S). Teen raaste (aam tareeke, upar ke sources): A sirf
agle visit par bharo, B sirf zaruri logon ko pehle bharo (agli 30 din ki appointments aur
jinka ilaaj chal raha hai), C poori list ek saath. Meri salaah: A aur B milakar (B cutover se
pehle, A baaki sab ke liye), kyunki poori list ki typing me kai din lagte hain aur galtiyan
badhti hain. C sirf tab jab A me dikkat aaye (10.5.5). Done jab: sister ne A aur B
manzoor kiya aur B me kitne cards aayenge ka andaaz likha.
10.1.8 Pre-load ka data taiyar karna (M). B ke liye ek sheet, sirf developer ke
encrypted laptop par (kisi cloud, WhatsApp ya email me nahi): naam, mobile, umar ya
janmatithi, pata, chal rahe ilaaj ki ek line, agli appointment (tareekh aur samay). Kagaz
se likhne me receptionist ya sister madad karte hain. Mobile ke liye 7.7.2 ka function,
duplicates mobile se. Ek column 'privacy notice diya gaya' ka, jiske bina SMS reminders
off. Done jab: har row me valid mobile ya 'mobile nahi' likha aur duplicates 0.
Dental clinic software: ultra detail build plan
Page 90 of 150

10.1.9 Pre-load ka dry run aur sample check (M). Developer ke laptop par local
database me import ka dry run (asli data kabhi staging me nahi): invalid mobile,
duplicates, bahut lambe naam, special characters pakdo. Phir 50 random rows kagaz
se milao: mobile 100% sahi, naam me chhoti spelling ki galti 2 se kam (meri soch). Phir
wahi import production me staff app ke import se, audit ke saath. Aakhir me laptop se
sheet aur local database secure delete. Done jab: sample check pass aur production ki
ginti sheet ki ginti ke barabar.
10.1.10 Mock din ki scenarios (S). 30 scenarios ki list: naya patient, purana, bina
appointment ka walk-in, emergency (beech me ghusana), late aaya, no-show,
reschedule, ek mobile par do log (maa aur bachcha), naam ki alag spelling, adhoora
payment aur baaki, bill radd, galat entry sudhaarna, parcha dobara print, X-ray note,
doctor ka din band, bijli jana (paper mode), SMS band hona, aur baaki. Har scenario ka
expected result. Done jab: list repo me aur har line ka expected result likha.
10.1.11 Dress rehearsal (M). Staging par nakli data ke saath ek poora din: doctor aur
receptionist 30 scenarios chalate hain, timer ke saath, SMS dry_run , asli printer par
print, aakhir me din band aur milaan. Developer sirf dekhta hai, madad nahi karta. Jo
atka wo bug ya manual ki line. Done jab: 30 me se kam se kam 28 scenarios bina madad
ke pass, aur baaki ke fix ya workaround likhe.
10.1.12 Patients aur staff ko soochna (S). Desk par chhota notice ('hum naya computer
system shuru kar rahe hain, thoda samay lag sakta hai, dhanyavaad'), staff ki 15 minute
ki briefing (kya badal raha hai, kab, kisko poochna), aur receptionist ka ek line ka script.
Done jab: notice chhapa aur briefing hui.
10.1.13 Booking load ka plan (S). Pehle 2 se 4 hafte me bookings thodi kam: har 3 se 4
appointments ke baad ek khali slot ya roz 20 se 30% kam (meri soch, research ke
sanket ke hisaab se), naye patient ko 10 minute extra, aur doctor tay karta hai ki kab
normal. Done jab: doctor ne plan manzoor kiya aur appointment book me slot ka niyam
set.
10.1.14 Privacy aur consent taiyari (S). Privacy notice ka version fix (8.10.1), A5 par
chhapa hua aur QR ke saath; receptionist ke liye consent ka script (notice dikhao, SMS
reminders ke liye alag haan ya na, portal baad me); consents  me entry (method:
paper ya verbal); bachche ke liye guardian. Done jab: mock din me 5 patients ka
consent record bana aur notice ka version number kagaz aur system me ek hi.
Dental clinic software: ultra detail build plan
Page 91 of 150

10.2 Parallel run (Stage 1 aur 2)
10.2.1 Shadow mode ki jaanch (M). Setting go_live_mode  (shadow ya live), jo doctor
ki confirmation se badalti hai aur dono taraf badal sakti hai (audit ke saath). Shadow
me: bills aur receipts S  series me, 'SHADOW, patient ke liye maanya nahi' watermark
ke saath, kabhi real series me nahi, aur monthly report, CA export, portal aur SMS me
nahi; dashboard me unke paise alag 'Shadow' naam se dikhte hain (milaan ke liye) aur
patient ginti normal dikhti hai. Messaging dry_run , portal band. Done jab: 6 tests
(numbering, report, CA export, portal, SMS, watermark) pass aur mode badalna audit
me dikhta hai.
10.2.2 Stage 1: shadow entry ke niyam (S). Kagaz hi asli hai: register, parcha, receipt
book. Appointments booking ke samay hi software me bhi (1 minute); baaki sab
(patients, visits, bills) receptionist din ke ant me ya khali samay me bharti hai, patient ke
saamne nahi, 30 minute ke budget me (meri soch; zyada lage to wajah likho, wo
software ki dikkat hai). Doctor patient ke saamne software nahi chalata. Jo bhi patient
aaye uska notice aur consent abhi se (10.1.14). Done jab: niyam ek page me desk par,
aur pehle din ki entry 30 minute me poori hui ya wajah likhi.
10.2.3 Roz ka milaan (M). Din ke ant me 5 minute, teen cheezein: (1) kagaz register ki
ginti = software ki 'aaj ke patients' ginti, (2) kagaz receipt book ka jod = software ka
'Shadow' jod (paise me), (3) kal ki appointments ki kagaz diary = software ki list. Fark
ho to jaane se pehle karan dhoondho. Done jab: ek kagaz 'milaan sheet' (tareekh, teen
ginti, fark, karan, receptionist ka sign) aur 5 din lagatar fark 0 ya samjha hua.
10.2.4 Fark ki list aur karan (S). Har fark ek line me: tareekh, P-code (naam nahi), kya
fark, karan (entry bhool gayi, galat rakam, duplicate, galat patient, software bug, ya
kagaz ki galti), kisne theek kiya. Hafte ke ant me developer karan ke hisaab se ginti
nikalta hai aur 'software bug' wale alag karta hai. Done jab: hafte ki ginti ki table aur
sab 'software bug' issues bug list me.
10.2.5 Bug ki priority aur hotfix niyam (S). P0: ilaaj rokta hai, data khota hai ya paise
galat: usi din theek, ya pehle paper mode. P1: kaam hota hai par dheema ya galat dikhta
hai, workaround ke saath: 48 ghante. P2: dikhne ki kami: haftawar. Deploy sirf clinic ke
baad (subah 8 se pehle ya raat 8 ke baad), har fix ke saath rollback, pilot me naye
features nahi. Known issues ki ek sheet desk par workaround ke saath. Done jab:
niyam desk par aur ek nakli P0 ka poora raasta (report, fix, deploy, check) 2 ghante me
hua.
10.2.6 Doctor ka parcha trial (M). Stage 1 me doctor roz 3 se 5 patients ka parcha visit
ke baad software me bana kar dekhta hai (patient ko kagaz wala hi diya jaata hai). Jo
dawai, dose, timing ya template na mile uski list banti hai aur doctor ya developer
Dental clinic software: ultra detail build plan
Page 92 of 150

settings me jodte hain (Phase 4 ki editable list). Dekho ki parcha kagaz se zyada
samay to nahi leta aur print kagaz par theek aata hai. Done jab: ek hafte ke parchon me
se 90% ki dawaiyan software list me mili (meri soch), aur ek parcha asli printer par
kagaz wale se line-by-line mila.
10.2.7 Messaging dry-run ka milaan (S). Shadow me MESSAGING_MODE=dry_run :
system likhta hai ki 'live hota to kal ke liye ye N messages jaate'. Receptionist us list ko
kagaz diary ki kal ki appointments se milati hai (galat samay, galat number, bina
consent wale). 7 din fark 0 ho to Stage 2 me live. Done jab: 7 din ke milaan, sab farak
samjhe hue, aur gateway log me allowed_test_numbers  ke alawa koi asli SMS nahi.
10.2.8 Stage 2 shuru karne ka faisla (S). Checkpoint 1 (kam se kam 10 kaam ke din
baad): 5 din lagatar milaan me fark 0 ya samjha hua, koi khula P0 ya P1 nahi, dry-run list
sahi, doctor ne parcha trial pass maana, receptionist ne kaha ki entry ka samay
sambhalne laayak hai. Na ho to Stage 1 ek hafta aur. Done jab: checkpoint ka ek page
sign ke saath, ya 'ek hafta aur' ka karan.
10.2.9 Stage 2 ke niyam (S). Software-lead: appointments aur parcha software se
(parcha print karke patient ko), receptionist patient ke saamne check-in karti hai, doctor
visit software me. Paise: receipt abhi bhi kagaz ki book se (asli) aur software me S  bill
saath me bante hain taaki jod milte rahein. Kagaz register me ek line per patient
(naam, rakam) backup ke liye. Day-before reminders live, sirf unko jinhone SMS ka
consent diya (Phase 7 ke niyam). Done jab: niyam desk par aur pehle din ke ant tak
paise ka milaan 100%.
10.2.10 Raftaar ki jaanch (S). Stage 2 ke 5 din 10.1.4 ke naap dobara aur kagaz se tulna:
naya patient 2 minute ke andar, purane ka check-in 30 second ke andar, din band 15
minute ke andar (meri targets; baseline dekh kar badlo). Jo screen dheemi usko top 3
me fix. Done jab: tulna ki table aur top 3 fix, ya sister ne samay ko theek maana.
10.2.11 Haftawar review (S). Har hafte 30 minute: doctor, receptionist aur developer. Kya
atka, kya dheema, kya samajh nahi aaya, top 5 fixes, aur 'agle hafte aage ya ruko'. Faisle
decision register me. Done jab: har review ke notes me top 5 aur owner likha.
10.2.12 Asli data ke saath restore drill (M). 2 hafte asli entries ke baad: B2 ka latest
dump developer ke encrypted laptop par restore (9.1.7 jaisa), invariants, row counts, 5
patients ka record, samay naapo, phir laptop se hatao. Done jab: restore pass aur
samay Phase 9 ke naap se mila ya farak likha.
10.2.13 Pilot ke bugs aur UX fixes ka buffer (XL, buffer). Stage 1 aur 2 me jo bugs,
galat jodna aur 'ye samajh nahi aata' wali baatein milengi unka fix. 12 ghante meri soch,
kyunki asli use me hamesha kuch milta hai. Kam laga to bacha samay Phase 11 me jaata
hai. Done jab: sab P0 aur P1 band, P2 ki list Phase 11 backlog me.
Dental clinic software: ultra detail build plan
Page 93 of 150

10.3 Cutover (Stage 3, ek din)
10.3.1 Cutover checklist (M). Teen chhoti checklists (HealthIT.gov ke tareeke se: kuch
din pehle, pichhla din, din ka din). T-7: go/no-go (10.1.1), restore ka ek aur sanity check,
paper kit print, notices. T-3: pre-load top-up, staging me aakhri mock, release freeze. T-
1: backup aur Time Travel bookmark ka note, phone aur SIM check, saare logins
(Access ka one-time PIN email aa raha hai, test karke), printer. T-0: subah ke checks.
Har line par kaun aur tick. Done jab: teeno checklists repo me aur T-7 ki dry-run ek baar
hui.
10.3.2 Pre-load top-up (S). Cutover se pehle ke 2 din: agli 30 din ki appointments
(kagaz diary se) aur naye ilaaj wale patients ka update, software ki list ka printout, aur
use kagaz diary ke saath milao. Done jab: dono list ek jaisi (ya samjhe hue farak) aur
receptionist ne sign kiya.
10.3.3 Counters aur live switch (S). Kagaz receipt book ka aakhri number likho aur
uske page ki photo lo (patient ka naam nahi dikhna chahiye). Software ke live series ka
prefix kagaz se alag rakho taaki dono ke numbers kabhi na takrayein (Phase 5 ke
counters; meri salaah). go_live_mode  ko doctor ki confirmation se live karo (audit).
Done jab: pehla live receipt tay number se bana, naya S  receipt ab nahi banta (test),
aur aakhri kagaz number decision register me.
10.3.4 Messaging live (S). MESSAGING_MODE=live  pehle 2 din sirf day-before
reminders ke liye, phir baaki (recall aur follow-up, Phase 7) jab 7 din theek. Check:
consent, quiet hours, daily cap, SIM balance, STOP reply, delivery report, aur kill switch
ek baar dabakar test. Done jab: pehle 20 messages me galat number 0, status sahi, aur
kill switch 1 minute me band karta hai.
10.3.5 Cutover din ka runbook (M). Ghante-ghante: 08:00 developer clinic me, saare
device login, printer, phone online, dashboard; 09:00 clinic khulta hai aur pehla patient
developer ke saamne; pehle din poora, doosre aur teesre din aadha din; 13:00 chhota
check-in; din ke ant me day close, milaan, aur agle subah 'aakhri backup' card theek
(raat 02:30 ka export). Ek page 'kuch bigde to': kaun call kare, kya karo, kab paper
mode. Done jab: runbook ek page me aur T-1 par developer ne use mock me padha.
10.3.6 Rollback plan aur drill (M). Rollback ka matlab 'rok do aur kagaz par wapas',
software ka data nahi mitana. Trigger (pehle se likhe): ek din me paise ki galti do baar,
data khona, 30 minute se zyada kaam na chalna aur workaround nahi, doctor ka
'surakshit nahi', ya milaan ka fark 2 din tak samajh na aana. Kadam: paper mode (9.2.3 ki
kit), decision register me tareekh aur wajah, software me jo entries ban chuki hain
waise hi rakho, jo kagaz par bani unhe baad me 'late entry' label se daalo, aur patients
ko mil chuki live receipts valid rehti hain. Dobara cutover tabhi jab wajah theek ho.
Dental clinic software: ultra detail build plan
Page 94 of 150

10.4 Hypercare (Stage 4, 2 hafte)
Rollback agle kaam ke din se (meri soch). Done jab: staging me mode live se shadow
wapas gaya, receptionist ne paper kit se ek mock ghanta chalaya, aur trigger list sister
ne sign ki.
10.3.7 Kagaz kit aur receipt book band karna (S). 9.2.3 ki paper kit desk par (naye
patient form, appointment sheet, parche ka pad, downtime receipt book alag series).
Kagaz ki purani receipt book ke aakhri page par 'is tareekh se software' likh kar sign,
aur register me ek band-entry. Kagaz kabhi phenko mat (DCI 3.3.1). Done jab: kit desk
par, receipt book signed, register ki band-entry likhi.
10.4.1 Developer ki maujoodgi (S). Pehle 3 din clinic me (poora, aadha, aadha), phir 14
din tak clinic ke samay me 15 minute me jawab (call ya WhatsApp), raat ke liye 'sirf P0'
ka raasta, aur ek dost developer ka naam jo runbook dekh kar rollback ya restore kar
sake. In 2 hafton me developer ki chhutti ya travel nahi. Done jab: schedule desk par
aur dost ne runbook se ek rollback dry-run padha.
10.4.2 Roz ka chhota check-in (S). Din ke ant me 10 minute: aaj kya atka, kya dheema
laga, kisi patient ko dikkat, kal ka plan. Notes me sirf P-code. Done jab: 14 din ke notes
aur top issues ki list.
10.4.3 Milaan jaari (M). 14 din roz, phir 4 hafte haftawar: patient ginti, paise ka jod,
appointments. 6.6.2 ke hisaab se 7 din kagaz register ki ginti dashboard se milao. Done
jab: 10 kaam ke din lagatar fark 0 ya samjha hua (exit criterion) aur 6.6.2 ka 7 din ka
check pass.
10.4.4 Change freeze aur hotfix window (S). Hypercare me naye features nahi, sirf P0
aur P1 fix; deploy sirf subah 8 se pehle ya raat 8 ke baad; har deploy ke baad 3 minute
ka smoke test (login, naya patient, appointment, parcha print, bill); aur har deploy ki ek
line ki release note desk par. Done jab: 14 din me har deploy ka smoke test record.
10.4.5 Nigrani (S). Roz subah 5 minute: Workers requests aur errors (quota monitor
9.2.1), D1 rows read aur written, 'aakhri backup' card, gateway online, error_log me
spike, Healthchecks sab green. Pehle hafte ke asli numbers 'quota budget' table me
likho aur 9.4.1 ke naap se tulna karo. Done jab: roz ka ek tick sheet aur pehle hafte ke
asli numbers table me.
10.4.6 Patient ki shikayat aur galat message (S). Galat reminder, galat bill ya galat
number gaya to: receptionist ki ek line ki maafi ki script, galti ka P-code ke saath record,
aur wajah ki jaanch 24 ghante me. Kisi ne SMS band karne ko kaha to turant consent
Dental clinic software: ultra detail build plan
Page 95 of 150

10.5 Purane kagaz ke records (lazy migration)
withdrawal (Phase 7). Privacy se judi shikayat usi din developer ko (9.3.9 ka breach
plan jaanch ke liye). Done jab: script desk par aur ek nakli shikayat ka poora raasta 24
ghante me band.
10.4.7 Portal pilot shuru (S). Jab 2 stable hafte ho jaayein (milaan sahi, koi P0 nahi):
Phase 8 ka 8.4.4 pilot, pehle staff aur parivar phir 10 consenting patients. Portal me
kuch bigde to sirf portal band (activation toggle), baaki software chalta rahe. Done
jab: 8.4.4 ka gate (10 me se 8 login).
10.4.8 Hypercare ke fixes ka buffer (XL, buffer). Hypercare ke 2 hafton ke P0 aur P1
fixes. 12 ghante meri soch. Done jab: sab P0 aur P1 band, baaki Phase 11 backlog me.
10.5.1 Migration ka niyam (S). Purana patient agli baar aaye to: receptionist mobile se
search karti hai; na mile to quick-add (P-code), kagaz card par P-code likhti hai aur
'software me' ka tick, doctor ya receptionist ek 'kagaz se history' note bharta hai (allergy
aur medical alerts, chal rahi dawaiyan, card par likhe zaruri pichhle ilaaj), aur card file
me wapas. Agle visits me card ki zaroorat nahi par phenko mat. Done jab: niyam ek
page me aur 10 mock purane patients me har ek 3 minute ke andar.
10.5.2 Quick-add aur 'kagaz se history' (M). Naye record ka chhota form (naam,
mobile, umar ya janmatithi, ling, pata optional), duplicate chetavani (mobile ya naam
aur umar se), aur ek alag note type 'Kagaz se history' jo alag label ('kagaz se, entry ki
tareekh') ke saath dikhta hai taaki doctor ko pata rahe ye nakal hai, asli visit nahi;
finalise ke baad sirf addendum. Purani tareekhein anumanit ho sakti hain (sirf saal).
Done jab: 10 purane patients 3 minute ke andar, duplicate chetavani 5 me se 5 baar
sahi, aur 'kagaz se' note kabhi dashboard ki visit ginti me nahi aata (test).
10.5.3 Kagaz cards ka rakhrakhaav (S). P-code ke kram me almirah, 'migrated' wale
alag, tala, nami aur keede se bachav, aag se door. DCI 3.3.1 ke hisaab se kam se kam 3
saal (clinic ki policy 9.3.10 me), phenkna ya jalana nahi. Done jab: almirah ki photo aur
khoj test: 5 cards 1 minute me mile.
10.5.4 Purane cards ka scan (M, baad me). Sirf chune hue cards (jinka ilaaj chal raha
hai ya doctor ko history chahiye): phone ya scanner se, seedha aur roshni me, file ka
naam P-code aur tareekh, patient record me document ki tarah. Sab cards ka scan nahi
(mehnga aur lamba kaam, upar ke sources). Done jab: 10 cards scan hokar patient
page me dikhte hain aur har page 300 KB se kam.
10.5.5 Poori list ka bulk import (L, baad me). Agar lazy migration me receptionist ko roz
duplicates ya bahut samay lage: pichhle 12 mahine ke patients (lagbhag 1,200, 100 per
mahine ke hisaab se) ki sheet typing (helper se), dry run developer ke laptop par,
Dental clinic software: ultra detail build plan
Page 96 of 150

10.6 Samiksha aur band karna (Stage 5)
dedupe, phir production me audit ke saath. Typing ka samay 1,200 gunaa 2 minute,
lagbhag 40 ghante (meri soch). Done jab: import ke baad 50 random rows kagaz se mili
aur duplicates 0.
10.6.1 30 din ki samiksha (M). Cutover ke 30 din baad: baseline (10.1.4) se ab ke naap,
mahine bhar ki patient ginti dashboard vs kagaz register, paise ka jod, SMS delivered
%, backup record (30 me se kitni raat theek), quota ke asli numbers, bugs (kitne, kitne
P0), staff ka feedback (do sawal: kya pasand, kya khatakta), aur 5 patients se
anaupcharik feedback. Ek page me. Done jab: page doctor ko diya aur 'aage badho ya
kya sudharo' ka faisla likha.
10.6.2 Kagaz register ko 'sirf downtime' banane ka faisla (S). 10 kaam ke din milaan
sahi aur 30 din ki samiksha theek ho to doctor tay karta hai ki kagaz register ab sirf
downtime ke liye hai. Tab kagaz ka roz ka ek-line backup band. Done jab: decision
register me doctor ka sign aur tareekh.
10.6.3 CA ko report dikhana (S). Software ke day-book, monthly report aur receipt ka
format sister ke CA ko dikhao: unhe record ke liye kya chahiye. Meri jaankari me dental
treatment GST se mukt hai (Phase 5 ke sources), par CA ki baat final. Done jab: CA ne
likhit me ya message me bataya kya chahiye aur gaps Phase 11 backlog me.
10.6.4 Data quality audit (M). Duplicate patients (same mobile ya naam aur umar),
bina mobile ke, invalid mobile, orphan records, shadow  rows ka bacha hua data, aur
Phase 5 ke weekly invariants. Jo mile unhe theek karo (merge audit ke saath, kabhi
delete nahi). Target duplicates 3% se kam (vendor blog ke hisaab se aam 8 se 12%,
chhote clinic me kam hona chahiye, meri soch). Done jab: duplicate % likha aur invalid
mobile ki list receptionist ko di.
10.6.5 Safai (S). Developer laptop se asli data ki saari copies (sheet, local database,
restore dumps) secure delete; production me test ya dummy patients aur accounts
hatao; pilot me share hue secrets badlo (9.3.3); staging me asli data nahi hone ka ek
baar check; milaan sheets ek locked file me. Done jab: checklist par har line tick.
10.6.6 Plan vs asli ghante (S). Phase 1 se 10 ke asli ghante plan ke anuman se milao:
kitne guna zyada ya kam, aur baaki Phase 11 ka anuman usi se badlo (Samay aur
mehnat section ka recalibration point). Done jab: ek table aur agle 3 mahine ki yojana
usi par.
10.6.7 Phase 11 backlog (S). Pilot me jo maanga gaya, P2 aur 'baad me' wale items ek
list me: kitna fayda, kitni mehnat, kaun maang raha hai; doctor top 5 chunta hai. Done
jab: list ordered aur top 5 ka anuman.
Dental clinic software: ultra detail build plan
Page 97 of 150

Mat karo (Phase 10)
Go-live ki tareekh pehle tay karke gate ko jhukne mat do ('ruko' ka matlab ruko).
Shadow ke dauran asli patient ko software ka receipt mat do (Stage 2 me bhi paise ki
receipt kagaz ki).
Shadow me live SMS mat bhejo, dry_run  hi.
Kagaz aur software ko ek hi samay 'asli' mat maano; roz likha ho kaun asli hai.
Asli patient data staging, shared machine, WhatsApp ya email me mat bhejo; pre-load
sheet sirf developer ke encrypted laptop par aur baad me hatao.
Pilot ke dauran naye features mat jodo (change freeze).
Clinic ke samay me deploy mat karo (P0 me pehle paper mode).
Kagaz cards, register ya receipt book phenko ya jalao mat (DCI 3.3.1).
Pehle din poori bheed mat lo, booking load kam rakho.
Hypercare ke 2 hafton me developer ki chhutti ya travel mat rakho.
Kagaz aur software ki receipt series mat milao (alag prefix, koi gap ya dohraav nahi).
Bina milaan ke 'sab theek hai' mat maano.
Phase 10 ka gate
Go/no-go ke har line ka saboot aur privacy notice ka version live.
Stage 1 me kam se kam 10 kaam ke din, Stage 2 me kam se kam 5 din, aur cutover ke
baad 10 kaam ke din lagatar milaan me fark 0 ya samjha hua (patient ginti, paise ka jod,
appointments).
Koi khula P0 ya P1 nahi aur rollback drill pass.
Asli data ke saath restore drill (10.2.12) pass, aur cutover ke 30 din me backup kam se
kam 29 raat theek.
Raftaar: naya patient, repeat check-in aur din band baseline se kharab nahi (ya doctor
ne maana).
Doctor aur receptionist ne likhit me 'kagaz ab sirf downtime ke liye' maana, aur CA ki
baat likhi hai.
Safai ki checklist poori aur Phase 11 backlog ordered.
Dental clinic software: ultra detail build plan
Page 98 of 150

Phase 11: Launch ke baad (naye features, ek ek karke)
Yeh phase 'baad me' ka hai: go-live ke baad ke features, jo tabhi banenge jab pilot ka asli
data ya doctor ki maang unhe zaruri dikhaye. Do hisse hain. (1) Pehle se likhe 'baad me'
tasks ka pool (119 ghante, Phase 1 se 10 me bikhra hua), jo theme-wise aur trigger ke saath
uthaya jaata hai. (2) Kuch naye features jo pehle kisi phase me nahi the: perio chart, lab
work tracker, kharcha aur stock, imaging ka agla kadam, digital consent, ABHA/ABDM ka
faisla, badhne ke trigger, aur rajya ke clinic kanoon (CE Act) ka check. Launch ke baad ka
sabse bada khatra naye features ka dher hai: jo feature koi use nahi karta wo bug,
maintenance aur privacy ka bojh ban jaata hai.
Phase 11 ke niyam
Ek samay par ek hi feature (WIP limit 1): pehla khatam, phir agla.
Banane se pehle 'kab nahi banana' likho (kill criteria): jaise 60 din me mahine me 5 se
kam use ho to chhupa do.
Doctor se pehle ek sawal: 'mahine me kitni baar use karogi?' Jawab 'pata nahi' ho to
nahi banana.
Har feature flag ke peeche: pehle sirf doctor ke liye, phir receptionist, phir sab.
Billing numbers, consent aur privacy se judi cheez par poore tests aur 'mat karo' list
pehle.
Pilot ke 30 din baad hi shuru, hypercare me kuch nahi (10.4.4).
Pakka kya hai aur anuman kya hai
Pakka (padha hua, link ke saath):
Perio chart: SDCEP ki baseline charting guidance (Scotland ka clinical guidance, hum
sirf reference lete hain, doctor tay karti hai) har daant ke 6 sites par pocket depth aur
bleeding dekhne ko kehti hai, 4 mm ya zyada wale sites likhne ko, aur furcation,
suppuration, mobility, recession aur missing teeth. Review charting me poora munh
dekhna hai par likhna sirf 4 mm ya zyada aur bleeding ya suppuration wale sites ko
kaafi hai. PSR chart: munh ko sextants me baanta jaata hai aur har sextant ka sabse
kharab naap likhte hain.
Consent: Samira Kohli v. Prabha Manchanda, 2008 (faisla, PMC ki tippani): Supreme
Court ne 'real consent' par zor diya, aur tippaniyon ke hisaab se ek jaanch ya
procedure ki sahmati bade operation ki sahmati nahi hoti. Maine faisle ke hisse aur
tippaniyan padhi, poora faisla nahi.
Dental clinic software: ultra detail build plan
Page 99 of 150

ABDM: HIP/HIU guidelines kehti hain ki provider koi bhi ABDM-compliant software
chun sakta hai aur facility pehle HFR me enroll karti hai, aur ABDM me hissa lene wali
facility ke health professionals ko HPR me enroll hona padta hai. PIB likhta hai ki
ABDM voluntary hai, aur HPR ka FAQ kehta hai ki HPR me enroll karna voluntary hai
(par facility ka management apne professionals ko register karwane ka faisla le sakta
hai). NHA ka clarification (page par original tareekh nahi, last update Jul 2025): ABHA
voluntary hai, patient ke mana karne par ilaaj se inkaar nahi. Jo aadesh mile: medical
colleges (Udaipur Times, Jan 2026, Telangana Today, Jul 2026), aur rajya-level: J&K ke
H&ME vibhag ne 17 Oct 2023 ko single-doctor clinics, labs aur diagnostic centres ko
Clinical Establishments Act aur HFR me register karne ko kaha (Greater Kashmir,
akhbaar ki khabar, order ka original text maine nahi padha). PM-JAY hospitals ke liye
ek vendor blog ABDM status ko incentives se jodta hai aur koi tay national deadline
nahi batata. Centre ka koi aadesh single private dental clinic ke liye mujhe nahi mila
(meri padhai), par rajya ke niyam alag ho sakte hain, isliye apne rajya ka check zaruri
hai (11.7.1).
Viewer: OHIF aur Cornerstone dono MIT licensed hain.
Cloudflare ka paid plan: Workers pricing ke hisaab se kam se kam $5 per mahina, 10
million requests aur 30 million CPU ms included; D1 pricing me 25 billion rows read aur
50 million rows written per mahina included; Workers Logs free me 200,000 per din
aur 3 din ki retention, paid me 7 din; aur D1 FAQ ke hisaab se upgrade se D1 ki limits
aam taur par kuch minute me hat jaati hain.
Anuman (jaanchna hai):
ABDM ke milestones (M1 se M3), 'kam se kam do milestone par sandbox exit' ka niyam
aur samay ke andaaz vendor blogs se hain: Nirmitee ke hisaab se wo niyam NHA ki
integration support team ke ek forum jawab se hai aur official sandbox guidelines ya
FAQ me nahi; Qualysec teeno milestones ke greenfield build ke liye 6 se 9 mahine (M2
akele ke liye 4 se 12 hafte) batata hai. Official test case docs maine nahi padhe. HFR ya
HPR registration ki koi fee maine kisi source me nahi dekhi, isliye 'free hai' pakka nahi.
J&K order ka original text bhi nahi padha, sirf akhbaar ki khabar. Kuch vendor pages
registration ko 'zaruri' jaisa dikhate hain; kisi sarkari source me ye mujhe nahi mila aur
ye PIB ke 'voluntary' se takrata hai, isliye maine use gina nahi.
Touch-screen sign ki kanooni takat: meri jaankari me IT Act electronic signature ko
Aadhaar eSign ya digital signature jaise tareekon se jodta hai aur ungli se banaye
image ka darja pakka nahi. Vakeel se poochho.
Dental clinic software: ultra detail build plan
Page 100 of 150

DICOM header me patient ka naam, Cornerstone ka bhaarapan, attachment level =
pocket depth + recession, bleeding percent ka formula: meri jaankari, doctor aur test
se confirm karo.
Saari seemayein (mahine me 5, 150 naye patients, 70% size) aur ghante meri andaaz
hain.
Pehle se likhe 'baad me' tasks ka pool (Phase 1 se 10)
Yeh tasks apne phase me ginte hain (Samay aur mehnat ke table me dobara nahi). Yahan
unhe theme-wise rakha hai aur batata hai ki kab uthao. Phase 0 ke 'baad me' tasks is ginti
me nahi.
Theme Tasks Ghante Kab uthao (meri soch)
Receptionist ki
raftaar
2.3.9, 2.3.10, 2.3.11, 2.4.5,
2.4.6
11 receptionist roz haath se slot
dhoondhne ya appointments
badalne me samay lagaye
Doctor ki raftaar 3.5.10, 3.6.3, 4.4.4 7 doctor wahi 4 se 5 combo baar-
baar haath se bhare, ya multi-
sitting kaam ka hisaab kagaz par
rakhna pade
Records aur
kanooni kagaz
3.9.1, 3.9.2, 4.4.5, 4.4.7,
4.4.8
13 pehli baar records ki maang aaye
(DCI 3.3.2), ya naqli parche ki
shikayat ho
Paise aur print 5.3.13, 5.3.14 4 lambe plan me kisht chalne
lagein, ya clinic thermal printer le
Dashboard aur
report
6.3.9, 6.3.10, 6.4.3, 6.4.4 8 statuses ka click aadat ban jaye
(2 hafte ka sahi data), ya doctor
mahine ka email maange
Messaging 7.3.5, 7.5.4, 7.5.5, 7.6.1 10 patients ke reply aane lagein, ya
doctor aftercare messages haath
se bhej-bhej kar thak jaye
Portal aur website 8.3.10, 8.3.11, 8.5.5, 8.6.9,
8.6.10, 8.7.3, 8.9.2
23 portal pilot theek chale, ya site
par education ya callback
ki maang ho
Dental clinic software: ultra detail build plan
Page 101 of 150

11.1 Kaam chunne ka tareeka
Theme Tasks Ghante Kab uthao (meri soch)
Data ka kaam 1.5.5, 2.1.10, 2.2.6, 2.6.6,
10.5.4, 10.5.5
25 duplicates ya purane cards ka
dukh ho (merge, scan, bulk
import)
Suraksha aur
sanchalan
1.3.6, 1.4.9 (cancelled), 1.4.10, 1.6.5,
9.4.4, 9.5.6
12 naya staff aaye, ya failure drill
ka samay mile
DICOM dekhna 3.7.8 6 sirf jab RVG sirf DICOM deta ho
(11.5)
11.1.1 Maang ki sheet aur scoring (S). Ek line per maang: kisne maanga, kyun, mahine
me kitni baar use hoga, fayda (1 se 5), mehnat (S, M, L, XL), risk (privacy, kanooni,
paise), aur kill criteria. Score = fayda gunaa use, mehnat se bhaag (meri soch, saada
rakha). Pilot ki P2 list aur 10.6.7 ka backlog yahin aata hai. Done jab: 10 purani maang
score ho gayi aur doctor ne top 5 par sahmati di.
11.1.2 Teen mahine ka review (S). Har 3 mahine doctor ke saath 45 minute: top 5 chuno,
ek hi shuru karo (WIP limit 1), pichhle feature ka use dekho (11.1.5), rakho ya hatao.
Faisle decision register me. Done jab: pehle review ka note aur agla feature chuna hua.
11.1.3 'Kab nahi banana' ka niyam (S). Har feature ke saath ek line: 60 din baad mahine
me N se kam use ho (jaise perio chart me 5 se kam) to chhupa do, aur agle review me
hatao ya rakho. Done jab: har chune feature ke saamne N likha.
11.1.4 Feature flags (M). Settings hub (6.5) me har naye feature ka on ya off, default
off, pehle sirf doctor ke role ke liye, phir receptionist, phir sab; flag badalna audit hota hai
aur bina deploy ke. Done jab: ek test feature ek click me on aur off hota hai aur flag off
hone par uske raaste 404 dete hain.
11.1.5 Use ki ginti (S). Ek alag chhoti table feature_usage(day, feature, count)  me
feature-wise ginti, jisme patient ya user ki koi pehchan nahi, aur settings me ek chhota
page. Done jab: 30 din ke feature-wise numbers dikhte hain aur table me koi patient ya
user id nahi (test).
Dental clinic software: ultra detail build plan
Page 102 of 150

11.2 Perio chart (naya)
SDCEP ke hisaab se full charting me har daant ke 6 sites par pocket depth aur bleeding
dekhte hain, aur zaruri jagah recession, furcation, suppuration aur mobility. Sab sites par
likhna zaruri nahi: review me sirf wahi jahan 4 mm ya zyada ya bleeding. Isliye 'sparse'
likhne dete hain, jisse chart tez bharta hai.
11.2.1 Zaroorat ki jaanch (S). Doctor se: kagaz par perio chart mahine me kitni baar
banti hai aur kitna samay lagta hai. Mahine me 5 se kam (meri limit) ho to sirf BPE
screening (11.2.4) banao, poora chart nahi. Done jab: doctor ka jawab likha aur decision
register me 'poora chart: haan ya nahi'.
11.2.2 Doctor ke saath design (S). Kaun se parameters (pocket depth, recession,
bleeding, suppuration, mobility, furcation), kaun se scales (mobility aur furcation ke
grade doctor tay karti hai, software koi default diagnosis nahi deta), sab sites ya sirf
asaamaanya, aur print kaisa chahiye. Kagaz ke ek asli chart ki photo se mock banao.
Done jab: ek page ka spec aur doctor ka ok.
11.2.3 Schema (M). perio_exams(id, patient_id, visit_id, kind, examined_on,
status) , perio_site_readings(exam_id, tooth_fdi, side, site, pd_mm,
rec_mm, bop, supp) , perio_tooth_readings(exam_id, tooth_fdi, mobility,
furcation, note) . Daant FDI me, sparse rows chalenge (jahan kuch likha nahi wahan
row nahi), missing teeth alag, finalise ke baad badlav sirf addendum se (Phase 3 ka
niyam), draft autosave me audit row nahi. Attachment level store nahi hota, pocket
depth aur recession se nikala jaata hai (meri jaankari, doctor confirm kare). Done jab:
migration, rollback aur ek test jo finalise ke baad edit rokta hai.
11.2.4 BPE ya PSR screening (M). Munh ko 6 sextants me baanto, har sextant ka sabse
kharab code (doctor ka scale), 30 second me. Software code dikhata hai, 'poora chart
karo' jaisi salaah nahi deta (Won't-do: koi diagnosis ya salaah nahi). Done jab: ek
patient ka screening 30 second me bhara gaya.
11.2.5 Poore chart ka grid (L). Keyboard-first: teen number type karo (mesial, mid,
distal), Enter se agla daant, missing teeth chhod do, bleeding ek key se, recession,
mobility aur furcation alag row me. Tablet par bade buttons. Draft autosave, finalise
par audit. Done jab: 28 daant ka chart kagaz se zyada samay nahi leta (stopwatch,
10.1.4 jaisa) aur bina mouse ke keyboard se bhara ja sakta hai.
11.2.6 Compare aur trend (M). Pichhla aur abhi ka chart saath, 4 mm ya zyada wale
sites ki ginti, bleeding ka percent (bleeding sites bhaag examined sites, meri jaankari),
aur kaun se sites sudhre ya bigde. Sirf aankde, 'sudhaar hua' ka faisla software nahi
deta. Done jab: do nakli charts ka compare doctor ki haath ki ginti se milta hai.
Dental clinic software: ultra detail build plan
Page 103 of 150

11.3 Lab work tracker (naya)
Crown, bridge aur denture jaise kaam lab me jaate hain. Abhi kagaz ya WhatsApp par
chalta hoga, isliye late ya kho gaye case ka khatra rehta hai (procedure catalog me 'lab ka
kaam lagta hai ya nahi' ka field 0.2.3 me pehle se hai). Yeh sirf staff ke liye hai: patient ko
lab ka koi message ya portal entry nahi.
11.2.7 Print (M). A4 par chart (grid, daant FDI me aur saadi bhasha me) aur patient ke
liye ek page ka saar saadi bhasha me. Done jab: asli printer par kagaz ke chart se line-
by-line mila.
11.2.8 Test aur chhota pilot (M). Kagaz ke 5 asli charts software me daal kar compare,
samay, accessibility, finalise ke baad edit nahi. Done jab: 5 me se 5 charts ke aankde
kagaz se 100% mile aur doctor ne agle 10 patients par use kiya.
11.3.1 Lab ka process likhna (S). Kaun si lab, kaam kaise jaata hai (impression, shade,
WhatsApp), kitne din me aata hai, kabhi late ya galat hua, aur abhi kagaz par kya likhte
hain. Done jab: ek page me process aur 3 sabse badi dikkatein.
11.3.2 Schema (M). labs(id, name, contact, active)  aur lab_cases(id,
patient_id, visit_id, plan_item_id, tooth_fdi, kind, shade, lab_id,
sent_on, due_on, received_on, fitted_on, cost_paise, status, note) . Status:
draft, sent, received, fitted, returned, cancelled; badlav ek hi jagah ke status chakra se
(2.3.6 jaisa), baaki 409. Paise integer. Done jab: migration aur har galat status badlav ke
liye test.
11.3.3 Screens aur lab slip (M). Status-wise list, naya case (daant ke chart se), 'bheja'
aur 'aaya' ek click me, A5 lab slip. Slip par patient ka poora naam nahi, sirf P-code, pehla
naam, umar, daant, kaam, shade aur due (lab ko jitna chahiye utna, doctor tay karti hai).
Done jab: ek case bheje se fit tak ek screen se chala aur slip ek A5 page par.
11.3.4 Dhyan dene wali baatein (S). Due nikla hua case aur 'kaam aa gaya, patient ko
bulana hai' list dashboard ke 'dhyan dene wali baatein' me. Patient ko SMS me ilaaj ya
lab ka zikr nahi (Phase 7 ka niyam), receptionist phone karti hai. Done jab: due se ek din
upar ka case laal dikhta hai.
11.3.5 Lab ka hisaab (M). Case ka lab cost, mahine ki lab ki list aur total, lab ke bill se
milaan. Patient ke bill (Phase 5) se alag, aur kharcha (11.4) se jud sakta hai. Done jab: ek
mahine ka lab total lab ke bill se paise-paise mila.
11.3.6 Test (S). Role check staff app me bhi, status chakra, due ka timezone (IST),
purge nahi (records rehte hain). Done jab: tests CI me.
Dental clinic software: ultra detail build plan
Page 104 of 150

11.4 Kharcha aur stock (naya)
Abhi kamai Phase 5 aur 6 me hai, kharcha nahi. Ye tabhi banao jab doctor ko iska fayda
dikhe, warna CA ki Excel hi theek hai. Ye CA ke account ka badal nahi, sirf doctor ki apni
nazar ke liye.
11.5 Imaging ka agla kadam
Phase 3 me X-ray ka viewer (zoom, pan, brightness, contrast, invert, saath-saath) pehle se
hai (3.7.4), aur DICOM ka kaam 3.7.8 me 'baad me' ginta hua hai (pool me, 6 ghante). Yahan
sirf wo hai jo uske upar naya hai. Viewer ke liye Cornerstone aur OHIF MIT licensed hain
(upar ke sources), isliye khud likhne se pehle unhe dekho. Wo bhaari ho sakte hain (meri
jaankari, test karo), isliye sirf viewer page par lazy-load, aur static asset ki tarah (Worker
script ki 3 MB gzip seema se alag, ek file 25 MiB tak).
11.4.1 Zaroorat ki jaanch (S). Abhi kharcha kahan likhte hain (diary, Excel, CA)? Doctor
mahine ka 'kamai minus kharcha' dekhna chahti hai? Na ho to ye poora hissa chhodo
(11.1.3). Done jab: doctor ka jawab aur decision register me faisla.
11.4.2 Kharcha entry (M). Tareekh, category (kiraya, tankhwah, saamaan, lab, bijli aur
net, baaki), raqam paise me, kisko, kaise diya (cash, UPI, bank), note, aur bill ki photo
(R2 me alag folder, sirf doctor ko). Galat entry 'radd' ya addendum se, kabhi delete
nahi, audit. Done jab: ek mahine ki 30 entries 15 minute me daali ja sakin.
11.4.3 Mahine ki kamai aur kharcha (M). Official receipts ka jod (shadow rows nahi,
10.2.1) aur kharcha ka jod, fark, category-wise. Upar saaf likha: 'anumanit, CA ke
account ka badal nahi'. Done jab: ek mahine ka total CA ki sheet se milta hai (ya fark
samjha hua).
11.4.4 Stock, optional (L). Saamaan ki list (naam, unit, kam se kam kitna), 'kharida' aur
'use hua' entry haath se, kam stock ki list. Barcode ya apne aap ghatna nahi. Sirf tab
jab doctor ya receptionist sach me roz entry karne ko taiyar ho, warna kharidne ki list
kagaz par. Done jab: 10 item ka ek hafte ka ginti-milaan sahi.
11.4.5 Test (S). Paise integer, rounding, mahine ke jod ke tests, bill photo ka access
(receptionist ko 403). Done jab: tests CI me.
11.5.1 RVG ka export dobara dekhna (S). 0.4.4 aur 3.7.1 ka natija: RVG JPEG ya PNG
deta ho to DICOM ki zaroorat nahi, 3.7.8 pool me hi rahe. Done jab: decision register
me 'DICOM: haan ya nahi'.
11.5.2 DICOM header ka privacy niyam (S). DICOM file ke andar patient ka naam aur
ID header me hota hai (meri jaankari). Niyam: file jaisi hai waisi R2 me (badlo mat),
screen par sirf image aur kuch tay fields, header ke baaki fields UI me nahi dikhte, aur
Dental clinic software: ultra detail build plan
Page 105 of 150

11.6 Digital consent (ilaaj ke liye)
Chhapa hua consent form Phase 3 aur 4 me hai (3.8.1, 4.4.2) aur kagaz ki photo jodna 2.6.6
me. Yahan sirf tablet par sign aur record aata hai. Samira Kohli (2008) ke hisaab se sahmati
asli honi chahiye (upar ke sources): sign sirf kagazi kaam nahi, doctor ki samjhayi hui baat
ka saboot hai, aur ek kaam ki sahmati doosre kaam ki nahi hoti. Isliye software form ko
'baatcheet ka saboot' banata hai, uski jagah nahi leta. Touch-screen sign ki kanooni takat
par vakeel se poochho.
portal par kabhi DICOM file nahi, sirf doctor ke release par render hui image (8.3.10).
Done jab: ek DICOM file me nakli naam daalkar test: viewer me wo naam kahin nahi
dikhta.
11.5.3 Series aur compare (M). Ek daant ke X-ray tareekh ke kram me, do ya teen
saath-saath (3.7.4 ka compare DICOM tak), brightness ka alag setting sirf viewer me,
asli file nahi badalti. Done jab: ek daant ke 3 X-ray tareekh ke kram me khulte hain.
11.5.4 Naapne ka faisla (S). Doctor X-ray par length naapna chahe to: galat naap
clinical khatra hai, isliye tab tak nahi jab tak pixel spacing (DICOM me) ya calibration
object pakka na ho, aur tab bhi 'anumanit' label ke saath. Done jab: decision register
me likha ki naap nahi banega ya kis shart par.
11.6.1 Kanooni raay (S). Vakeel ya IDA se: tablet par ungli ya pen se kiya sign (image)
maanya hai ya kagaz par sign karwa kar scan behtar? Emergency me kya? Template ki
bhasha theek hai? Done jab: raay likhit me aur decision register me (tab tak kagaz hi
asli).
11.6.2 Consent record ka schema (M). treatment_consents(id, patient_id,
visit_id, procedure, template_id, template_version, text_hash, signed_by,
witness_name, signed_at, method, file_key, revoked_at, created_by) .
signed_by  patient ya guardian, method  paper_scan ya tablet. Ek baar bana to
badalta nahi, wapas lena naya row. Done jab: migration aur 'badalna mana hai' test.
11.6.3 Sign pad (M). Canvas par touch sign, PNG aur stroke ka JSON, samay, device ka
naam, 'patient ne padha aur samjha' ka tick, guardian ke liye naam aur relation. Text ka
snapshot aur hash saath, taaki pata rahe kaun sa text sign hua. Done jab: tablet par
sign hua aur consent ka print wahi text dikhata hai jo sign hua.
11.6.4 Visit me flow (M). Jis procedure par consent zaruri hai (doctor ki list), visit
screen 'consent baaki' dikhata hai. Bina consent aage badhna doctor 'wajah' likh kar
kar sakti hai (jaise emergency), aur override audit hota hai. Naya ya extra kaam aaye to
naya consent. Done jab: extraction ke visit par consent baaki dikhta hai aur override ki
wajah audit me.
Dental clinic software: ultra detail build plan
Page 106 of 150

11.7 ABHA aur ABDM ka faisla
Faisla abhi: integration nahi. ABDM centre ke hisaab se voluntary hai; jo aadesh mile wo
medical colleges ke liye hain, aur kuch rajyon me clinics tak bhi pahunche hain (J&K, 17 Oct
2023: single-doctor clinics ko Clinical Establishments Act aur HFR me register karne ka
order, akhbaar ki khabar). Centre ka koi aadesh single private dental clinic ke liye mujhe
nahi mila, isliye apne rajya ka niyam sabse pehle dekho (11.7.1). Certification software ki
hoti hai (milestones M1 se M3 sandbox me, kam se kam do par exit, blogs ke hisaab se 6 se
9 mahine greenfield), isliye apne software ke liye ye ek clinic ke hisaab se bahut bhaari hai.
Yahan sirf nigrani, ek optional field aur 'zaroorat padi to' ka plan hai.
11.6.5 Print aur export (S). Sign wala consent ek A4 par, aur records ki maang (3.9.2)
ke bundle me. Done jab: ek page me sign ke saath.
11.6.6 Test (S). Sign ke baad edit nahi, galat patient ka consent nahi dikhta, portal par
consent ki file nahi, file ka access sirf doctor ko. Done jab: tests CI me.
11.7.1 Har 6 mahine mandate ki jaanch (S). Pehli jaanch go-live se pehle (sister ke rajya
ka swasthya vibhag aur Clinical Establishments Act ke circular, kyunki J&K jaisa order
doosre rajyon me bhi aa sakta hai), phir ABDM aur NHA ki official site, IDA aur sister ke
council ke notice. Vendor ya news ka daava tab tak nahi maanna jab tak sarkari aadesh
na mile. Trigger (kab karenge): (a) likhit sarkari aadesh (centre ya clinic ke rajya ka) jo
private dental clinic par lagu ho, (b) kisi scheme ya insurer ki shart, (c) mahine me 10
se zyada patients ABHA maangein (meri soch). Done jab: calendar me 6 mahine ka
reminder aur pehli jaanch ka note.
11.7.2 ABHA number ka optional field (S). Patient khud de to 14 ank ka number (sirf
format ki jaanch, verification nahi), sensitive field ki tarah (portal par nahi, export me
sirf doctor), consent line 'patient ne khud diya'. Done jab: galat length par error aur
receptionist ko field dikhta hai par zaruri nahi.
11.7.3 HFR aur HPR registration (M). Clinic ko HFR me aur doctor ko HPR me register
karna (free hai ya nahi, kaun se documents lagte hain, aur software integration ke bina
ho sakta hai ya nahi, ye maine check nahi kiya). Sirf tab jab 11.7.1 ka trigger ho ya doctor
chahe. Done jab: official portal ki asli requirements ek page me likhi aur doctor ka
faisla.
11.7.4 Agar mandate aaye (S). Bina kuch banaye ek plan: (1) kya sach me clinic par lagu
hai, (2) khud certification (kam se kam M1 aur M2 sandbox me; ek vendor blog teeno
milestones ke greenfield build ke liye 6 se 9 mahine batata hai, M2 akele ke liye 4 se 12
Dental clinic software: ultra detail build plan
Page 107 of 150

11.8 Badhne ke trigger aur taiyari
Seemayein (D1 500 MB, R2 10 GB, Workers 100,000 requests per din) pehle se verify ho
chuki hain; yahan unke 70% par hi chetavani laga rahe hain. Numbers meri soch hain.
hafte) ya kisi certified third-party integration layer ke saath (kitna kharcha, maine
check nahi kiya), (3) budget ₹ 1,000 per saal se bahar hoga to sister se baat, (4) DPDP
aur data ke sthan ka asar. Done jab: ek page 'agar order aaye to' decision register me.
Naap Trigger Kya karenge
Naye patients per
mahine
150 se upar quota budget dobara (9.4.1), SMS cap dekho
(Phase 7), booking load
D1 ka size 350 MB purane data ka purge (9.3.10), jaanch ki file ya
image D1 me nahi hai, aur doosre database ka
plan
R2 ka size 7 GB file size ki policy, purani scans compress, ya
paid plan
Worker requests per
din
50,000 se upar
roz
kya bot hai (8.2.13), caching, ya paid plan
D1 rows written per din 70,000 se upar kaun sa raasta likh raha hai, batching, ya paid
plan
SMS cap baar-baar hafte me 3 baar Plan B (7.1.5) ya doosri SIM
Doosra doctor kabhi bhi 11.8.3
11.8.1 Trigger table ko monitor se jodna (S). Upar ke numbers 9.2.1 ke quota monitor se
aur 9.1.10 jaisi 'dhyan dene wali baatein' wali line se dashboard par aayein, aur agar 1.6.5
ka staff status page tab tak ban chuka ho to wahan bhi, taaki sister ko 'peela' (trigger
paar) aur 'laal' (seema ke bahut paas) dikhe. Done jab: nakli numbers par line peeli aur
laal hui.
11.8.2 Teen mahine ka data review (S). D1 aur R2 size, rows read aur written ka trend,
Worker requests, SMS cap ke din, backup ka size aur samay (export chalte waqt baaki
requests ruk jaati hain, 9.1.1); agle 12 mahine ka andaaz. Done jab: ek table me 4
quarters ke numbers aur andaaz.
Dental clinic software: ultra detail build plan
Page 108 of 150

11.9 Rajya ka clinic kanoon (Clinical Establishments Act)
MoHFW ki site ke hisaab se Clinical Establishments Act, 2010 sabhi tarah ke clinical
establishments par lagu hota hai, single doctor clinics bhi, par sirf un rajyon aur UT me
jinhone ise apnaya (site ki list: Arunachal Pradesh, Assam, Bihar, Haryana, Himachal
Pradesh, Jharkhand, Mizoram, Rajasthan, Sikkim, Telangana, Uttar Pradesh, Uttarakhand
aur Delhi ko chhodkar sab UT; purane sarkari jawabon me rajyon ki ginti 10 ya 11 likhi hai,
isliye list badalti rahi hai). DGHS ke note me baaki 16 rajya (purane Andhra Pradesh
sameet) aur Delhi ko un me ginaya gaya hai jinhone ise nahi apnaya par jinke apne Acts
hain; un Acts ki details maine nahi padhi. Registered clinic ke liye FAQ registration
certificate dikhane aur dar (rates) ko local bhasha aur English me dikhane ko kehta hai, aur
ek akhbaar ki khabar me official ke bayan me records aur reports rakhna bhi in niyamon
me gina gaya hai. Clinic kis rajya me hai ye mujhe nahi pata (0.5 me poochha hai), isliye ye
hissa 'agar lagu ho to' hai.
11.8.3 Doosre doctor ke liye taiyari (M). Sister ek associate rakhe to: roles (doctor,
associate), doctor-wise calendar aur parcha, doctor-wise report, har bill par kiska,
Access me ek aur email (free plan 50 users tak), aur har doctor ka registration number
(DCI 3.4.1). Pehle jaanch lo ki doctor_id  har visit, parche aur bill par pehle se hai.
Done jab: ek nakli doosra doctor staging me ek din chala aur reports alag.
11.8.4 Paid plan ka faisla (S). Workers Paid kam se kam $5 per mahina hai (Cloudflare
pricing page), yani $60 per saal, aaj ke rate par ₹ 5,000 se upar (rate meri andaaz).
Usme 10 million requests aur 30 million CPU ms per mahina, D1 me 25 billion rows read
aur 50 million rows written per mahina, aur Workers Logs 7 din (free me 3 din). Ye
₹ 1,000 per saal ke budget se bahar hai, isliye sister ki manzoori aur kaun bharega ye
pehle se tay. Upgrade se limits hat jaati hain (D1 FAQ ke hisaab se aam taur par kuch
minute me) aur code nahi badalta. Done jab: ek page 'kab, kitna, kaun' decision
register me.
11.9.1 Rajya ka kanoon pata karna (S). Sister ke rajya me kaun sa kanoon lagu hai (CE
Act ya rajya ka apna Act), clinic registered hai ya nahi, certificate ka number aur
renewal ki tareekh, aur dar suchi ya records ke kya niyam hain (rajya ke swasthya
vibhag ki site ya registration office se, vakeel ya IDA se confirm). Done jab: ek page me
kanoon ka naam, registration ki sthiti, aur sister ka 'ok'.
11.9.2 Dar suchi (rate list) print (S). Procedure catalog (Phase 3) se printable list:
procedure ka naam local bhasha aur English me, dar, version aur tareekh, A4 par. Sirf
wahi procedures jinki dar tay hai, baaki 'case par nirbhar' (3.8, 5.7.1 jaisa). Dar sirf clinic me
Dental clinic software: ultra detail build plan
Page 109 of 150

Phase 11 ke ghante
Naye features (11.1 se 11.9) lagbhag 88 ghante, aur upar ka pool 119 ghante, yani sab milakar
207 ghante, jo sab launch ke baad ke hain aur go-live ki tareekh ko nahi badalte. Pool ke
ghante apne phase me ginte hain, yahan dobara nahi.
Mat karo (Phase 11)
Doctor ke 'mahine me kitni baar' jawab ke bina koi feature mat banao.
Ek saath do features mat banao (WIP limit 1).
Hypercare ke 2 hafton me koi naya feature nahi (10.4.4).
Software se diagnosis, ilaaj ya dawai ki salaah mat nikalwao (perio me 'sudhaar hua' ya
BPE se 'chart karo' tak nahi).
X-ray par naap bina calibration ke mat do.
ABDM ka integration bina likhit sarkari aadesh ke shuru mat karo.
Consent ko sirf sign ka image mat samjho, aur ek kaam ki sahmati ko doosre kaam par
mat lagao.
Lab ya kisi bahari ko patient ka poora naam ya record mat do (P-code aur pehla naam).
Patient ko lab, ilaaj ya paise ka SMS mat bhejo (Phase 7).
Feature ke use ke numbers me patient ki pehchan mat rakho.
Feature ko chup-chaap mat chhodo: ya to use ho ya hatao (11.1.3).
Online booking ya online payment mat jodo (Won't-do list), launch ke baad bhi nahi.
Phase 11 ka gate (har feature ke liye)
Kill criteria likha hai, feature flag ke peeche hai, aur doctor ne 'mahine me kitni baar' ka
jawab diya tha.
Tests CI me, 'mat karo' list ka koi item todta nahi, aur user manual (9.5.2) me ek page
jud gaya.
Pehle 30 din sirf doctor ke role par, phir sabke liye; 60 din baad use ki ginti (11.1.5) ne
kill criteria paar kiya ya feature hata diya gaya.
Feature ke 30 din tak naya P0 nahi aaya, aur quota budget table (9.4.1) update hui.
Privacy impact note (8.1.4) aur retention table (9.3.10) me naye data ki entry.
aur chhapi hui dar suchi par dikhti hai, staff app ya portal par nahi. Sirf tab jab 11.9.1
me niyam lagu nikle ya sister chahe. Done jab: ek print jo clinic ki deewar par lagne
layak hai aur dar catalog se hi aati hai (haath se likhi nahi).
Dental clinic software: ultra detail build plan
Page 110 of 150

Operations: chalte software ka rakhrakhaav
Go-live ke baad software ko roz sambhalna nahi padna chahiye. Niyam simple hai: jo kaam
machine kar sakti hai wo machine kare aur fail hone par khud batae (alert), aur jo kaam
insaan ka hai wo calendar me, naam aur samay ke saath likha ho. Do log hain: developer
(tum) aur sister (clinic ki malik). Receptionist sirf roz ka kaam karti hai aur 'problem batao'
button dabati hai. Har line ke aage task number hai, jahan wo cheez banti hai. Roz, hafte,
mahine wali frequency meri salaah hai, jab tak task me alag na likha ho.
Kaun kya dekhta hai
Jo apne aap chalta hai
Kaun Kya dekhta hai Kitna samay Kahan
Receptionist 'Dhyan dene wali baatein'
(aakhri backup, SMS
phone online) aur kal ki list
ka print
roz 2 minute dashboard, 9.1.10,
9.2.3
Sister
(doctor)
Alert emails, mahine ka ek
page 'is mahine kya hua',
saal me ek baar recovery
kit ki jaanch
mahine me 20 minute email, decision
register
Developer Healthchecks, quota aur
uptime alerts, hafte ka D1
dashboard, mahine ka
ritual
pehle mahine roz 5
minute (10.4.5), phir
hafte me 30 minute
aur alerts
Healthchecks,
Cloudflare dashboard
Kaam Kab Kaun chalata hai Fail ho to kaise
pata chalega
Task
Raat ka D1
export, encrypt,
B2 par upload
02:30 IST GitHub Action (agar
private repo me schedule
na chale to Worker cron
se workflow_dispatch )
Healthchecks: 3
ghante me ping
nahi aaya, aur
dashboard par laal
9.1.2,
9.1.3,
9.1.10
Dental clinic software: ultra detail build plan
Page 111 of 150

Kaam Kab Kaun chalata hai Fail ho to kaise
pata chalega
Task
Reminder
dispatcher
har 5
minute, sirf
08:00 se
21:00 IST
Worker cron 'SMS phone
offline' 30 se 35
minute me
dashboard par, aur
Healthchecks ping
band
7.2.5,
7.2.9
Quota monitor har ghante Worker cron ki ek branch Worker requests
50,000, 80,000 aur
95,000 par email ya
Healthchecks fail
ping
9.2.1
daily_stats
dobara ginti
(pichhle 3 din)
raat me Worker cron ki branch dashboard ke
numbers galat
lagein to doctor ka
'abhi dobara gino'
button
6.2.3
Purane rows ka
purge
(retention table
ke hisaab se)
raat me Worker cron ki branch,
row limit ke saath
purge ke baad ki
ginti CI test me
9.3.10
Audit log ki
hash jaanch
raat me raat ka job (Worker cron
ki branch, meri
maanyata)
alert 9.3.6
R2 se B2 par
files ki copy
haftawar GitHub Action Healthchecks
check
9.1.4
Clinic PC par
copy
ravivaar raat PC ka Task Scheduler PC band raha to
Healthchecks alert
9.1.5
Public site ka
rebuild
raat me,
aakhri
release tag
se
GitHub Action site purani rehti hai
(static), isliye
khatra kam;
GitHub ka failure
email
8.6.3
Dental clinic software: ultra detail build plan
Page 112 of 150

Worker ke cron triggers free plan me 5 per account hain, hum sirf ek ( */5 * * * * ) use
karte hain aur uske andar branches chalte hain (Tech decisions). Us account me aur koi
Worker ho to ginti rakho. Har branch ka row limit hai kyunki free Worker ko 10 ms CPU
milta hai. GitHub ka schedule late ya drop ho sakta hai (GitHub ke docs), isliye har
scheduled kaam ke saath Healthchecks ka dead-man ping hai. GitHub ke free private
minutes 2,000 per mahina hain; export, rebuild, R2 copy aur CI milakar mahine ke 400 se
700 minute (meri ganit, 9.1.2 ke spike me asli naap).
Hafte, mahine aur saal ka insaani kaam
Kaam Kab Kaun chalata hai Fail ho to kaise
pata chalega
Task
Site ka uptime
monitor
har 5
minute
bahar ka monitor (0.3.5
me UptimeRobot)
email 8.8.5,
9.2.5
Kab Kaam Kaun Samay Task
Hafte me Cloudflare me D1 ke rows read
aur written dekho aur 'quota
budget' table se milao
Developer 10
minute
9.2.1, 9.4.1
Hafte me Healthchecks ke teeno
backup checks green hain, PC
copy aayi
Developer 5 minute 9.1.10, 9.1.5
Hafte me 'Problem batao' ki entries aur
bug list: P0 usi din ya paper
mode, P1 48 ghante me, P2
hafte me
Developer 15
minute
9.5.4, Phase 10
ki priority
Hafte me Dependabot ke PR: security
fix pehle, baaki mahine me ek
baar tests ke saath
Developer 15
minute
9.3.2
Mahine
me
Latest backup ko laptop par
decrypt karo, PRAGMA
integrity_check  chalao, phir
data hata do
Developer 30
minute
9.1.7 ka chhota
roop
Dental clinic software: ultra detail build plan
Page 113 of 150

Kab Kaam Kaun Samay Task
Mahine
me
'Quota budget' table asli
numbers se bharo, D1 aur R2
ka size dekho, SMS ke daily
cap ke din ginno
Developer 20
minute
9.4.1, 11.8
Mahine
me
SIM aur phone: recharge ya
validity, battery, gateway app
online, aakhri SMS delivery
Receptionist ya
developer
10
minute
0.3.7, 7.2.9
Mahine
me
Accounts register: agle 60 din
me domain, token ya SIM ki
renewal
Developer 10
minute
0.3.5
Mahine
me
Patients ke anurodh (dekhna,
sudhaarna, mitana, sahmati
wapas) jo baaki hain, 30 din ka
target
Sister aur
receptionist
10
minute
8.2.11, 8.10
Mahine
me
Paper kit ki ginti: naye patient
form, appointment sheet,
downtime receipt book
Receptionist 5 minute 9.2.3
Mahine
me
Sister ke saath 20 minute: 'is
mahine kya hua' ka ek page
(bugs, downtime, alerts,
backup, quota)
Developer aur
sister
20
minute
decision
register
3 mahine
me
Access review: Cloudflare,
GitHub, Access ke teen
emails, B2, registrar, Google
profile
Developer 30
minute
9.3.4
3 mahine
me
age  key ka test decrypt,
sister ke saath, developer ke
bina bhi
Developer aur
sister
30
minute
9.1.6
3 mahine
me
Doctor ke saath feature
review aur data size review
Developer aur
sister
45
minute
11.1.2, 11.8.2
6 mahine
me
Secrets ka rotation (aur
GitHub dispatch token agar
use hota hai)
Developer 1 ghanta 9.3.3, 9.1.2
Dental clinic software: ultra detail build plan
Page 114 of 150

Seema ki nigrani
Seemayein (D1 500 MB, R2 10 GB, Workers 100,000 requests per din) Tech decisions me
verify ho chuki hain, aur trigger ki table 11.8 me hai. Yahan sirf kaun dekhta hai: developer
hafte me D1 aur Worker numbers, mahine me D1 aur R2 ka size aur backup ka size
(dashboard ki 'aakhri backup' line me), taaki 350 MB ya 7 GB ka trigger pehle dikhe. Quota
khatam ho jaye to staff app 'server busy' dikhaye aur paper mode ka link de (9.2.2), aur
reset subah 05:30 IST par hota hai.
Kab Kaam Kaun Samay Task
6 mahine
me
ABDM, rajya ke clinic kanoon,
DCI aur DPDP ke naye aadesh
ki jaanch, privacy notice ka
version
Developer aur
sister
1 ghanta 11.7.1, 11.9.1,
8.10.1
6 mahine
me
Free plans ki shartein aur
limits dobara padhna
(Cloudflare, Backblaze,
GitHub, Brevo, Healthchecks,
uptime monitor)
Developer 1 ghanta Accounts aur
cost table
6 mahine
me
Poora restore drill: B2 se naye
D1 tak, samay naapo (target 4
ghante)
Developer 4 se 6
ghante
9.1.7
Saal me Domain renewal (registrar
jahan renewal ki keemat wahi
rahe) aur registration me clinic
ka contact
Sister aur
developer
30
minute
8.1.3
Saal me Sealed lifafa ( age  key) aur
recovery kit ki jaanch, 2FA
recovery codes
Sister 20
minute
9.1.6, 0.3.2
Saal me Receptionist ka refresher
training aur breach ka tabletop
drill
Developer 3 ghante 9.5.3, 9.3.9
Saal me Hardware: PC, UPS ki battery,
printer, gateway phone ki
battery
Sister 30
minute
0.4
Dental clinic software: ultra detail build plan
Page 115 of 150

Update aur release ke niyam
Deploy sirf clinic ke samay ke baad ya ravivaar (9.5.4), Hypercare me subah 8 se pehle
ya raat 8 ke baad (10.4.4). Har deploy ke baad 3 minute ka smoke test: login, naya
patient, appointment, parcha print, bill.
Har production migration se pehle Time Travel bookmark, taaza export aur dry run;
pehle naya column, phir code, phir purana hatao (9.1.9). Rollback 5 minute me (9.2.4).
Har deploy ki ek line ki release note saadi bhasha me, desk par (9.5.4, 10.4.4).
Security update jaldi (meri salaah: hafte ke andar), baaki dependencies mahine me ek
baar, CI ke tests ke saath (9.3.2).
Clinic PC ka browser aur OS update on rahe; bade update ke baad asli printer par
parcha, bill aur receipt ka test (9.4.5).
Kisi vendor (Cloudflare, Backblaze, GitHub, Brevo, Healthchecks) ki pricing ya terms
ki email aaye to Accounts register me note aur agle mahine ke ritual me padhna.
Support: kaun, kitni der me
Receptionist ka raasta: app ka 'problem batao' button (page ka naam aur samay jata hai,
patient ka data nahi) aur developer ka WhatsApp (9.5.4). App band ho ya patient ka
kaam ruke to phone call aur turant paper mode (9.2.3, 9.2.4).
Jawab ka samay: Hypercare me 15 minute (10.4), uske baad clinic ke samay me 2
ghante ki koshish (9.5.4). Priority: P0 usi din ya paper mode, P1 48 ghante, P2 hafte me
(Phase 10).
Developer 4 ghante tak na mile (meri salaah) to dost developer, jiska naam aur number
is page par likha hoga. Uske paas README aur 'pehle din' page (9.5.1) hai; sister ke
paas recovery kit (0.3.2) aur sealed key (9.1.6).
Staff badle ya developer badle to
Naya staff aaye:
Staff jaye:
Cloudflare Access me uska email jodo (free plan 50 users tak) aur app me role
(receptionist ya doctor) do. Alag login, shared login nahi, taaki audit me naam aaye.
Training ke do session aur manual (9.5.2, 9.5.3), phir ek mock din.
Accounts aur access ki table (9.3.4) me entry.
Usi din Access se email hatao aur app me user ko inactive karo. Uske baad ke 30 din ka
audit log dekho.
Dental clinic software: ultra detail build plan
Page 116 of 150

Developer badle:
Operations theek chal raha hai, ye kaise jaanenge
Pehle 3 mahine har mahine ka ritual poora (tick sheet), aur koi alert 24 ghante se zyada
bina jawab ke nahi.
Mahine ke backup ka decrypt aur integrity check pass, aur poore restore drill ka
samay 4 ghante ke andar ya badla hua target likha hua.
Quota aur size ke numbers trigger table (11.8) ke peele ya laal me nahi, ya agar hain to
uska faisla likha hua.
Risk register: kya bigad sakta hai aur uska bachav
Yahan wo jokhim hain jinse is plan ke fail hone ya patient ko nuksaan hone ka sabse zyada
khatra hai. A×S ka matlab: asar (1 kam, 2 madhyam, 3 bada) gunaa sambhavna (1 kam, 2
madhyam, 3 zyada). Ye bachav ke tasks lagne ke BAAD ka bacha hua jokhim hai, aur poora
meri andaaz hai (koi data nahi). Table score ke hisaab se upar se neeche hai. Har phase ke
gate par aur mahine ke ritual me 5 minute ye table dekho aur score badlo.
Bitwarden ke shared passwords, gateway phone ka PIN aur receptionist ke jo bhi shared
secrets the, badlo.
Patient data ka koi export ya copy uske paas na ho (9.3.5 me export sirf doctor ko hai).
Sab accounts sister ke naam par aur naye developer ko delegated access (0.3).
Secrets rotate (9.3.3), GitHub aur Cloudflare ke members badlo.
README, runbooks aur decision register (9.5.1) se naya developer local chalaye; age
key ke decrypt ka test do logon ke saath (9.1.6).
Alerts ka email aur WhatsApp naye number par, aur Healthchecks ke notification
channels badlo.
Jokhim A×S Bachav (task) Pehla sanket Agar ho gaya
Developer
akela hai (tum
busy, beemar
ya chhod do)
3×2=6 README aur 'pehla din'
page, runbooks (9.5.1, 9.2.4);
sab accounts sister ke naam,
recovery kit, sealed key (0.3,
9.1.6); ek dost developer jise
README se local chalana
aata ho (9.5.1)
Support ka
jawab 2
ghante se
zyada; dost
developer ka
naam abhi tak
nahi likha
Dost developer
ko bulao; tab
tak paper
mode (9.2.4);
sister ke paas
kit se access
Dental clinic software: ultra detail build plan
Page 117 of 150

Jokhim A×S Bachav (task) Pehla sanket Agar ho gaya
Mehnat
andaaz se
zyada: Phase 0
se 10 ka core
1,063 ghante,
20 ghante per
hafte par
lagbhag 53
hafte
2×3=6 'Baad me' tags (119 ghante),
phase gates, spike pehle
(Phase 0), Phase 1 ke gate
par asli ghante se dobara
hisaab (Samay aur mehnat
section), pilot ke baad 10.6.6
Phase 1 me asli
ghante plan
ke 1.3 guna se
zyada
Scope Phase 11
me bhejo,
tareekh badlo;
Phase 9 aur 10
ki suraksha
kabhi mat
chhodo
Receptionist
shadow me
thak jaye
(kagaz aur
software
dono)
3×2=6 Shadow sirf 2 hafte,
bookings 20 se 30% kam, roz
30 minute extra ka plan,
super-user, roz 15 minute ka
milaan (10.2, 10.4.3), rollback
triggers (10.3.6)
Roz ka extra
samay 45
minute se
upar, 3 din
lagatar
Shadow chhota
karo ya roko,
form saral karo,
ya kagaz par
wapas (10.3.6)
Sister ko
software
kagaz se
behtar na lage
3×2=6 Parcha doctor ke saath
design (Phase 4), har phase
ke gate par demo, lists
doctor ke edit me (Phase 3
aur 4), Phase 11 ka niyam: jo
wo use nahi karegi wo nahi
banega (11.1)
Wo parcha
kagaz par
likhti rahein,
ya 'ye kab tak
chalega'
poochhein
Ek ghanta uske
saath baith kar
dekho kahan
rukti hain, wo
screen badlo
Asli patient
data
developer ke
laptop par
(CSV, restore
dump)
3×2=6 Encrypted laptop, har drill ke
baad secure delete (9.1.7),
staging me asli data kabhi
nahi, repo me kuch nahi
(gitleaks, 9.3.2), asli data sirf
ek folder me
Us folder ke
bahar asli
naam ya
mobile wali
file
Breach plan
(9.3.9), laptop
remote wipe,
sister ko batao
Scope badhta
jaye (perfect
banane me
kabhi launch
nahi)
3×2=6 Phase gates, 'Mat karo' lists,
'baad me' tags, Phase 11 ke
niyam: ek feature ek samay,
kill criteria (11.1)
Phase me
naye tasks jud
rahe hain par
koi hata nahi
Naya task
tabhi jab ek
purana hate ya
Phase 11 me
jaye
Dental clinic software: ultra detail build plan
Page 118 of 150

Jokhim A×S Bachav (task) Pehla sanket Agar ho gaya
Worker ka
account-wide
100,000
requests per
din bot se jal
jaye (staff app
bhi band)
2×2=4 Turnstile pehle, ek
unauthenticated request par
ek se zyada write nahi,
rate_limits  writes 2,000
per ghanta par lockdown
(8.2.13), run_worker_first
sirf /api/*  aur /hooks/*
(8.6.8), quota monitor (9.2.1),
paper mode (9.2.3)
50,000 ka
alert dopahar
se pehle
Error 1027
subah 05:30
IST tak, paper
mode,
lockdown; baar
baar ho to paid
plan (11.8.4)
SIM par
operator ya
TRAI ke spam
filter ki karwai
(mere paas
iska sirf news
source hai)
2×2=4 Per number roz 3 SMS, roz ka
cap 60 (10 OTP ke liye), tick
me 5 (dheere), sirf anumati
wale, text me ilaaj ya dawai
nahi, sister ki manzoor ki
templates (7.1.1, 7.4),
operator se policy poochhna
(0.3.7), WhatsApp manual
raasta (7.2.9)
Delivery fail
badhna ya
operator ka
warning SMS
Kill switch
(7.2.10), SIM
badlo, Plan B ka
faisla (7.1.5);
portal
password se
chalta rahega
Duplicate
patients
(paper cards
ki lazy
migration)
2×2=4 Naya patient banane se
pehle search aur mobile ki
jaanch (Phase 2 ka patient
search), legacy_ref , hafte
ki ginti (10.4.3)
Duplicates 3%
se upar (meri
limit)
Merge tool
2.1.10 aage laao
Free plans ki
shartein ya
limits badal
jaayein
2×2=4 Adapters aur interfaces
(provider badalna aasan), 6
mahine me shartein padhna
(Operations), quota alerts,
neeche ki kharcha table me
paid raasta
Vendor ki
email, ya
shartein
badalne ki
khabar
Adapter badlo
ya paid plan;
export har
jagah se nikalta
hai
DPDP ki
tareekh (13 ya
12 May 2027,
sources me
farak) go-live
se pehle aa
jaye
2×2=4 Notice, consent, breach
plan, retention, anurodh ka
process asli data se pehle
(8.10.1, 9.3.8, 9.3.9, 10.1.14),
reviewer jise DPDP aata ho;
neeche timeline
Phase 8 ya 9
ka gate
khisakna
Asli data kam
rakho, vakeel
se baat,
shadow ko tab
tak chhota
rakho
Dental clinic software: ultra detail build plan
Page 119 of 150

Jokhim A×S Bachav (task) Pehla sanket Agar ho gaya
Rajya ka clinic
kanoon ya
ABDM ka
order jo abhi
pata nahi
2×2=4 Clinic ka rajya Phase 0 ke
sawal me (0.5), 11.9.1 aur 11.7.1
ki pehli jaanch go-live se
pehle
Rajya ke
swasthya
vibhag ka
circular
11.7.4 ya 11.9.2
ka plan
Mere kanooni
ya tax padhne
me galti (DCI,
DPDP, GST)
2×2=4 Har jagah 'pakka' aur
'anuman' alag likha hai, 8.5.2
ka checklist doctor se sign,
9.3.8 ka reviewer, 11.6.1 ki
raay, GST ka CA se confirm
Vakeel, IDA ya
CA ka alag
jawab
Wo hissa badlo,
notice aur
tests dobara
Hardware: ek
PC, ek printer,
internet ya bijli
2×2=4 UPS aur backup internet
(0.4.3), staff app web hai
isliye doctor ka phone ya
laptop bhi chalega (Access
OTP), paper kit (9.2.3)
Router ya UPS
ki shikayat
Doosra device,
paper mode
(9.2.4)
Shadow ka
data asli
reports, SMS
ya portal me
chala jaye
3×1=3 S  series,
MESSAGING_MODE=dry_run
aur allowed_test_numbers,
watermark, 10.2.1 ke 6 tests
CA export me
S  number
Rows mark
karo, tests
dobara (10.2.1)
Cloudflare, B2
ya GitHub
account chala
jaye (suspend
ya 2FA lock)
3×1=3 Sab accounts sister ke naam,
recovery codes kit me (0.3),
teen alag backup (B2, clinic
PC, Time Travel), sealed key
Login ya
security email
Clinic PC ki
copy se naya
account aur D1
(9.1.7 ka
runbook)
Backup
chupchap
kharab
(restore nahi
hota)
3×1=3 Upload se pehle integrity aur
invariants (9.1.3), mahine ka
decrypt check, 6 mahine ka
poora drill (9.1.7),
Healthchecks, 'aakhri
backup' card (9.1.10)
Size achanak
ghata ya ping
late
Pichhla theek
backup,
restore ka drill
dobara
Galat patient
ko ya galat
jaankari ka
message
3×1=3 Templates me sirf pehla
naam, clinic, samay, number
(7.4), anumati aur mobile ki
jaanch (7.2.4), no-PHI rule
Patient ki
shikayat
Kill switch
(7.2.10);
jaankari gayi ho
to breach plan
(9.3.9)
Dental clinic software: ultra detail build plan
Page 120 of 150

Jo jokhim hum jaanboojh kar le rahe hain
Ek hi vendor (Cloudflare) par app, database, files aur staff login: kharcha aur saralta ke
badle. Bachav: adapters, export aur teen alag backup.
D1 ko India me pin nahi kar sakte (sirf eu  aur fedramp  options): privacy notice me
data ke sthan ka zikr (9.3.8).
SMS ek phone ki SIM se, DLT nahi: ₹ 1,000 per saal ke budget ke liye. Plan B 7.1.5 me
likha hai.
Bahar ka paid pen-test nahi (9.3.7): 'baad me, agar patients badhein'.
Ek hi clinic PC aur ek printer: doctor ka phone ya laptop bachav hai.
Free plans par koi support nahi, sirf docs aur community.
Jo 5 jokhim roz dhyan me rakho
Mehnat aur tareekh (Phase 1 ke baad dobara hisaab).
Developer akela.
Receptionist ki thakaan shadow me.
Jokhim A×S Bachav (task) Pehla sanket Agar ho gaya
Software ya
typo se galat
dawai ya dose
parche me
3×1=3 Sirf doctor ki list (0.2.4), koi
dose calculator ya
interaction engine nahi,
parche ka preview aur
finalise lock, print ka
snapshot badalta nahi
(Phase 4)
Doctor ka 'ye
galat dikha'
Addendum,
patient se
sampark, audit
log
Portal account
par kisi aur ka
kabza (shared
ya chori ka
phone)
3×1=3 OTP aur password dono, rate
limits, 30 minute idle, sirf
appointment, parcha, bill
(8.1.4 ke 8 jokhim)
Ek number par
fail login ka
spike
Lockdown
(8.2.13), breach
plan
D1 ki seema ya
dheemi speed
(500 MB, 5M
reads, India se
lagbhag 300
ms)
2×1=2 0.6.2 ka test, har screen ka
rows-read budget (9.4.2),
load test (9.4.1), Tech
decisions me fallback
0.6.2 me CPU
5 ms ya
response 500
ms se upar
Tech decisions
ka fallback ya
paid plan
(11.8.4)
Dental clinic software: ultra detail build plan
Page 121 of 150

Asli data kahan hai (laptop).
Backup ka asli restore.
Accounts, vendors aur kharcha
Sab accounts clinic ke alag email par, sister ke naam par, authenticator app se 2FA aur
recovery codes kagaz par kit me (0.3.1 se 0.3.5, 9.3.4); developer ko delegated access.
Accounts register me har service ki entry: owner, plan, limit, renewal tareekh, 2FA,
recovery kahan (0.3.5). Neeche har service ki wo limit hai jo hamare kaam par asar daalti
hai; poori limits Tech decisions aur Phase 8 aur 9 ke sources me hain. 'Pakka' ka matlab
maine official page par padha, 'anuman' ka matlab blog, news ya meri ganit.
Services aur unka plan B
Service Kis kaam ke
liye
Free limit jo
hamare liye
matter karti
hai
Card ya
payment
Plan B
Cloudflare
Workers (aur
static assets)
Staff app,
portal, API,
public site
100,000
requests per
din (reset
05:30 IST), 10
ms CPU, 3
MB, 5 cron
triggers;
static files
free aur
unlimited
(pakka)
Free par nahi;
paid plan kam
se kam $5 per
mahina
(pakka)
Paid plan (11.8.4),
code wahi
Dental clinic software: ultra detail build plan
Page 122 of 150

Service Kis kaam ke
liye
Free limit jo
hamare liye
matter karti
hai
Card ya
payment
Plan B
Cloudflare D1 Database 500 MB, 5
million rows
read aur
100,000
written per
din, Time
Travel 7 din;
India me pin
nahi hota
(pakka)
Nahi Tech decisions ka
fallback; raat ka
export B2 par
Cloudflare R2 X-ray aur
scans
10 GB-month,
10 lakh Class
A, 1 crore
Class B,
egress free
(pakka)
Sources me
farak:
marketing
page 'no card',
ek guide
'payment
method
maangi ja sakti
hai'; 0.6.6 me
dekho
B2 par copy hai;
rclone se doosre
bucket par
Cloudflare
Access (Zero
Trust)
Staff login (3
emails, one-
time PIN)
Free 50 users
tak (pakka)
Onboarding
me payment
details
maange jate
hain par free
par charge
nahi (preview
docs,
anuman); card
ya PayPal
Apna login banana
bada kaam hai, isliye
0.6.4 me pehle test
Dental clinic software: ultra detail build plan
Page 123 of 150

Service Kis kaam ke
liye
Free limit jo
hamare liye
matter karti
hai
Card ya
payment
Plan B
Cloudflare
Turnstile
Bot check Challenges
unlimited, 20
widgets, har
widget 10
hostnames
(pakka)
Nahi Doosra CAPTCHA
adapter ke peeche
Domain .in Clinic ka
naam, 3
hostnames
Registrar ke
hisaab se
alag: OVH
India ka ₹ 616
+ GST
registration
aur renewal
dono,
Hostinger
₹ 549 pehla
saal phir
₹ 899,
GoDaddy ka
₹ 199 promo
ek news
source se phir
₹ 999 (mere
pichhle
research se,
anuman;
signup par
asli keemat
dekho)
Card ya UPI
registrar par
Wo registrar jahan
renewal ki keemat
wahi rahe (8.1.3)
Dental clinic software: ultra detail build plan
Page 124 of 150

Service Kis kaam ke
liye
Free limit jo
hamare liye
matter karti
hai
Card ya
payment
Plan B
GitHub Code, CI,
raat ke jobs
Private repo
me 2,000 free
minutes per
mahina;
public repo
me 60 din
inactivity par
scheduled
workflows
band (pakka);
private repo
me schedule
na chalne ka
DEV daava
unverified
Nahi Worker cron se
workflow_dispatch
(9.1.2)
Backblaze B2 Encrypted
backups
Pehle 10 GB
free, egress
average
storage ka 3
guna tak free,
transactions
free (pakka)
Confirm nahi
kiya; 0.6.8 me
signup par
dekho
R2 ya koi S3-
compatible bucket,
kyunki tool rclone
hai
Healthchecks.io Dead-man
alerts
Hobbyist
free: 20
checks, 100
log entries
per check
(official
pricing page)
Nahi (third-
party
summaries ke
hisaab se)
Open-source hai:
self-host ya doosra
heartbeat monitor
Dental clinic software: ultra detail build plan
Page 125 of 150

Service Kis kaam ke
liye
Free limit jo
hamare liye
matter karti
hai
Card ya
payment
Plan B
Uptime monitor
(0.3.5 me
UptimeRobot)
Site up hai ya
nahi
UptimeRobot
free: 50
monitors, 5
minute
interval
(official site),
aur official
help page aur
terms ke
hisaab se
commercial
use bhi
allowed. Dec
2024 me non-
commercial
likha tha aur
kai blog abhi
bhi wahi
kehte hain,
isliye signup
ke din terms
padho
Nahi
(UptimeRobot
ki official site:
'no credit
card')
Better Stack ya
HetrixTools (blogs ke
hisaab se free aur
commercial allowed;
unki official terms
maine nahi padhi)
Brevo Doctor ko
mahine ki
report email
(7.6.1, baad
me)
Free: 300
emails per
din, koi time
limit nahi
(Brevo FAQ);
'Sent with
Brevo' sticker
hatana paid
add-on hai
(Brevo plans)
Nahi (Brevo) Email optional hai;
report print ho sakti
hai
Dental clinic software: ultra detail build plan
Page 126 of 150

Service Kis kaam ke
liye
Free limit jo
hamare liye
matter karti
hai
Card ya
payment
Plan B
SMS gateway
app (android-
sms-gateway)
aur SIM
Reminders
aur OTP
App open-
source aur
free, local
server
unlimited,
cloud server
par 'certain
limitations'
aur 1,000 se
zyada roz
bhejne par
unse baat
(sms-
gate.app
pricing);
hamara cap
60 per din
SIM ka
recharge alag
DLT provider (7.1.5,
budget se bahar) ya
WhatsApp manual
WhatsApp
(manual wa.me
click)
Receptionist ka
click
Free; Terms of
Service bulk
aur auto
messaging
mana karti
hain (pakka)
Nahi Nahi
Baaki free
cheezein
Bitwarden
free
organization
(2 users),
Google
Business
Profile,
Playwright,
Vitest, k6,
OWASP ZAP,
gitleaks,
Dependabot
Bitwarden me
emergency
access
Premium me
hai (0.3.2)
Nahi Printed kit
Dental clinic software: ultra detail build plan
Page 127 of 150

Jis service ko card chahiye, uske liye sister ke naam ka card, kam limit ke saath (meri
salaah), paid plan ka auto-upgrade band, aur card ki jaankari password manager ke bahar
kahin nahi.
Kharcha: kya budget me hai aur kya nahi
Kharcha Kitna Kab Budget ( ₹ 1,000 per
saal) me?
Domain .in lagbhag ₹ 730 per saal
(OVH India ka ₹ 616 +
18% GST, meri ganit;
registrar par asli
keemat dekho)
har saal Haan
Workers, D1, R2, Access,
Turnstile, GitHub, B2,
Healthchecks, Brevo,
Bitwarden, uptime
monitor
₹ 0 Haan
SIM ka recharge sister ke maujooda plan
ke hisaab se
har
recharge
par
Nahi, pehle se chalta
kharcha (tumne
'recharge me SMS
free' bataya tha)
Hardware: UPS, backup
internet, purana Android
phone, printer
ek baar, 0.4 me Phase 0 Nahi
Vakeel, CA ya IDA ki raay
(11.6.1, 9.3.8, GST, DCI)
alag, fees maine nahi
dekhi
jab zarurat Nahi; pehle IDA ya
council ki free
guidance dekho (meri
salaah)
Cloudflare Workers Paid,
agar trigger aaye
kam se kam $5 per
mahina, yani saal ke
₹ 5,000 se upar (rate
meri andaaz)
trigger par
(11.8.4)
Nahi, sister ki
manzoori
Dental clinic software: ultra detail build plan
Page 128 of 150

Pehle saal ka tay kharcha lagbhag ₹ 730 (domain). Baaki sab ya to ₹ 0 hai ya optional, aur wo
tabhi jab trigger aaye aur sister haan kahe. Isliye ek line decision register me: 'budget se
bahar jaane se pehle sister ki manzoori'.
Jo nahi banana hai (Won't do) aur kyun
Yeh section ek jagah par wo sab rakhta hai jo hum jaanboojh kar nahi bana rahe. Do faayde:
scope creep rukta hai, aur sister ko pehle se pata rehta hai ki kya chhoda gaya hai aur
kyun, taaki baad me 'ye kyun nahi hai' par bahas na ho. Har phase ki apni 'Mat karo' list hai,
wahan poori detail hai; yahan unka saar theme ke hisaab se hai. Teen darje hain:
Kabhi nahi: design ke faisle. Badalne ke liye decision register me naya likhit faisla aur
sister ki haan chahiye.
Tab tak nahi jab tak ek shart poori na ho: shart saath me likhi hai, aur ye bhi ki kaun tay
karega.
Abhi nahi, launch ke baad: Phase 11 ke niyam se, jab doctor ki maang aur use ke
numbers dikhayein.
Darja 1: kabhi nahi
Product me kya nahi banega
Kharcha Kitna Kab Budget ( ₹ 1,000 per
saal) me?
DLT SMS (Plan B) ₹ 720 se ₹ 1,296 per saal,
upar se entity
registration ₹ 0 se
₹ 5,900 (vendor blogs
ke hisaab se)
Plan B par
(7.1.5)
Nahi
Bahar ka paid pen-test quote par baad me
(9.3.7)
Nahi
Dental clinic software: ultra detail build plan
Page 129 of 150

Jo nahi banega Kyun nahi Detail kahan
Dose calculator, dawai-takraav
(interaction) engine, AI diagnosis,
bahar ka drug database ya API
Galat jawab ka khatra seedha
patient par aata hai aur clinical
faisla doctor ka hai. Alerts sirf
doctor ke likhe label hote hain, aur
dawai ki list doctor khud banati
hai (Phase 4 ka anuman: 40 se 60
dawaiyan kaafi)
Phase 3 aur 4 ki
'Mat karo', 4.1
ICD coding, insurance ya TPA
claim
v1 ke scope me nahi aur kaam
bahut bada; bill aur receipt Phase
5 me milte hain
Phase 3 aur 5 ki
'Mat karo'
Online payment gateway; card
number, UPI PIN ya bank
password store karna
Aapka faisla, aur RBI aur PCI ki
jhanjhat. Sirf payment ka mode
aur reference store hota hai
Phase 5
Patient ki online booking; portal
par cancel ya koi badlav
Faisla: appointment sirf phone se,
portal sirf dekhne ke liye
Phase 2 aur 8
Portal par clinical notes, internal
alerts, discount ka karan, staff ke
notes
Patient ko wahi dikhta hai jo
doctor ne parcha issue karte waqt
share kiya; baaki internal hai
4.2.6, Phase 8
SMS ya WhatsApp me ilaaj, dawai,
rashi, report, bimari ka naam,
baaki raqam, lab ya paise ki baat
Message aage ghoom sakte hain
aur patient ki privacy ka zimma
clinic par hai, isliye sirf generic
yaad
Phase 4, 5, 7, 11
WhatsApp ko bot ya browser
extension se automatic karna
WhatsApp ki Terms of Service
bulk aur automatic messaging
mana karti hain aur account band
kar sakti hain. Isliye receptionist ka
manual wa.me click
Phase 7
Patients ko email Patient ke liye SMS aur portal
kaafi hain; Phase 7 ki table me
email sirf doctor aur staff ke liye,
baad me (meri soch: kam patient
email dekhte hain)
7.6.1
Dental clinic software: ultra detail build plan
Page 130 of 150

Jo nahi banega Kyun nahi Detail kahan
Discount, offer, free check-up,
'best', 'No.1', 'guaranteed',
'painless' jaise shabd, kisi bhi
message ya website par
DCI ke niyam inducement aur apni
badai mana karte hain (8.1.3, 8.2).
Discount sirf billing ke waqt ka
faisla hai, vigyapan kabhi nahi
5.3.6, 8.5.2, Phase
7 aur 8
Website par patient ki photo,
naam ya review; bina manyata-
prapt qualification ke 'specialist';
per-lead ya commission wale
listing platform
DCI ke niyam (8.3.3, 5.1.2, 8.6.1) aur
patient ki privacy
8.5.2, Phase 8
Letterhead ya signboard par
doctor ki photo
DCI 8.3.1 Phase 4, 8.5.2
Google Maps iframe, Google
Fonts, analytics, koi bhi tracker,
third-party error tracker
Patient ka data ya pehchan bahar
ja sakti hai, site dheemi hoti hai
aur cookie banner chahiye hota
hai. Turnstile ke alawa kisi page
par third-party request nahi
8.10.4, 9.2.5
Patient ki file ya image ko public
URL se dena, R2 ke public prefix
me rakhna, ya D1 me base64
rakhna
Har file sirf login ke baad,
authenticated Worker se. D1 me
image se database aur backup
dono bhaari ho jaate hain (meri
soch)
Phase 3 aur 8
Issue hone ke baad parcha, bill ya
payment badalna; kisi record ya
audit log ko hard delete;
appointment delete; auto-finalise
Bharose aur kanooni saboot ke
liye. Sahi tareeka: addendum,
revise, cancel, refund, 'entered in
error'. Finalise hamesha doctor ke
click se
Phase 3, 4, 5, 9
Dues ko apne aap 'write off'
karna
Paise ke faisle me insaan ki
manzoori chahiye
Phase 5
Receptionist ko poora revenue;
dashboard me patient ka naam ya
detail
Jise jitna kaam, utni jaankari. Lists
(baaki, recall) sirf doctor ko
Phase 5 aur 6
Bina paribhasha ka dashboard
number; chhote aankdon par
akela %; pie ya 3D chart
Paribhasha ke bina number par
bharosa nahi hota (6.1)
Phase 6
Dental clinic software: ultra detail build plan
Page 131 of 150

Banane ke tareeke me kya nahi karenge
Jo nahi banega Kyun nahi Detail kahan
Access ke bina backdoor login Staff login ka ek hi darwaza
(Cloudflare Access). Access band
ho to paper downtime procedure
chalta hai
Phase 1
Kisi aur ka code (jaise open-
dentist) bina license aur security
review ke asli data ke saath
chalana
open-dentist MIT licensed hai par
uske README me login ya privacy
ki baat nahi aur sirf 14 commits
hain; sirf schema aur screens ke
idea lo
3.1.2
Asli patient data staging ya local
me; asli CSV chat ya email me;
secrets ya keys repo me; staging
se asli number par SMS
Developer ka apna setup data leak
ka sabse aasaan raasta hai (meri
soch). Asli data sirf developer ke
encrypted laptop par, aur kaam ke
baad hata do
Phase 1, 2, 7, 9, 10
Jo nahi karenge Kyun nahi Detail kahan
Server par PDF banana Free Worker ka CPU time 10 ms hai
(Tech decisions); browser print,
'Save as PDF' aur parche ka JSON
snapshot kaafi
Phase 4
FTS5, aur LIKE '%text%'  search FTS5 tables ke saath D1 export fail
hota hai, aur LIKE '%text%'  poori
table padhta hai (rows-read ka
quota)
Tech decisions,
Phase 2
Route me raw SQL ya SELECT * ;
laga hua migration badalna;
production me destructive
migration ek hi deploy me
Schema ki ek galti se data ja sakta
hai
Phase 1, 9
Paisa float me; umar store karna;
stats counters badha kar; list,
setting ya GST ka hisaab code me
hard-code
Paisa integer paise me, umar DOB
se nikalo, stats hamesha dobara
ginti se, aur sab kuch Settings me
editable taaki sister bina
developer ke badal sake
Phase 1, 2, 5, 6
Dental clinic software: ultra detail build plan
Page 132 of 150

Darja 2: tab tak nahi jab tak shart poori na ho
Jo nahi karenge Kyun nahi Detail kahan
Bhaari framework, kai state
libraries, bhaari chart ya calendar
library
Akele developer ke liye kam
cheezein matlab kam bug aur kam
update (meri soch)
Phase 1, 2, 6
Clinic ke samay me deploy; pilot
ke dauran naye features (change
freeze); gate ko tareekh ke liye
jhukana
Clinic chalte code badalne se
patient ka din bigad sakta hai, aur
'ruko' ka matlab ruko
Phase 9, 10
Shadow ke dauran live SMS ya asli
patient ko software ka receipt;
pehle din poori bheed
Shadow me dry_run  aur paise ki
receipt kagaz ki; pehle din booking
load kam
Phase 10
Hypercare ke 2 hafte me
developer ki chhutti ya travel
Us samay galti sabse jaldi pakdi
jaati hai aur theek karne wala sirf
developer hai (meri soch)
Phase 10
Doctor ke 'mahine me kitni baar'
jawab ke bina koi feature; ek saath
do features
Jo feature koi use nahi karta wo
bug, maintenance aur privacy ka
bojh ban jaata hai
11.1
Cheez Shart Detail kahan
Testimonials, before-after
photos, Google reviews ka
embed, website par doctor ki
photo
Vakeel ya IDA likhit confirm
kare ki DCI ke niyam me
chalega; doctor aur sister tab
faisla karte hain
8.5.2
Dental clinic software: ultra detail build plan
Page 133 of 150

Darja 3: abhi nahi, launch ke baad
In sab ka ek hi raasta hai (11.1): maang 11.1.1 ki sheet me score hoti hai, har 3 mahine ke
review me doctor ke saath top 5 me se ek hi chuna jaata hai (11.1.2), feature flag default off
rehta hai (11.1.4), aur use ki ginti dekhkar rakha ya hataya jaata hai (11.1.5).
Perio chart: 11.2.
Cheez Shart Detail kahan
ABHA ya ABDM integration;
HFR aur HPR registration
Likhit sarkari aadesh (centre
ya clinic ke rajya ka) jo private
dental clinic par lagu ho, ya kisi
scheme ya insurer ki shart, ya
mahine me 10 se zyada
patients ABHA maangein
(meri soch). ABDM abhi
voluntary hai. Har 6 mahine
jaanch. ABHA number ka
optional field alag hai (11.7.2),
wo integration nahi
11.7.1 se 11.7.4, 11.9
DLT par registered SMS 7.1.5 ki teen shartein: SIM par
warning ya band, phone aksar
offline aur receptionist thak gayi,
ya budget badhe. Kharcha
₹ 720 se ₹ 1,296 per saal (meri
ganit) aur upar se entity
registration
7.1.5
Bahar ka paid pen-test Patients badhein. Abhi sirf
ZAP baseline aur manual tests
9.3.7
X-ray par naap (length) DICOM me pixel spacing ya
calibration object pakka ho,
aur tab bhi 'anumanit' label ke
saath
11.5.4
Kuch bhi jo ₹ 1,000 per saal se
bahar le jaye
Sister ki manzoori aur decision
register me 'kab, kitna, kaun
bharega'
Accounts, vendors aur
kharcha section
Dental clinic software: ultra detail build plan
Page 134 of 150

Lab work tracker (crown, bridge, denture ke case): sirf staff ke liye, patient ko lab ka
koi message ya portal entry nahi. 11.3.
Kharcha aur stock: tabhi jab doctor ko fayda dikhe, warna CA ki Excel hi theek hai.
11.4.
Imaging ka agla kadam: X-ray viewer Phase 3 me pehle se hai (3.7.4), DICOM ka kaam
3.7.8 me 'baad me' ginta hai. 11.5.
Digital consent (tablet par sign): software form ko 'baatcheet ka saboot' banata hai,
uski jagah nahi leta; touch-screen sign ki kanooni takat par vakeel se poochho. 11.6.
Doosre doctor ya associate ke liye taiyari: 11.8.3.
Paid plan ka faisla: 11.8.4.
Phase 1 se 10 me bikhre 'baad me' tasks ka pool: unka trigger Phase 11 ki 'Pehle se
likhe baad me tasks' table me.
Nayi maang 'nahi' ho to
Maang aaye aur reject ho to is list me ek line jodo: kya, kyun, aur kab dobara dekhenge.
Isse sister ko bhi pata rehta hai aur 3 mahine ke review me wahi bahas dobara nahi hoti.
Kisi item ko 'kabhi nahi' se 'sharti' me badalna ho to decision register me naya faisla aur
sister ki haan chahiye, aur jahan kanoon ya privacy chhoota ho wahan vakeel ya IDA ki raay
bhi.
Samay aur mehnat (timeline)
Seedhi baat pehle: poora plan (Phase 0 se 10, go-live tak) 1,097 core ghante ka hai
(pehle 1,063; +34 Unified Patient History), aur
'baad me' wale 119 ghante uske alawa. Hafte me 20 ghante dene par pilot se pehle ke 1,015
ghante lagbhag 51 hafte lete hain: pilot Dec 2027 me shuru, go-live ~13 Dec 2027 ke aas-
paas, aur pilot ka review Jan/Feb 2028 me khatam. Ye tab hai jab ghante ke mere anuman sahi
nikle. Pehli baar ke anuman aksar kam padte hain (meri soch, koi data nahi), isliye neeche
0.7 aur 0.5 ki tareekhein bhi hain. Aapne hafte ke ghante nahi bataye; 20 mera andaaz hai
aur sab tareekhein isi par tiki hain, isliye tables me 10 se 30 ghante dikhaye hain.
Isi wajah se plan do raaste deta hai: (1) poora plan jaisa likha hai, (2) pehle sirf staff app live
karo (Phase 0 se 6, backup aur security, pilot), aur reminders aur portal uske baad. Dono ki
tareekhein neeche hain. Meri salaah doosra raasta hai, par faisla aapka aur sister ka.
Dental clinic software: ultra detail build plan
Page 135 of 150

Ghante: phase ke hisaab se
Har task ka size S = 1, M = 3, L = 6, XL = 12 ghante hai (meri andaaz, koi pakka source nahi).
'Core' = go-live ke liye zaruri. 'Baad me' = jin tasks par 'baad me' tag hai; wo Phase 11 ke
pool me trigger par uthte hain. Ginti ek script ne har task ka size jodkar ki hai, haath se
nahi.
Is table me wo samay nahi hai jo developer ke ghante nahi khaata par calendar khaata hai:
sister ke jawab, accounts ki verification, vakeel ya IDA ka reply, pilot ke hafte. Unke liye is
section ka aakhri hissa dekho.
Tareekhein kaise nikali
Shuru: Monday 23 Nov 2026. Shuru kisi aur din hota hai to sab tareekhein utni hi
khisakti hain.
Hafte = ghante / (hafte ke ghante x velocity). Velocity = asli kaam / anuman: 1.0 matlab
anuman sahi, 0.7 matlab har kaam 1.4 guna lamba, 0.5 matlab doguna, 1.5 matlab 1.5
guna tez (maan lo tajurba ya tools ki madad se; meri andaaz, koi data nahi). Velocity me
chhutti, bimari, bugs aur doosre kaam bhi aa jaate hain.
Phase Tasks Kul ghante Core Baad me Kya hai
0 37 73 73 0 Discovery aur taiyari: clinic ke sawal, documents,
accounts, hardware, spike
1 49 111 102 9 Foundation: repo, database, login, app shell, backup
2 47 131 107 24 Patient aur appointment, kagaz ka data
3 57 184 166 18 Clinical record: tooth chart, visit, treatment plan,
files, sahmati, History Stage 1 (+5 tasks / +19h)
4 30 77 69 8 Parcha, dawai ki list aur print (+ History Rx 4.2.8)
5 32 72 68 4 Billing (+ History bills 5.3.16)
6 32 81 73 8 Dashboard, reports, settings (+ History polish 6.7)
7 43 107 97 10 Reminders aur messaging
8 70 178 155 23 Patient portal aur public website
9 36 89 83 6 Hardening: backup, downtime, security, speed,
documents
10 54 113 104 9 Pilot aur go-live
0 se 10 jod 487 1,216 1,097 119 go-live tak
11 44 88 88 0 Launch ke baad, ek ek feature, trigger par
Dental clinic software: ultra detail build plan
Page 136 of 150

Pilot tab shuru hota hai jab Phase 0 se 9 aur 10.1 ke core ghante (1,015; pehle 981)
ho chuke hon, agle Monday ko.
Pilot ka calendar Phase 10 ki stages table se: shadow 2 hafte, software-lead 1 se 2
hafte (maine 2 liye), cutover 1 din, hypercare 2 hafte, samiksha 4 hafte. Go-live = pilot
shuru + 4 hafte. Kisi stage ke ghante developer ki capacity se zyada hon (shadow se
cutover tak 45 ghante, hypercare 21, samiksha 16) to wo stage lamba hota hai.
Phase 11 aur 'baad me' ghante is ginti me nahi hain.
Raasta 1: poora plan, go-live kab
Go-live ki tareekh, hafte ke ghante aur velocity ke hisaab se (pilot se pehle 1,015 core
ghante; pehle 981):
20 ghante per hafta par samiksha ka ant go-live ke 6 hafte baad hai: velocity 1.0 par 10 Jan
2028, 0.7 par 05 Jun 2028, 0.5 par 30 Dec 2028. 10 ghante per hafta par velocity 1.0 me bhi
go-live Nov 2028 tak jaata hai; wahan raasta 2 lagbhag zaruri ho jaata hai, ya hafte ke
ghante badhane padte hain.
Raasta 2: pehle sirf staff app (meri salaah)
Isme pehle aata hai: Phase 0 se 6 (patient, appointment, clinical record, parcha, billing,
dashboard), 8.10 (privacy notice aur kanooni taiyari), 8.2.11 (patient ke anurodh ki staff list;
portal ka form baad me, tab tak anurodh phone ya kagaz se), Phase 9 poora (backup,
security, documents) aur Phase 10 ka pilot. Baad me aata hai: Phase 7 (reminders aur
messaging) aur Phase 8 ka baaki hissa (portal aur public website). Ghante: pilot se pehle
772 (Cut A / raasta 2; pehle 738, +34 History Stages 1–4 in Phases 3–6), pilot ke 82, aur
baad ke 243; teeno milakar wahi 1,097.
Hafte ke
ghante
Velocity 1.5
(tez)
Velocity 1.0 (anuman
sahi)
Velocity 0.7 Velocity 0.5
10 27 Mar 2028 17 Nov 2028 20 Sep
2029
04 Nov
2030
15 25 Oct 2027 27 Mar 2028 11 Oct 2028 09 Jul 2029
20 09 Aug 2027 29 Nov 2027 24 Apr
2028
17 Nov 2028
30 24 May 2027 09 Aug 2027 15 Nov 2027 27 Mar 2028
Dental clinic software: ultra detail build plan
Page 137 of 150

20 ghante per hafta par staff app raasta 1 se 12 hafte pehle live hota hai (velocity 1.0: 06
Sep ke bajay 29 Nov 2027), 0.7 par 17 hafte pehle, 0.5 par 25 hafte pehle. Phase 7 aur 8 ke
243 ghante pilot ke samiksha ke baad lagaen to wo velocity 1.0 par 11 Jan 2028 tak poore
hote hain, yani poora plan lagbhag usi samay (raasta 1 ka samiksha 10 Jan 2028). Faayda
isliye samay ka nahi, jokhim ka hai.
Faayde (meri soch): receptionist roz ka kaam 12 hafte pehle software par karti hai; pehla
pilot chhota aur kam jokhim wala; receptionist ke asli use se Phase 7 aur 8 behtar banenge;
akele developer ke liye chhote mile-stones.
Nuksaan: reminders tab tak receptionist ke manual WhatsApp click se; portal aur public
website baad me; Phase 7 aur 8 ke alag rollout (dry run, portal ka pehla activation) ka kuch
kaam upar ki ginti me nahi hai; pilot ke dauran change freeze hai, isliye Phase 7 aur 8 ka
kaam alag branch par chal sakta hai par live nahi hota.
Cut line me bhi jo nahi katega: backup aur restore (1.x, 9.1), security (9.3), privacy notice
aur consent (8.10.1, 2.2.7, 10.1.14), audit aur issue hue records ke niyam, aur paper
downtime procedure. 'Data kabhi nahi khona chahiye' hamari sabse badi sharat hai, isliye
in par samay bachane ki koshish nahi.
Public website alag nikalna: 8.5 se 8.9 (61 ghante), 8.10 (6), 8.1.3 domain (1), 1.1 repo aur
deploy (16) aur 0.3 accounts (11), yani lagbhag 95 ghante; 20 ghante per hafta par 5 hafte.
Is par patient ka data nahi aata, isliye privacy ka jokhim kam; par staff app utne hafte
khisakta hai, DCI ke niyam (8.5.2) aur vakeel ya IDA ki raay pehle chahiye, aur domain ka
kharcha pehle shuru. Meri salaah: staff app pehle, kyunki uska fayda sister ko roz milta hai;
site tab jab aapko ek chhoti jeet chahiye (motivation) ya sister maange.
Hafte ke
ghante
Velocity 1.5
(tez)
Velocity 1.0 (anuman
sahi)
Velocity 0.7 Velocity 0.5
10 06 Dec 2027 26 May 2028 18 Jan 2029 26 Nov
2029
15 09 Aug 2027 06 Dec 2027 03 May
2028
27 Nov
2028
20 14 Jun 2027 06 Sep 2027 27 Dec 2027 26 May
2028
30 19 Apr 2027 14 Jun 2027 30 Aug
2027
06 Dec
2027
Dental clinic software: ultra detail build plan
Page 138 of 150

Gate ki tareekhein (20 ghante per hafta, pilot se pehle)
Phase ke ant ki tareekh, jama core ghante ke hisaab se. Phase 0 se 6 ka order dono raaston
me wahi hai.
DPDP ki tareekh aur timeline
DPDP Rules 2025 me 18 mahine ka phased period hai, aur zyadatar niyam lagbhag 12 ya 13
May 2027 se lagu hote hain (sources me ek din ka farak, Phase 8 ke sources me PIB ka
link). Software me pehla asli patient data pilot ke shadow stage me aata hai. 20 ghante per
hafta par ye Nov 2027 (velocity 1.0) ya Mar 2028 (0.7) me hai, yani DPDP ke baad; isliye
privacy ki taiyari (notice 8.10.1, breach plan 9.3.9, privacy readiness 9.3.8, consent 10.1.14)
pilot se pehle poori honi chahiye. Sirf bahut tez raftaar par (30 ghante per hafta, velocity
Phase ka gate Jama core
ghante
Velocity 1.0 Velocity 0.7 Velocity 0.5
0 73 19 Dec 2026 29 Dec
2026
13 Jan 2027
1 175 23 Jan 2027 19 Feb 2027 25 Mar 2027
2 282 02 Mar 2027 13 Apr 2027 08 Jun 2027
3 429 22 Apr 2027 25 Jun 2027 19 Sep 2027
4 495 15 May 2027 28 Jul 2027 04 Nov
2027
5 560 07 Jun 2027 30 Aug
2027
20 Dec 2027
6 624 29 Jun 2027 01 Oct 2027 03 Feb 2028
7 721 02 Aug
2027
18 Nov 2027 11 Apr 2028
8 876 26 Sep 2027 04 Feb 2028 28 Jul 2028
9 959 25 Oct 2027 17 Mar 2028 24 Sep 2028
10.1 taiyari, yani pilot
shuru
981 01 Nov 2027 27 Mar 2028 10 Oct 2028
Dental clinic software: ultra detail build plan
Page 139 of 150

1.5) pilot DPDP se kuch hafte pehle aata hai; tab bhi taiyari wahi rakho, kyunki tareekh
kuch hi hafte door hai. 20 ghante aur velocity 1.0 par DPDP ki tareekh tak Phase 4 ka
lagbhag 90% ho chuka hota hai.
Raftaar ki jaanch: Phase 1 ke baad dobara hisaab
Roz 5 minute: date, task number, ghante, ek simple notes file ya sheet me. Isi se asli
velocity nikalti hai; yaadasht se nahi nikalti.
Phase 1 ke gate par: Phase 1 ke asli ghante ko 102 core ghante se bhaag do. Velocity =
102 / asli ghante. Risk register ka trigger: asli ghante lagbhag 133 se zyada (yani
velocity 0.77 se kam).
Misal: Phase 1 me 150 ghante lage to velocity 102 / 150 = 0.68. Phase 0 aur 1 ke baad
pilot tak 806 core ghante bache (981 - 175); 20 x 0.68 = 13.6 ghante per hafta par ye
lagbhag 59 hafte hain.
Trigger lage to: (a) raasta 2 pakka karo, (b) 'baad me' tasks ko pool me hi rehne do, (c)
sister ko nayi tareekh batao. Dobara hisaab har gate par, aur pilot ke baad 10.6.6 me
poore plan ka plan vs asli.
Intezaar wale kaam (ghante nahi, tareekh khaate hain)
Inhe pehle hafte me hi shuru karo, kyunki intezaar ke dauran developer dusra kaam kar
sakta hai par tareekh khisakti hai:
Sister ke jawab (0.5 ki table, khaaskar clinic ka rajya).
Accounts: Cloudflare, domain, Backblaze, Brevo, Healthchecks, uptime monitor;
verification ya card me din lag sakte hain (0.3).
Hardware ki delivery: UPS, backup internet, purana Android phone, printer (0.4).
Doctor ke demo har gate par, clinic ke baad ke samay me (Phase 3 ka tooth chart,
Phase 4 ka parcha).
Vakeel ya IDA ki raay: website content (8.5.2), notice (8.10.1), consent (11.6.1).
DPDP samajhne wale vyakti se notice aur 9.3.8 ka review.
SIM aur recharge ka faisla, aur gateway phone ka setup (0.3.7, 7.1).
Pilot ke 10 hafte: developer ke ghante kam, calendar zyada.
Dental clinic software: ultra detail build plan
Page 140 of 150

Is section me kya pakka hai
Sab ghante meri andaaz hain (har task ke S, M, L, XL size), aur sab tareekhein unse ganit se
nikli hain; koi pakka source nahi. Pakka sirf itna hai ki DPDP ka 18 mahine ka phased period
hai (PIB, upar); uski ek din ki tareekh sources me alag hai.
Sources: kya padha, kya nahi, aur kya abhi anuman hai
Is plan ki har 'pakka' baat ke saath link hai, aur har 'anuman' ke saath likha hai ki kaun sa
task use pakka karega. Yahan mukhya links ka ek jagah ka index hai (baaki us phase ki apni
'Pakka' list me hain), taaki sister ya koi dost developer bina mujhse puchhe check kar sake.
Jaankari 21 November 2026 tak ki hai. Free limits, prices aur sarkari niyam badalte rehte
hain, isliye jis task ka faisla kisi limit ya niyam par tika hai, use shuru karne se pehle uska
link ek baar khud kholkar dekho.
Research kaise hua (seedhi baat)
Kya padha. Web search se mile pages: Cloudflare, GitHub, Backblaze, Brevo,
Healthchecks, UptimeRobot aur SMS gateway ke official docs aur pricing pages,
sarkari sites (PIB, TRAI, MeitY, NHA, ABDM, Clinical Establishments ki site), Supreme
Court ka ek faisla, Dental Council ka code, aur kuch blog aur akhbaar ki khabrein.
Jahan kisi company ka apna fayda ho (jaise software bechne wale ka lekh), use 'vendor
ka daava' maana hai, official docs ke barabar nahi.
Kitna gehra padha. Kuch pages maine browser me poore khole, kuch ek tool se padhe
jo page ka summary-sa jawab deta hai, poora text nahi. Isliye har aankda (khaas kar
paise, tareekh aur kanoon ke clause) link kholkar ek baar dekho: link isi liye diye hain.
Dental Council code ke clause number (jaise 3.3.1, 8.1.3) ek aise summary se aaye hain,
to kisi clause par kuch tay karne se pehle original PDF me dekho.
YouTube. Videos maine nahi dekhe, kyunki mere paas video dekhne ya sunne ka koi
tareeka nahi hai. Aapne YouTube ka naam liya tha, par us par jo kuch hoga wo is plan
me nahi hai. Koi video kaam ka lage to uska link ya text bhej do, main use plan se mila
dunga.
Docplix, MocDoc, Saral aur doosre software. Unke public pages (features, pricing,
demo ka text) padhe. Login ke andar ki screens, asli demo ya unke customers se baat
maine nahi ki, isliye plan me 'wo kya dete hain' hai, 'wo kitna achha chalte hain' nahi.
Features ka tulna pehle wale research doc me hai.
Dental clinic software: ultra detail build plan
Page 141 of 150

Ek aur option dekha: eSushrut@Clinic. PIB ke release ke hisaab se ye C-DAC ka halka
ABDM-enabled HMIS hai, jise Health Minister ne 29 Jun 2026 ko launch kiya. Daily
Excelsior ke hisaab se ₹ 499 per mahina 5 users ke liye, ₹ 200 subsidy ke baad ₹ 299, aur
pehle 3 mahine free. Yani pehle saal lagbhag ₹ 2,691 aur uske baad ₹ 3,588 per saal,
dono ₹ 1,000 ke budget se bahar. Business Standard ke hisaab se uske modules
outpatient, pharmacy aur nursing ke hain (daant ka chart nahi dikha; software maine
khud nahi dekha). Isliye plan me nahi liya, par kabhi budget badhe to dekhne layak hai.
Pakka: kaun sa link kya sabit karta hai
Cloudflare (Workers, D1, R2, Access, Turnstile)
Workers limits aur purana limits page: free plan par 100,000 requests per din (poore
account ki seema), reset subah 05:30 IST par, seema paar hone par Error 1027, har
request par 10 ms CPU, Worker ka size 3 MB (gzip ke baad). Subrequests ka
changelog: ek request me subrequests ki seema (free par 50).
Workers pricing: paid plan kam se kam $5 per mahina, jo ₹ 1,000 per saal ke budget se
bahar hai.
Static assets billing: static files ke requests free aur unlimited, par run_worker_first
wale raaste Worker chalate hain aur 100,000 me ginte hain.
D1 limits aur D1 ka product page: free plan par 500 MB per database, 5 million rows
read aur 100,000 rows written per din, Time Travel 7 din (10 restores per 10 minute).
D1 import aur export: export chalte waqt baaki requests ruk jati hain, aur FTS5 jaise
virtual table wale database ka export nahi chalta (isliye search tokens, 2.1.6). D1 API:
jurisdiction sirf eu  aur fedramp , India nahi.
D1 pricing, Workers Logs aur D1 FAQ: paid plan me 25 billion rows read aur 50 million
rows written per mahina included; Workers Logs free me 200,000 per din aur 3 din ki
retention; upgrade se D1 ki limits aam taur par kuch minute me hat jaati hain.
GraphQL Analytics: Workers ke requests workersInvocationsAdaptive  se padhe ja
sakte hain (Account Analytics read wala token); quota monitor isi par.
R2 pricing: free 10 GB-month, 10 lakh Class A aur 1 crore Class B operations, egress
free. Billing FAQ: card aur PayPal dono accepted.
Zero Trust setup (preview copy): free plan 50 users tak, onboarding me payment
details (official page par nahi, sirf preview copy me dekha).
Turnstile plans aur test keys: challenges unlimited, 20 widgets, har widget 10
hostnames; testing ke liye dummy keys.
Dental clinic software: ultra detail build plan
Page 142 of 150

Framework aur password hash ka bojh: OpenNext ke docs me 3 MiB wali error, ek
developer ka 60 se 120 ms CPU (isliye Next.js nahi), ek developer ka India se D1
response, lagbhag 300 ms, OWASP ke 6 lakh PBKDF2 iterations aur free-tier libraries
ke 20,000 se 80,000 (isliye password ka hash browser me).
Backup aur nigrani (GitHub, Backblaze, Healthchecks, UptimeRobot)
GitHub Actions billing: private repo par 2,000 free minutes per mahina. Usage limits:
public repo me 60 din inactivity par scheduled workflows band. Ek DEV post ka daava
hai ki free personal account ke private repo me schedule chalta hi nahi; official docs
me aisa nahi likha, isliye ye anuman hai (0.6.8).
Backblaze pricing: B2 me pehle 10 GB free, egress average storage ka 3 guna tak free,
transactions free.
Healthchecks pricing: Hobbyist plan $0, 20 jobs, har job ke 100 log entries.
UptimeRobot: help page, unki site aur terms teeno likhte hain ki free plan me
commercial use bhi chalta hai (50 monitors, 5 minute ke check, credit card nahi).
Doosre blogs 2024 se 'sirf non-commercial' likhte the, aur ek HostTracker article ke
hisaab se terms May 2026 me phir badle. Isliye signup par terms khud padho (0.3.5).
Email, SMS, WhatsApp aur TRAI
Brevo FAQ, Brevo plans aur Brevo email API: free plan 300 emails per din, koi time limit
nahi; 'Sent with Brevo' logo hatana paid hai.
SMS gateway: pricing (local server free aur unlimited; cloud server par kuch
seemayein ho sakti hain aur roz 1,000 se zyada ke liye unse baat karni hai), webhooks
(HMAC-SHA256 se signed, 14 baar tak retry, system:ping  aur app:started  events),
encryption (device-paired E2E; E2E ke bina cloud server text aur numbers dekh sakta
hai) aur author ka lekh (phone ke ack ke 15 minute baad message data hash ho jata
hai).
WhatsApp: click-to-chat ka FAQ ( wa.me  link ka format) aur Terms of Service (bulk aur
automatic messaging mana, account band ho sakta hai).
TRAI: Third Amendment 2026 ka press release (18 Sep 2026): AI aur ML se spam
bhejne wale numbers pehchane jaate hain; 10 din me 5 ya zyada numbers flag hon ya 3
shikayatein (AI flag ke saath) aayein to kadi karwai. 2024 consultation paper: shak
wale unregistered telemarketer par 20 call aur 20 message roz ka 'usage cap' (aam
SIM par nahi). Saza ke detail sirf news me: Moneylife aur FoneArena. Purane 100 ya
200 SMS per SIM ke niyam sirf 2011-12 ki khabar me hain.
DLT ka kharcha (vendor pages): smsgatewayhub aur Fast2SMS; dono ke aankde alag
hain.
Dental clinic software: ultra detail build plan
Page 143 of 150

Kanoon, privacy aur tax
DPDP Rules 2025: PIB ka PDF aur SCC Online: 13 ya 14 Nov 2025 ko notified (sources
me ek din ka fark), 18 mahine ka phased period; Rule 6 (security safeguards), Rule 7
(breach par bina der batana, Board ko 72 ghante me vistrit report), Rule 9 (sampark
jaankari), access aur erasure ke anurodh par 90 din me jawab. Taxmann: operational
niyam 13 May 2027 se (kuch sources 12 May likhte hain). LiveLaw: dhara 7(a) ('khud di
hui' jaankari) par vyakhya; unka kehna hai ki ye tabhi surakshit hai jab data dene wala
khud pahal kare.
Dental Council aur IDA: DCI Code of Ethics 2014 (TN Dental Council ki copy): records
kam se kam 3 saal (3.3.1), kisi ko inducement ya rebate nahi (8.1.3), website par sirf
tathya (8.2.8, 8.2.9), confidentiality (4.2). Isme 'informed consent' ka alag clause nahi
mila. IDA code of ethics aur IDA record keeping: records kam se kam 3 saal, aur IDA 8
saal (records, X-ray, photos) rakhne ki salah deti hai.
Samira Kohli (2008): Supreme Court ka faisla aur PMC ki tippani: 'real consent' par zor;
ek jaanch ya procedure ki sahmati bade operation ki sahmati nahi. Maine faisle ke
hisse aur tippaniyan padhi, poora faisla nahi.
GST aur cash: TaxGarden (dental sewa GST se mukt, entry 74), Taxmann ka AAR note
(dental clinic ki healthcare sewa par GST nahi), Maharashtra AAR ki khabar (whitening
aur veneers jaise sundarta ke kaam par 18%; ek rajya ka AAR, doosre par zaruri nahi)
aur Income-tax Act ki dhara 186 (2 lakh ya zyada cash lene ki seema). Ye CA ke sawalon
(5.1.1) ka aadhar hai, salah nahi.
Clinic registration aur ABDM
Clinical Establishments Act: MoHFW ki site aur site ki list: 2010 ka Act sabhi clinical
establishments par, single doctor clinics bhi, par sirf un rajyon aur UT me jinhone ise
apnaya (list badalti rahi hai). DGHS ka note: baaki rajyon ke apne Acts (unki details
maine nahi padhi). FAQ: registered clinic ko certificate aur dar dikhane hain. Ek
akhbaar ki khabar: records aur reports rakhna bhi in niyamon me.
ABDM: PIB (voluntary), HIP/HIU guidelines (facility pehle HFR me, professionals HPR
me), HPR FAQ (HPR voluntary), NHA ka clarification (ABHA voluntary; page par
original tareekh nahi). Aadesh medical colleges ke liye (Udaipur Times, Telangana
Today), aur J&K ka 17 Oct 2023 ka order clinics ke liye (Greater Kashmir, sirf khabar).
Nirmitee ka vendor blog: PM-JAY hospitals ke liye ABDM status incentives se juda.
Clinical design aur imaging
Dental clinic software: ultra detail build plan
Page 144 of 150

Perio charting: SDCEP baseline charting (har daant ke 6 sites; 4 mm ya zyada wale
likhna), review charting (sirf 4 mm ya zyada aur bleeding wale likhna kaafi) aur PSR
chart (har sextant ka sabse kharab naap). Ye Scotland aur US ke reference hain,
parameters doctor tay karti hai.
Viewer aur chart ke open-source: OHIF aur Cornerstone dono MIT licensed; open-
dentist (MIT, sirf 14 commits, auth ke docs nahi) aur react-odontogram (MIT, sirf poora
daant dikhata hai, surface nahi).
Go-live aur migration
HealthIT.gov (go-live checklist, patients ke liye notice), NLC checklist (4 hisse),
Physitrack ki guide (vendor blog: parallel test, rollback plan, cutover rokne ka
maapdand, super-user, asli record kaun sa), TMA, OpenEMR wiki aur PCC (purane
kagaz charts ke raaste, sab US ke) aur PMC table (go-live ke dauran capacity kam
rakhna).
Anuman: jo abhi pakka nahi hai aur kaun sa task use pakka karega
Neeche wo baatein hain jo plan me 'anuman', 'meri soch' ya 'maine check nahi kiya' likhkar
aayi hain. Har ek ke saath wo task hai jo use pakka karega. Jab tak wo task nahi hota, in par
koi paisa, tareekh ya kanooni faisla mat tikao.
Area Baat Kyun anuman hai Pakka kaun karega
Platform R2 chalu karte waqt card
maanga jata hai ya nahi
sources alag alag
kehte hain
0.6.6
Platform Backblaze B2 signup par
card maanga jata hai ya
nahi
kisi source me nahi
dekha
0.6.8
Platform GitHub ka schedule free
personal account ke
private repo me chalta hai
ya nahi
ek DEV post kehti
hai nahi chalta,
official docs me
aisa nahi likha
0.6.8, 9.1.2
Platform Zero Trust (Access)
onboarding me payment
details maange jate hain
sirf docs ki preview
copy me dekha
0.6.4
Platform Kaun sa Indian card
Cloudflare par chalta hai
pakka nahi, PayPal
ka vikalp hai
0.3.3
Dental clinic software: ultra detail build plan
Page 145 of 150

Area Baat Kyun anuman hai Pakka kaun karega
Platform Access ke JWT verify aur
password ke HMAC verify
ka Worker CPU
meri ganit, naapa
nahi
0.6.4, 0.6.5
Platform D1 ka India se asli response
time
sirf ek developer ka
bayan (lagbhag 300
ms)
0.6.2
Platform D1 me index ki rows bhi
'rows written' me ginti hain
meri samajh,
official docs me
nahi dekha
0.6.2 (3.5.5 ka hisaab isi
par)
Platform Batch me 0 rows wala
INSERT batch ko fail nahi
karta
meri samajh 0.6.3
Platform LIKE ka index optimisation
BINARY column par nahi
chalta (isliye range query)
ek SQLite forum
post
2.1.6, 0.6.2
Platform D1 me triggers chalte hain
ya nahi
docs se pakka nahi
kiya
3.2.6 (9.3.6 isi par tika
hai)
Backup Export ka asli samay aur
block ki avadhi (database
badi hone par)
docs me samay
nahi likha
0.6.8, 9.1.3 (har run ka
samay ping me), 9.1.7
Backup Poora restore 4 ghante me meri soch 9.1.7
Backup age aur rclone ke kadam meri jaankari, docs
se nahi milaye
0.6.8, 9.1.3 se 9.1.5
Backup Kharab deploy ka rollback
kaise (wrangler ke kadam)
test karke likhna
hai
9.2.4
Monitor UptimeRobot free plan ki
shartein
official pages aur
blogs me farak
0.3.5 (signup par terms)
SMS Appointment reminder
TRAI ke hisaab se
'commercial' hai ya nahi,
normal SIM se theek ya DLT
zaruri
grey area 0.3.7, 7.1.4 (operator ya
telecom vakeel)
Dental clinic software: ultra detail build plan
Page 146 of 150

Area Baat Kyun anuman hai Pakka kaun karega
SMS TRAI ki saza kitni sirf news reports 7.1.4
SMS Purane 100 ya 200 SMS per
SIM ke niyam aaj lagu hain
ya nahi
sirf 2011-12 ki
khabar
7.1.4
SMS DLT ka asli kharcha (vendor
blogs me entity fee ₹ 0 se
₹ 5,900)
vendor pages,
aapas me alag
7.1.5
SMS Gateway ke chhote sawal:
duplicate id, ttl, ping ka
interval, reboot ke baad
auto-start, JWT, cloud
server ki shartein
docs me saaf nahi 7.1.2
SMS Gateway ke OAEP me
MGF1 SHA-1 aur PBKDF2-
SHA1 ka Worker me chalna
aur CPU
meri jaankari, docs
ki chetavni isi ki hai
7.1.3
SMS Roz ke lagbhag 25 message
aur saal ke lagbhag 7,200
SMS
meri ganit 7.1.5, asli ginti 10.6.1
WhatsApp WhatsApp Business app ki
shartein
maine padhi nahi 7.2.2 (ManualWhatsApp
adapter) chalu karne se
pehle
Privacy DPDP Fourth Schedule ka
asli text (bachchon ke data
me healthcare ki chhoot)
PIB overview se,
text nahi padha
8.10.1 (DPDP samajhne
wale ko dikhao)
Privacy Rule 6 me log kitne din
rakhne hain (meri yaad: 1
saal)
original se milana
hai
8.2.12
Privacy Free plan me kitne WAF ya
rate-limit rules milte hain
ek blog 1 rule likhta
hai
8.2.13
Site _headers  file Workers
static assets par chalti hai
ya nahi
meri jaankari 8.6.8
Dental clinic software: ultra detail build plan
Page 147 of 150

Area Baat Kyun anuman hai Pakka kaun karega
Site not_found_handling  ek
Worker me ek hi mode
meri jaankari, docs
ke routing page se
milana
8.6.8
Site Core Web Vitals ke
thresholds (LCP 2.5 s, INP
200 ms, CLS 0.1)
meri jaankari 8.6.6
Site Cloudflare Email Routing
se info@ ka forward
docs maine nahi
dekhe
8.5.5
Site Turnstile ke cookies ya
storage
check nahi kiya 8.10.4
Site DCI ke hisaab se website
par doctor ki photo,
testimonial, before-after
seedha clause nahi
dekha, clause 8.5 ka
text saaf nahi
8.5.2, 8.5.4 (vakeel ya
IDA)
Site Google Business Profile ki
policy aur India me
verification ka tareeka
meri jaankari 8.8.1
Tax Presumptive tax (44ADA)
me cash aur digital ke
share ki shart
ek blog me zikr,
pakka nahi
5.1.1 (sawal 6)
Tax Kaun se procedures
sundarta ke maane jayenge
(18% GST)
sirf ek rajya ka AAR
mila
5.1.1 (sawal 2)
Pilot Go-live ke baad 10 se 25%
productivity girna (2 se 4
hafte), duplicates 8 se 12%
US ke bade
practices ka
consultancy blog,
chhote clinic ka
data nahi
10.1.4 ka baseline, 10.6.1
Pilot 3 se 4 hafte ki parallel
avadhi, receptionist ka 30
minute extra, 20 se 30%
kam booking, rollback 'agle
kaam ke din se kagaz par'
meri soch 10.2 (Stage 1 aur 2), 10.6.1
Dental clinic software: ultra detail build plan
Page 148 of 150

Area Baat Kyun anuman hai Pakka kaun karega
Pilot Raftaar ke targets: naya
patient 2 minute, purane ka
check-in 30 second, din
band 15 minute
meri soch 10.1.4 ka baseline, 10.2.10
Pilot Bugs ka buffer (12 aur 12
ghante)
meri soch 10.2.13, 10.4.8
ABDM M1 se M3 milestones, 'kam
se kam do par exit' niyam, 6
se 9 mahine
vendor blogs;
niyam ek forum
jawab se (Nirmitee
ke hisaab se)
11.7.4
ABDM HFR ya HPR registration ki
fee aur zaroori documents
kisi source me nahi
dekhi
11.7.3
ABDM J&K order ka original text
aur apne rajya ka niyam
sirf akhbaar ki
khabar
11.7.1, 11.9.1
CE Act Un rajyon ke apne Acts ki
details jinhone CE Act nahi
apnaya
maine padhi nahi 11.9.1
Consent Touch-screen sign ki
kanooni takat
meri jaankari 11.6.1
Imaging DICOM header me patient
ka naam, Cornerstone ka
bhaarapan
meri jaankari 11.5.1 (aur 3.7 ka natija),
11.5.2
Perio Attachment level = pocket
depth + recession,
bleeding percent ka
formula
meri jaankari 11.2.2 (doctor se confirm
karke)
Seemayein Mahine me 5 perio charts,
150 naye patients, 70% size
jaisi seemayein aur Phase 11
ke ghante
meri andaaz 11.2.1, 11.8
Timeline Saare ghante (1,063 core)
aur dates
meri ganit, kisi
source se nahi
Phase 1 ka gate (asli
ghante se dobara)
Dental clinic software: ultra detail build plan
Page 149 of 150

Is table me wahi baatein hain jo plan me khud anuman maani gayi hain. Agar koi link kholne
par kuch aur nikle (page badal gaya ho), to us daave ko yahan 'galat' ya 'badla hua' likho aur
us task ka 'Done jab' dobara dekho.
Dental clinic software: ultra detail build plan
Page 150 of 150

# Phase Q: quality, safety aur redesign (2026-11-23 ko joda, Phase 8 se PEHLE chalta hai)
Kyun: browser audit (docs/ui-audit/, docs/product-audit/) me 3 bug mile jo roz ka kaam rok dete the (doctor visit nahi khol sakti, prescription issue nahi hoti, bina note ke booking fail), paise ki galtiyan (zyada amount chup-chaap advance, refund se baaki nahi badla), aur adhi screens adhoori dikhti thi. Unit tests ye nahi pakad paaye, isliye is phase ka sabse bada niyam: **koi task tab tak done nahi jab tak uska "Done jab" asli browser me (Playwright, http://localhost:8787, jitne role us screen ko use karte hain sab) chala na ho aur pnpm check hara na ho.**
Kaise chalta hai: poore task ka matlab, har file, test aur design docs/PHASE_Q.md me hai. Neeche har task ka saar hai: kya, kahan se kya lena hai, kaise banana hai, kya nahi karna, Done jab. Tasks 5 PARTS me bate hain (ek lambe session me ek Part): Part 1 = Q0.1-Q0.7 aur Q0.G. Part 2 = Q1.1-Q1.6. Part 3 = Q1.7-Q1.11 aur Q1.G. Part 4 = Q2.1-Q2.6. Part 5 = Q2.7-Q2.13 aur Q4.1. Q3.x baad ka phase hai. Ek Part ke tasks order me, har task ke baad local commit, kabhi push nahi.
Sab kuch: AGENTS.md ke niyam (chhota badlav, no new dependency, file 300 line se chhoti, ek niyam ek jagah, fake data, UI sirf English). UI task se pehle docs/design/proposal/README.md me us screen ki .dc.html file padho (laptop aur phone dono) aur docs/ui-audit/REVIEW_CHECKLIST.md ki list final message me tick karo. Design copy nahi karte, React me dobara banate hain. Jis screen ka design nahi, wahan sabse nazdeeki screen copy karo aur final message me likho.
Decisions D1-D8 owner ne maan li hain (docs/DECISIONS.md). D1 (refund ke baad baaki wapas khulta hai) CA se confirm hona baaki hai.

## Part 1: bugs aur paise ki suraksha (DONE)
Q0.1 Browser tests chalne layak (S). DONE 3db0ab0. playwright.config.ts ka base URL localhost:8787 (Worker ka APP_ORIGIN yahi hai, 127.0.0.1 par har write 403 deta tha), har run par naya scratch database (owner ka local DB half-migrated hai), e2e/write-smoke.spec.ts. Chromium owner ne install kiya (pnpm exec playwright install chromium).
Q0.2 Double JSON encoding (C1) (M). DONE d82cdd9. 6 nahi 14 files me body do baar stringify ho rahi thi (6 feature api.ts + 8 print screens). api() ab string body par error deta hai, unit test. Doctor ka poora flow bina 4xx/5xx.
Q0.3 Prescription Issue (C3) (S). DONE 1b516fb. VisitMedicinesPanel.tsx me saveMeta ab saved rx lautata hai aur Issue uska version use karta hai. e2e issue, reload, print page. Fix hatao to test fail.
Q0.4 Bina note ke booking (C4) (S). DONE 7adab64. QuickBookDialog.tsx ab note khaali ho to undefined bhejta hai (null nahi). Shared schema test, e2e/booking.spec.ts (purane code par fail).
Q0.5 Core-loop browser test (M). DONE 38a059d. e2e/core-loop.spec.ts: register, walk-in, visit, prescription, finalise, bill, do payment, statement. CI me chalta hai.
Q0.6 Payment safety (M). DONE 9fed82e. Server amount > baaki ko mana karta hai jab tak allowAdvance:true na ho (error me taaza balance). "Full balance" aur "Half" sirf Amount bharte hain. Zyada amount par "Change amount / Record as advance". 0 ya negative par sentence, form Cash par reset.
Q0.7 Refund aur balance (M). DONE 9c93038 (D1 maana, CA confirm baaki). Refund se bill ka baaki wapas khulta hai (paidByBill), statement me payment aur refund dono dikhte hain, refund ke baad bill cancel ho sakta hai.
Q0.G Gate P0. DONE add3c99 (G01 aur D03 bina repair).

## Part 2: roz ka workflow (DONE)
Q1.1 Visit se bill tak ki chain (M). DONE 15e50dd. Procedures pehle tab par, Finalise ki chetavaniyan (diagnosis nahi, procedure nahi, prescription issue nahi) features/visits/finalise-warnings.ts me, "Create bill" band hone ka karan. D2: addendum se procedure nahi jud sakti.
Q1.2 Ready to bill (M). DONE 1e9faa3. repos.bills.readyToBill, "Ready to bill" stat card, receptionist ki Today row par Take payment.
Q1.3 Receipt aur payments list (M). DONE fe847d3. Toast "₹500 recorded. Receipt SR-... Print", PaymentsList patient ke Billing tab par aur Bill screen par (Bill screen par payment form bhi aaya).
Q1.4 Cancel, Missed, Reschedule (L). DONE 50fd9d4. AppointmentActions "..." menu: Today row, calendar panel, patient ka Appointments tab. Cancel aur Missed ke liye karan zaroori, Missed appointment shuru hone ke 15 minute baad hi. Close-day ke blockers me patient ke naam.
Q1.5 Messages ki safai (L). DONE 20d338c. Appointment badalne ya cancel par purane messages "out of date", ek naya "moved" message, bachche ka message guardian ke number par, past appointment ya bina number ke message nahi bante, reminder par "due" time.
Q1.6 Chup-chaap fail nahi (M). DONE a66f7e4 aur db4ea3d. Timings me sentence aur Save band (karan ke saath), visit conflict par banner (text bacha rehta hai, "Copy my text", "Reload visit"), band buttons ke neeche karan, offline me screen bani rehti hai aur server actions karan ke saath band.

## Part 3: logic, rights aur phone
Q1.7 Discount hand-off (M). DONE 1a6774c, 87e09dc. Request se total nahi badalta, doctor ki Today par "Waiting for you" (features/billing/WaitingForYou.tsx) me Approve.
Q1.8 Data aur form ke niyam (L). DONE f0ca914. Gender zaroori (default nahi), next appointment ka ek niyam, future DOB ka sentence, procedure list khaali se shuru, guardian group under-18 par khud khulta hai, "Same person?" prompt.
Q1.9 Walk-in aur galat bill ka raasta (M). DONE 804fad0 (migration 0056 bill_cancel_requests, owner staging par lagayega). Top-bar Walk-in ab chalta hai, receptionist doctor se bill cancel karne ko kah sakti hai, doctor ke cancel panel me "Refund first".
Q1.10 Phone ke toote screens (M). Kyun: audit F02/F03 me receptionist ki Today 360 px par 441 px chaudi thi (cards kat-te the, "In chair" aur "Cancel" buttons screen se bahar ya "+" ke neeche), aur dant ka chart phone par 774 px, tablet par 838 px chauda tha, har dant ~32x9 px. Part 2 ke repair (c3f1e43) ne Today ki rows 360 px par sudhari, to pehle dekho kya bacha hai. Kahan se kya: apps/web/src/features/chart/ToothChart.tsx, chart-layout.ts (aur uska test chart-layout.test.ts), chart.css; Today ke liye features/today/today.css, today-cards.css, TodayList.tsx. Design: docs/design/proposal/PhoneToday.dc.html, PhoneVisit.dc.html. Kaise: (1) docs/ui-audit/runner/f02.mjs se Today (asli rows ke saath, seed data) aur Chart ko 360 aur 768 par naapo. (2) Chart: do rows me 16 dant, har dant 44 px ka tap area, chart apne card ke andar width par fit ya card ke andar hi scroll (page nahi), "W" button ko samjhao ya hatao, teeno dropdown (Chart as of, Apply condition, Dentition) wrap hon. (3) Today: ek column, row ke action naam ke neeche, "+" ke liye 80 px neeche jagah. Kya na karo: chart ka data ya logic mat badlo, sirf layout. Done jab: f02.mjs ke measure me Today aur Chart par 360/768/1366 par sideways scroll nahi aur dant 44 px ya zyada; Playwright e2e me ek spec jo 360 px par receptionist ki Today row ka "In chair" button dabata hai.
Q1.11 UI me access control (M). Kyun: audit F01 me receptionist address se "New medical certificate" ka khaali form khol sakti thi jise wo bhar nahi sakti, aur Settings > Medicines/Billing padh sakti thi. Server har clinical read par 403 deta hai (ye achha hai, tod mat dena). Kahan se kya: packages/db/src/permissions.ts (certificates.write sirf doctor), apps/web/src/features/certificates (NewCertificateScreen), features/settings/catalog.ts (har section ki permission), useMe() ka permissions, ui/PageMessage.tsx (wahi "You do not have permission" page). Kaise: (1) doctor-only forms par permission na ho to wahi permission page dikhao jo visit par dikhta hai. (2) D4: receptionist Settings > Medicines aur Billing nahi khol sakti (catalog me permission lagao, menu se bhi chhupao). (3) e2e/role-matrix.spec.ts: docs/ui-audit/runner/f01.mjs ki pages aur API ki list (visit, prescriptions, chart events, errors, certificates, settings) par receptionist ko expected 403 ya permission page; doctor ko 200. (4) docs/AUTH_PLAN.md me receptionist ka Settings view likho. Done jab: spec pass, aur kisi doctor-only page ko receptionist ke liye khula chhodne par fail.
Q1.G Gate A. Kya: runner scripts (docs/ui-audit/runner/) ko nayi payment UI (Full balance sirf field bharta hai, overpay confirm, naya Bill screen) ke hisaab se update karo, phir flows G01, G02, G08, H01, H02, D02, D03, D05, D06, F02 bina harness repair chalao. Har flow ki docs/ui-audit/flows/<id>.md aur verdict.json me nateeja badlo, docs/ui-audit/AUDIT.md me jo theek hua uska status "fixed" likho, docs/STATE.md me "Gate A: passed ya passed with exceptions" aur exceptions ki list. Jo flow abhi audit nahi hue (ROADMAP "Next audit") unke naye flow files banao. Done jab: sab 10 flows bina unexpected 4xx/5xx chalte hain.

## Part 4: redesign, pehla hissa (laptop aur phone dono)
Rule: har Q2 task laptop screen AUR uski phone screen (Phone*.dc.html) dono banata hai. Done tabhi jab 360, 768, 1366 px par sideways scroll nahi, har target 44 px+, action naam ke neeche, bottom tabs aur "+" design jaisa. Check: docs/ui-audit/runner/f02.mjs (phone), f03 (tablet).
Q2.1 Neev: shared pieces aur 8 item ka sidebar (L). Kyun: margin har screen par alag (0, 16, 24, 72 px), status ke shabd system wale (in_chair, draft), teen date formats, paise kabhi paise ke saath kabhi bina. Kahan se kya: apps/web/src/ui/ (StatCard, StatusBadge, Tabs, form/, table/, shell/), apps/web/src/ui/shell/nav-items.ts (MAIN_NAV me 7 item, PHONE_TABS), StaffShell.tsx, apps/web/src/styles/base.css (tokens), packages/shared/src/time.ts (istDate, istDateTime, formatClockTime), money.ts (formatRupees), appointment-display.ts (status ka text, dekho kya karta hai). Design: docs/design/proposal/Sidebar.dc.html, PhoneTabs.dc.html aur IDEAL_EXPERIENCE.md section 0 ki vocabulary table. Kaise: (1) ui/ me PageContainer (max 1200, gutter phone 16, laptop 24), PageHeader (title 26/700 navy, optional ek line, ek primary button), Card, ListRow, EmptyState, StatusLabel plus ek status-map (scheduled/confirmed=Booked, arrived=Waiting, in_chair=In chair, completed=Done, no_show=Missed, cancelled=Cancelled; visit Draft/Final; bill Draft/Open/Paid/Part paid/Cancelled, rang DESIGN.md ke status pairs se, draft aur scheduled neutral grey). (2) packages/shared me formatDate (screen "Tue 24 Nov", saal tabhi jab is saal ka na ho), formatMoney (paise jab zero na ho: ₹649.50 aur ₹2,500), formatDuration ("10 h 23 min", "Under 1 min"), plural helper ("1 appointment"); sab ke unit tests. (3) nav-items.ts me 8vi item "Library" (to "/app/library", permission wahi jo lists edit karne ki hai, dekho permissions.ts), routes/StaffRoutes.tsx me /app/library ka khaali placeholder jo Q2.13 bharega. (4) features/style-guide ki screen me naye pieces dikhao. Kya na karo: abhi purani screens ko mat badlo (wo Q2.2 se), sirf nayi cheezein banao aur ek-do screens par lagakar dikhao. Done jab: helper tests, style guide me naye pieces, sidebar me 8 item (Library receptionist ko tab dikhe jab D4 allow kare), browser me 360/768/1366 par nav theek.
Q2.2 Shabd, date aur paise ka format sab jagah (M). Kahan se kya: features/today/buildTodayModel.ts ("Waiting 623 min" ka text), features/appointments/DayView.tsx, DayCard.tsx, features/patients/PatientOverviewTab.tsx, PatientAppointmentsTab.tsx, features/history (feed), features/billing, features/visits (VisitPatientStrip, RecentVisitsSide), features/print (bill, statement, history summary: print par dd/mm/yyyy). Kaise: grep karke har jagah naye helpers aur StatusLabel lagao, purane toLocale... ya hath ke format hatao. Done jab: ek hi appointment Today, Calendar aur History me ek hi shabd me dikhe; koi raw "in_chair" ya "2026-11-23" screen par nahi; docs/ui-audit/runner/ ki flows ke screenshot me teeno formats ek jaise.
Q2.3 Billing hub aur Bill screen (L, 2-3 session). Kyun: Billing nav sirf "Outstanding dues" kholta hai (na bills ki list, na naya bill, na aaj ki collection), Bill screen bina patient ke naam ke aur bina styling ke, patient ke printed bill par andar ki baatein ("gst_mode off — DRAFT accountant", "Doctor registration number missing in Settings"). Design: docs/design/proposal/Billing.dc.html, Bill.dc.html, PhoneBilling.dc.html, PhoneBill.dc.html. Kahan se kya: features/billing/BillingHomeScreen.tsx (hub banega), BillScreen.tsx, BillDraftItems.tsx, BillDiscountPanel.tsx, BillCancelPanel.tsx, BillCancelRequestPanel.tsx, PaymentTakeForm.tsx, PaymentsList.tsx, WaitingForYou.tsx, DailyClosePanel.tsx, CaExportPanel.tsx, RefundPanel.tsx, billing.css; print/PrintBillScreen.tsx aur print ki receipt screen; worker me bills repo aur routes (grep "bills" apps/worker/src/routes, packages/db/src/repos). Kaise: (1) Hub ke 4 tabs: Today (aaj ki collection, mode ke hisaab se, payments list), Dues (ageing ke 3 cards 0-30/31-60/60+, filter, row: naam+number chip, baaki, din, aakhri call note, Take payment, Call note, WhatsApp), Bills (khoj aur filter; agar list ka endpoint nahi hai to GET /api/staff/bills paging ke saath jodo, receptionist ko bhi, sirf paise ka data), Day close (apna tab, DailyClosePanel; expected cash bada, counted cash, fark live, note sirf fark par). CA export ko Reports ya Settings me le jao. (2) Bill screen: header me bill number, patient naam aur P-chip, status chip; cards Items table, Totals, Payment (Q0.6 ka card), Payments (Q1.3), Discount, menu "..." me Cancel (doctor) ya "Ask the doctor to cancel" (receptionist). (3) D5: finalised visit se bill seedha issued bane, "Review first" chunne par hi draft; ye domain badlav hai (bill number gap-free, ek hi db.batch me, audit row) isliye domain test pehle. (4) Andar ki baatein screen aur print dono se hatao; Settings ke setup progress card (Q2.13) me "Registration number daalo" jaisi chetavani jaaye. (5) Bill print me payment lines aur baaki jodo. Done jab: docs/ui-audit/runner/ ke d03, d05, d06 naye screens par chalte hain; printed bill me koi internal sentence nahi; Billing hub aur Bill 360/768/1366 par theek.
Q2.4 Visit ek screen par (L, 2-3 session). Kyun: visit 6 tabs me bata hai, chart aur procedures tab 2 par, medicines tab 4 par, Finalise upar door; doctor ke liye bahut tab-badalna (G01: 30 click, 5 tab switch). Design: docs/design/proposal/Visit.dc.html aur PhoneVisit.dc.html (S05 ka vistaar). Kahan se kya: features/visits/VisitScreen.tsx (173 line, yahi jodta hai), VisitTodayPanel, VisitNotesForm, VisitChartTab, VisitProcedures, VisitDiagnoses, VisitNextSteps, VisitFinaliseBar, VisitAddenda, RecentVisitsSide, SaveStatusChip, VisitPatientStrip, finalise-warnings.ts, useVisitAutosave.ts; features/prescriptions/VisitMedicinesPanel.tsx; features/chart/ToothChart.tsx. Kaise: (1) Upar header strip: naam, umar, number chip, Draft/Final chip, alerts (allergy, medical alert) lal chip jo hamesha dikhe. (2) Peela draft banner (S05). (3) Kaam ka hissa upar se neeche: Chart (2 row, 44 px dant, condition chips), uske neeche "Procedures done" chips (fee ke saath), Complaint aur Findings aamne-saamne, Diagnosis chips, Next visit chips (2/4/6 hafte, Pick date), Advice; kam kaam wale (history, gums, vitals) "More" me. (4) Prescription tab nahi, ek chhota panel (search, quick sets, table, Issue, Print). (5) Daayi side: Last visits (3 chhote card, save par refresh), baaki balance, agli appointment. (6) Sabse neeche sticky bar: "Saved 10:42" ya fail ka banner, beech me checklist (Diagnosis, Procedures, Prescription issued) finalise-warnings.ts se, daayen Finalise. Plan, History, Files tabs rahenge. (7) Finalise ke baad read-only text (khaali fields chhupao), banner "Final. Ready to bill", "Create bill" (karan ke saath band), "Open next waiting patient: <naam>"; addendum "Add addendum" button ke peeche. (8) Phone: wahi kram, chart apne card ke andar scroll, bar bottom tabs ke upar. Kya na karo: autosave, version-conflict banner (Q1.6), finalise ka domain mat badlo. Files 200 line se chhoti rakho (VisitMedicinesPanel pehle se 462 line ka hai, ise tod kar hi jodo). Done jab: docs/ui-audit/runner/g01.mjs doctor ka hissa bina tab badle poora hota hai (pehle 5 tab switch), e2e core-loop pass, 360/768/1366 par theek.
Q2.5 Dono Today screens (L). Design: docs/design/proposal/Main.dc.html, DoctorToday.dc.html, PhoneToday.dc.html. Kahan se kya: features/today/TodayScreen.tsx, TodayList.tsx, buildTodayModel.ts, statusActions.ts (aur test), NextPatientCard.tsx, CallList.tsx, DoctorToday.tsx, DoctorDayList.tsx, IncompleteVisitsWidget.tsx, WalkInDialog.tsx; features/billing/WaitingForYou.tsx. Kaise: Receptionist: stat strip Booked, Waiting, In chair, Ready to bill (aur "Waiting longest 12 min"), har row me ek primary action jo state se badle (Booked->Arrived, Waiting->Send in, In chair->Done, Done aur baaki->Take payment), baaki "..." menu me (AppointmentActions pehle se hai), ek Walk-in button, "To follow up" (Missed aur dues). Doctor: Now (bada card, Open visit), Next (3 tak), "Waiting for you" (discount, adhoori visit, unissued prescription, patient request) har ek ek line link, "Rest of the day" band. Done jab: dono role ke liye 360/768/1366 par design jaisa; statusActions.test.ts naye action table ke saath; docs/ui-audit runner ki Today wali flows chalti hain.
Q2.6 Patients list aur profile (M). Design: PDF S02, S04 aur docs/design/proposal/PhonePatients.dc.html, PhoneProfile.dc.html. Kahan se kya: features/patients/PatientsScreen.tsx (ui/table/DataTable), PatientSearch.tsx, PatientProfileScreen.tsx, PatientProfileHeader.tsx, PatientOverviewTab.tsx, patient-tabs.ts; worker ka patients list endpoint (grep "patients" apps/worker/src/routes) aur repo. Kaise: (1) List me columns Last visit, Next appointment, Due; filter chips All, New this month, Balance due, Not seen 6 months, Archived; dusra in-page search hatao (upar wala rakho); phone par card, keyboard wali hint chhupao, poora card link. Iske liye list API me last visit, next appointment (Q1.8 wala ek niyam) aur baaki ka amount jodo (receptionist ko paise ka sirf baaki, clinical kuch nahi). (2) Profile Overview par khule, ek contact line (mobile ya "Contact: Sunita (mother)"), alerts lal chip, role ke hisaab se actions (receptionist: Take payment, Book; doctor: New visit, Book), Overview cards: Next appointment, Balance (Take payment), Last visit, Details. Done jab: due wala patient list me bina khole pehchana jaye; profile Overview par khule; 360/768/1366 par theek.

## Part 5: redesign, doosra hissa aur polish
Q2.7 Calendar aur Book dialog (L). Design: docs/design/proposal/Calendar.dc.html, PhoneCalendar.dc.html, PhoneBook.dc.html, PDF S07, S08. Kahan se kya: features/appointments/AppointmentsScreen.tsx, DayView.tsx, DayCard.tsx, DayDetails.tsx, AppointmentActions.tsx, QuickBookDialog.tsx, QuickBookPatient.tsx, useBookSlots.ts, day-view.css; worker ka appointments day endpoint (week ke liye from/to range ka endpoint jodo ya badao). Kaise: laptop par week view (Day/Week toggle), phone par din ki list (poora naam, status chip), detail panel Reschedule, Cancel/Missed aur Open patient (Q1.4 ka kaam yahin dikhta hai), Book dialog: patient (ya inline "New patient"), visit type, date patti (aaj se 7 din, "More dates" picker), 8 time chips aur "More times", Note "(optional)", fixed footer me Book, khaali din par "No free times on Tue 24 Nov. Try Wednesday." Done jab: G01/H01 ka booking hissa naye dialog par chalta hai, phone par booking 360 px par poori hoti hai.
Q2.8 Messages page (M). Design: docs/design/proposal/Messages.dc.html, PhoneMessages.dc.html. Kahan se kya: features/messages/MessagesScreen.tsx, PatientMessagesTab.tsx, api.ts, messages.css; packages/shared/src/messaging.ts (MESSAGE_KINDS, MESSAGE_TEMPLATE_VARS: naam, din, tareekh, samay, fone Hinglish naam hain). Kaise: patient ke hisaab se group (naam, number chip, appointment ka samay), har patient ke andar Confirmation, Reminder ("due Mon 5 pm"), Moved, Out of date (dhundhla, "Withdrawn: appointment moved"), filter chips To send, Opened, Out of date; guardian ko jaane wale message par "to Sunita (mother)"; "No number" card; test-mode patti notice jaisi; DRAFT template par badge. Placeholder ke naam English me badlo (name, day, date, time, phone) par purane naam alias ke roop me chalte rahen taaki Settings me save hue purane templates na tootein. Done jab: H01 aur H02 flows ke screenshot design jaise, purane template bina badle render hote hain.
Q2.9 New patient form (M). Design: PDF S03, S16, docs/design/proposal/PhoneNewPatient.dc.html. Kahan se kya: features/patients/NewPatientForm.tsx, NewPatientScreen.tsx, new-patient-schema.ts, BirthAgeFields.tsx, DuplicateWarnings.tsx, new-patient.css. Kaise: field order Full name, Mobile (saath "No mobile", karan ka box turant), Gender (bade 3 button, default nahi, Q1.8), Age ya DOB ek row me; patient number header me chhota chip (form ki row nahi); under 18 par guardian khud khule (Q1.8); Consent ek card: "Privacy notice given", "Allow reminders" (mobile ya contact na ho to band, karan ke saath), Promo "More details" me; duplicate me exact mobile wala pehle; save ke baad "Open patient / Book appointment / Walk-in now" (ek primary). "Save and book" aur "Save and check in" (PDF S03). Done jab: docs/ui-audit/runner/a02.mjs ke saare case design ke hisaab se, phone par bhi.
Q2.10 Ek hi input family (M). Kyun: 40 feature files me kaccha <input>/<select>/<textarea> (square, patla border), sirf 8 me ui/form. Kahan se kya: eslint.config.js (abhi koi restricted rule nahi), apps/web/src/ui/form/ (Field, DateInput, MobileInput), history ke filter, PaymentTakeForm, medicines, chart ke dropdown, settings ki list forms. Kaise: (1) ui/form me jo kam hai wo jodo: Select, Textarea, Checkbox, ChipGroup, SearchInput (ek hi 12 px radius, 44-48 px). (2) eslint me features/ ke andar kaccha input/select/textarea par no-restricted-syntax, pehle warn phir error. (3) Screens batches me badlo (History filters, payment form, medicine search, chart dropdown, baaki). (4) Multi-line input me monospace nahi, Inter. Done jab: lint pass, screenshots me koi square input nahi.
Q2.11 Phone aur tablet ka chrome (M). Design: docs/design/proposal/PhoneTabs.dc.html, PhoneMore.dc.html. Kahan se kya: ui/shell/nav-items.ts, StaffShell.tsx, BottomTabs.tsx, MainNav.tsx, TopBar.tsx, shell.css, nav.css, features/more (MoreScreen). Kaise: 768 px se laptop wala sidebar (kat-ti tab row nahi); phone par 5 bottom tab (Today, Patients, Calendar, Billing, More); More page me user card, Messages (badge), Reports, Library, Settings, Patient requests, Error ID (Copy) aur Sign out; gol "+" sirf Today aur Patients par, neeche 80 px jagah; tab bars par fade; keyboard wali hint touch par band; har link, checkbox 44 px. Done jab: runner f02/f03 me 0 target 44 px se chhote main lists par, koi sideways scroll nahi.
Q2.12 Reports (M). Design: PDF S10, docs/design/proposal/PhoneReports.dc.html. Kahan se kya: features/reports (ReportsScreen, DashboardKpis, DashboardCharts, AttentionList, TodaySummaryCard, CallListsPanel, RangeControls). Kaise: upar 4 numbers (Arrived today, New this month, Collected this month, Outstanding) aur "Things to watch" (links), neeche charts band (khulne par), har chart par "Not enough data yet" jab data kam; Collected me Payments aur Refunds alag lines (negative "-₹50" nahi); jab tak asli data na ho "Sample data" label (S10); CA export yahin ya Settings me. Done jab: chhote fake DB par saaf dikhe, receptionist ko wahi chhota safe summary.
Q2.13 Settings ka redesign aur naya Library page (L, 2-3 session). Kyun: Settings me 20 items ek menu me (setup, roz badalne wali lists, forms, system sab mile hue); doctor jo cheezein "add" karti hai (medicine, procedure, visit type) wo settings nahi, alag cheez hai. Design: docs/design/proposal/Settings.dc.html, Library.dc.html, LibraryAdd.dc.html, PhoneSettings.dc.html, PhoneLibrary.dc.html. Kahan se kya: features/settings/SettingsScreen.tsx, catalog.ts (sections ki list aur permission, abhi paths: clinic, timings, billing, consent-templates, privacy-notice, staff, preferences, numbers, system, messages aur lists ke), ClinicDetailsSettings.tsx, BillingSettings.tsx, MedicinesListReview.tsx, SettingHistoryPanel.tsx; features/lists (list editor ka maujooda code, dekho aur use karo), features/timings, features/staff; features/print/clinic-header.ts aur prescription.css (preview ke liye); features/prescriptions/VisitMedicinesPanel.tsx (visit ke andar "Add to my list"). Kaise: SETTINGS: 20 se 8 item, 4 group: Clinic (Clinic and doctor ek page par, Timings and holidays, Billing and tax), People (Staff and access), Forms and messages (Consent and privacy, Message templates), System (Backup and storage, Advanced = Number series, Preferences, Error log). Upar "Setup progress" card (kitna poora, kya baaki: registration number, clinic phone sample 0000000000, address sample, asli timings; har baaki cheez par seedha link) jo printed bill par dikhne wali andar ki chetavaniyon ki jagah leta hai. Clinic and doctor me do hisse (Clinic, Doctor), galat field amber me aur neeche sentence, daayen taraf live Prescription preview, "Last saved by ... History". Ek search jo Settings aur Library dono me dhundhe. Dikhane wale labels saaf ("Kind of clinic (under the tagline)" jaise layout wale shabd hatao). LIBRARY (naya, /app/library): features/library/ me; tabs Medicines, Medicine sets, Procedures and fees, Visit types, Diagnoses, Quick phrases, More (Tooth conditions, Allergens, Referral sources, Medical history); har tab: search, filter chips (All, Needs review, Hidden), table (Medicines me "used last 30 days" ka column; Procedures me fee; Visit types me minutes aur rang), row par Edit aur Hide, upar ek "+ Add ..." button, order badalne ke liye alag "Reorder" mode (har row par up/down nahi), "DRAFT - doctor to confirm" ek chhota badge. Add: daayen side ka drawer (ui me Drawer jodo agar nahi hai), medicine me sirf naam, strength, form (baaki "More details"), "Save and add another". Visit ke andar medicine search me match na mile to "+ Add 'ibuprofen 400' to my list". Purane /app/settings/<list> raaste Library par redirect. Sab edit versioned rehte hain (purane prescription aur bill nahi badalte). Receptionist ko Library read-only ya band (D4: band). Done jab: doctor medicine, procedure aur visit type Library se add kare aur wo turant Book dialog, visit ki procedure list aur medicine search me dikhe (docs/ui-audit/runner/e01.mjs naye UI par); Settings me 8 item; Setup progress card sahi.
Q4.1 Polish (S). Plural ek helper se, search icon aur "/" chip ki alignment, input se monospace hatana, Settings ke shabd, medicine rows ke raw tokens ("after_food"), chart ke labels aur "W" button, style guide sirf development me, PDF ka "New patient banao" text copy nahi, "Free times on undefined" jaisa text jab date khaali ho (ek baar dekha tha, pehle dobara check karo). Done jab: ui-audit AUDIT.md ke Low items band.

## Baad ka phase (Q3, owner kahe tab)
Q3.1 Advance jaan-boojh kar lena (M, D8 maana). Jab kuch baaki na ho tab bhi payment card dikhe, label "Take advance", advance agle bill par apne aap lage, advance ki receipt. Q0.6 ka allowAdvance rasta ise bana chuka hai, ab sirf UI aur "apply advance" ka dikhna. Done jab: advance lo, naya bill banao, advance lagta hai.
Q3.2 Band din par late entry aur doctor reopen UI me (M). Abhi message "Use a late entry or ask the doctor to reopen" kehta hai par UI me kuch nahi. Payment form me "Record as late entry" (karan zaroori) aur Day close tab me doctor ke liye "Reopen day".
Q3.3 Visit ke bina account par charge (S). Sirf agar doctor chahe: "Add charge" jaise balance ya correction ke liye, audit ke saath.
Q3.4 Jo hisse abhi audit nahi hue unka audit, phir sudhar (L). Treatment plan aur braces ka safar (PDF S06), files, certificates, consent history, recall aur incomplete-treatment lists, prescription print, A4/A5 prints, 5,000 patients ki list ki speed, keyboard se kaam. Natija: docs/ui-audit/flows/ me naye flow files, phir ISSUES.md me naye issues.
Q3.5 Patient portal (Phase 8). Sirf Gate A aur owner ke go-ahead ke baad.
Q3.6 Customer discovery (code nahi). Receptionist ko docs/TESTING.md ke 10 kaam bina madad ke karte dekho aur samay naapo; doctor ki visit dekho; doosre clinics se bhasha, GST aur login ke baare me poocho. Notes docs/product-audit/ me.

Done jab (poora phase): docs/TESTING.md ke 10 receptionist kaam bina madad ke 20 minute se kam me; doctor Today se "Ready to bill" tak ek screen par do minute se kam me; core-loop test CI me pass; kisi screen par 360, 768, 1366 px par sideways scroll nahi; koi failed save chup nahi.

## Part S: Speed (2026-11-24, audit ke baad)
Source: performance audit (chat, 2026-11-24). Effort: S = kuchh ghante, M = ~1 din, L = 2-3 din. Owner ke approval ke bina koi S-task shuru nahi hota; ek AI ek task, apni files tak.
Speed rules (AGENTS.md me tabhi jayenge jab owner haan kahe, S0.3.1): (1) ek API request me ~10 se kam D1 queries, hard limit 50; independent reads Promise.all ya db.batch me; loop me await nahi. (2) IN(...) me 90 se zyada values nahi; bina limit ki list nahi, SQL me jodo. (3) date filter range se (>=, <), LIKE ya column pe date() nahi; nayi query pe EXPLAIN QUERY PLAN aur query-plan.test.ts. (4) har list API paged. (5) naya screen = alag lazy chunk; bundle budget pass; nayi library poochh ke. (6) screen ki independent requests ek round me. (7) settings/lists client pe cache ho sakti hain, patient aur paise ka data no-store. (8) screen blank nahi, skeleton; refresh fail ho to purana data rahe. (9) har button useSubmitOnce; optimistic sirf status/notes pe, paise/number/finalise pe kabhi nahi. (10) search 250 ms debounce + purani request cancel. (11) polling sirf visible tab me, ek screen = ek request. (12) naapo, andaza nahi: Server-Timing, pehle aur baad ka number.
Parallel rule: ek wave me AI alag files par kaam kare, alag git branch/worktree me; MAP.md aur STATE.md parallel AI nahi chhute, unka badlav final message me likhe, owner baad me ek saath daalta hai. Waves: W1 S0.1 akela; W2 = Group A (S1.1, S1.2.1, S2.2.1, S2.2.2) + B (S1.3) + C/D (S1.2.2, S2.1) + E (S2.3.1, S2.3.3, S2.3.5) ek saath; W3 S2.2.3, S2.3.2, S2.3.4 then S3.1; W4 S3.2-S3.4; W5 Phase 4; W6 Phase 5.

### Phase 0: Pehle naapo
S0.1.1 Server-Timing (S). Har /api reply me Server-Timing header: kul ms, DB ms, queries ki ginti. Files: apps/worker/src/middleware/request-log.ts, packages/db/src/client.ts. Done jab: DevTools me dikhe, test pass.
S0.1.2 Bundle budget test (S). Abhi ki size (JS 1.03 MB raw, 288 KB gzip) pe limit; bada hone pe CI fail. Naya script + CI. Done jab: limit todne pe test fail.
S0.1.4 Server-Timing: batch = 1 round trip; header shows round trips and statements apart (S). apps/worker, packages/db/src/timing.ts (+tests). Done jab: dashboard header me round trips ~6 dikhe.
S0.1.3 100-values guard (S). packages/db/src/testing me: koi query 100 se zyada bound values bheje to test fail. Done jab: 101 values pe error.
S0.2.1 (owner) wrangler d1 info dental-clinic-staging: region likho. S0.2.2 (owner) staging pe Reports kholo, chalta hai ya fail. S0.2.3 (owner) curl -I ek asset pe, cache header likho. S0.2.4 (owner) Lighthouse mobile: /, Today, ek visit, ek print page; baseline docs/PERF_BASELINE.md me.
S0.3.1 (owner ka faisla) upar ke 12 rules AGENTS.md me chhote roop me.

### Phase 1: Jo toot sakta hai
S1.1.1 Stats queries batch me (M). computeDayStatRows/computeMonthStatRows ki 11 queries ek db.batch me. Files: packages/db/src/repos/daily-stats-queries.ts, daily-stats-parts.ts. Done jab: stats tests ke numbers same.
S1.1.2 Dashboard stored data se (M). Kal aur pichhla mahina daily_stats/monthly_stats se, aaj ka sirf ek baar live. File: packages/db/src/repos/dashboard.ts. Done jab: dashboard tests same, <=10 queries.
S1.1.3 Dashboard ki baaki queries ek batch me (S). Done jab: staging pe Reports khule.
S1.2.1 Recompute aur cron ki query ginti (S). recomputeRecentDays (daily-stats.ts) S1.1.1 ke baad 50 se kaafi kam; test me ginti.
S1.2.2 Cron me har job ka alag try/catch (S). apps/worker/src/cron/run.ts. Done jab: stats fail ho to bhi messaging tick chale (test).
S1.3.1 listDues SQL me (M). GROUP BY patient HAVING due > 0; refund rule D1 same. File: packages/db/src/repos/bills-dues-list.ts.
S1.3.2 paidByBill me IDs 90-90 ke tukde (S). File: bills-paid.ts. Day list ke dues nishaan isi se bachte hain.
S1.3.3 Test: 150 issued bills + refund cases (S).
Checkpoint: staging pe Reports aur Dues chalein; Server-Timing numbers likho.

### Phase 2: Jaldi asar
S2.1.1 /assets/* pe public, max-age=31536000, immutable; /fonts/* lamba cache; index.html ko nahi (S). apps/web/public/_headers + headers test.
S2.1.2 Smart Placement sirf staging pe aazmao, Server-Timing se pehle/baad compare; fayda ho tabhi rakho (S, owner staging chalaye). apps/worker/wrangler.jsonc.
S2.2.1 Month LIKE 'YYYY-MM-%' ki jagah date range: payments, appointments, visits, patients (S). daily-stats-queries.ts, daily-stats-parts.ts. Done jab: EXPLAIN me index.
S2.2.2 Refund query me date(approved_at,...) ki jagah UTC range (S). daily-stats-parts.ts, dashboard.ts.
S2.2.4 today-summary.ts me date(approved_at,...) hatao, UTC range lagao (S). packages/db/src/repos/today-summary.ts.
S2.2.5 shared/dashboard-range.ts ki private addMonthsYm copy hatao, stats-range.ts wala ek hi rakho (S).
S2.1.3 (Low) /assets/* me file na mile to 404 aaye, index.html nahi (staging pe dekha: jhootha /assets/x.js 200 text/html immutable deta hai, SPA fallback ki wajah se). Run_worker_first me /assets/* jodke Worker se 404 do, ya assets config dekho (S).
S2.2.3 query-plan.test.ts me dashboard, dues, drafts, patient list, day list ki queries jodo (S).
S2.3.1 allergens ko visit ke Promise.all me (S). apps/web/src/features/prescriptions/useVisitPrescription.ts.
S2.3.2 Week view me same din ki duplicate request band (S). AppointmentsScreen.tsx.
S2.3.3 LandingPage me <a href="/app"> ki jagah <Link> (S). features/auth/LandingPage.tsx.
S2.3.4 Refresh fail pe purana data rakho + "Couldn't refresh" note (S). useTodayModel.ts, AppointmentsScreen.tsx, useWeek.ts.
S2.3.5 Search me purani request cancel + "Searching..." (S). features/patients/PatientSearch.tsx.
Checkpoint: Lighthouse dobara, S0.2.4 se compare.

### Phase 3: App aur API tez
S3.1.1 React.lazy: print, settings, library, reports, billing, certificates, messages, requests, errors, style-guide (M). apps/web/src/routes/StaffRoutes.tsx. Done jab: e2e aur smoke pass, CSP error nahi.
S3.1.2 Vendor libraries ka alag chunk (S). apps/web/vite.config.ts.
S3.1.3 Bundle budget: abhi total JS naapta hai (lazy chunks bhi), isliye pehli-load ka alag limit jodo (index.html jo scripts load kare unka size) aur total limit tight karo (S).
S3.2.1 Day list me flags, dues, ready-to-bill, clinic settings ek saath (M). apps/worker/src/domain/appointments.ts.
S3.2.2 Week ke liye range endpoint GET /appointments?from=&to= (M); route-matrix update; useWeek me 1 request.
S3.3.1 Visit screen: lists getVisit ke saath shuru, 4 round se 2 (M). features/visits/useVisitData.ts + panels.
S3.3.2 (optional) getVisit reply me patient bhi.
S3.4.1 Patients list: last visit, next appointment, dues ek saath (S). packages/db/src/repos/patients.ts, apps/worker/src/domain/patients.ts.
Checkpoint + owner ka faisla: React Query ya apna cache.

### Phase 4: Click karte hi kaam ho gaya lage
S4.1.1 Cache layer (L). S4.1.2 lists, settings, /me, branding lamba cache, save pe refresh. S4.1.3 Today, Appointments, profile tabs, visit: purana data turant, naya background me. S4.1.4 Login ke baad aaj ke appointments (doctor: drafts) prefetch. S4.1.5 (low) search result pe hover prefetch.
S4.2.1 /me ke intezaar me blank nahi, shell turant (S). features/auth/RequireStaff.tsx.
S4.2.2 Skeleton component; Today, day list, profile header, visit, patients table; layout shift nahi; 360/768/1366 check (M).
S4.2.3 Har save button pe useSubmitOnce + "Saving..." audit (S).
S4.3.1 Appointment status optimistic, error pe wapas + toast; paise/bill/number/finalise pe nahi (S-M).
S4.3.2 Save ke baad reply seedha cache me, list dobara nahi (S).

### Phase 5: Baad me
S5.1.1 patients indexes (status, deleted_at, created_at) aur (status, full_name). S5.1.2 draft visits/prescriptions partial index. S5.1.4 visits (visit_date_local) aur refunds (approved_at) par index, month stats ke liye. S5.1.3 bills (bill_on, created_at), daily_stats (updated_by, updated_at). Ek migration + db:lock; ek hi AI.
S5.2.1 Font Latin + rupee subset (OFL.txt saath), phir naapo. S5.2.2 PWA sirf JS/CSS/font (owner faisla). S5.2.3 zod/mini aazmao.
S5.3.1 Prescription list N+1 hatao (prescriptions-issue.ts), bina use ka listForPatient hatao. S5.3.2 Phone pe visit typing profile; zaroorat ho tabhi memo.
S5.4.1 Aakhri Lighthouse + Server-Timing, baseline se compare, docs update.
