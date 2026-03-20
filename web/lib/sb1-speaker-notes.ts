// Speaker Notes for SB1 Pitch Deck — All in Norwegian (bokmål)

export const SPEAKER_NOTES: Record<number, string> = {
  0: `**Åpning**: Takk for muligheten. Vi er her fordi SpareBank 1 har en unik posisjon — alliansen sin sentraliserte Azure-plattform betyr at én beslutning kan beskytte 14 banker. Vi presenterer fem business cases der QDaria og SpareBank 1 kan skrive norsk finanshistorie. DORA teller allerede ned — og compliance-vinduet lukker seg.

**Nøkkeltall**: NOK 625 mrd. i forvaltningskapital, 14 banker, 1 felles teknologiplattform. Vi trenger én avtale — ikke fjorten.`,

  1: `**Trussel-briefing**: Statlige aktører — primært Kina, Russland og Iran — høster kryptert finansdata i dag. De kan ikke lese det ennå, men de lagrer det systematisk. Dette er dokumentert av NSA, GCHQ og ENISA. Det kalles «Harvest Now, Decrypt Later» og det pågår nå, mot norsk infrastruktur.

**Mosca's Theorem**: Hvis migreringstid (3–5 år) pluss datalagringsplikt (7–10 år) overstiger tid til Q-Day (~8 år median), er dataene allerede i fare. Konklusjon: SB1 må starte nå.

**Kilde**: GRI 2024, 32 eksperter, 19–34% Q-Day innen 10 år. IBM: $6.08M snittskostnad per datalekkasje i finans.`,

  2: `**DORA-compliance**: DORA er norsk lov fra 1. juli 2025. Art. 6.4 er den kritiske klausulen — den krever periodisk oppdatering av kryptografi basert på utviklingen innen kryptoanalyse. Det er en kvanteklar klausul, selv om ordet «kvantum» ikke brukes eksplisitt.

**Bøter**: Inntil 2% av global omsetning. For SB1-alliansen betyr det potensielt NOK 600M–1.3 mrd. i eksponering. Finanstilsynet er tilsynsmyndighet.

**SB1-fordelen**: Sentralisert plattform = én implementering for alle 14. Laveste kostnad-per-bank i sektoren. Utvikling DA med 530 ansatte i Oslo og Trondheim er klar infrastruktur.`,

  3: `**Konkurransebildet**: 80% av verdens 50 største banker investerer i kvanteteknologi. JPMorgan har over 100 kvantepatenter og publiserte sertifisert kvantum-tilfeldighet i Nature. HSBC har deployert PQC VPN-tunneler i produksjon. BBVA optimaliserte en portefølje på sekunder vs. 2 dager.

**Nordisk perspektiv**: Danske Bank fullførte Nordens første kvantetrygge datatransfer i 2022. DNB og norske banker har ingen bekreftede programmer. SpareBank 1 kan bli first-mover.

**Kilde**: Evident AI Quantum Report 2024, 10% vekst i kvanteansettelser.`,

  4: `**BC01 Zipminator**: Vår flaggskipplattform for post-kvantum kryptografi. Implementerer NIST FIPS 203 (ML-KEM-768), FIPS 204 (ML-DSA) og FIPS 205 (SLH-DSA). Alle standardisert august 2024.

**Kostnadsmodell**: NOK 8–15M implementering, beskytter NOK 625 mrd. forvaltningskapital. 14 banker per implementering. Estimert ROI >400% over 5 år.

**Tre faser**: (1) Kryptografisk inventar 2–4 mnd., (2) Hybrid PQC-overgang 6–12 mnd., (3) Full NIST-standardisert infrastruktur 12–24 mnd.`,

  5: `**BC02 Porteføljeoptimalisering**: ODIN Forvaltning og SB1 Markets kan bruke kvantum-akselerert optimalisering via QCaaS. JPMorgan demonstrerte 1000x speedup. BBVA optimaliserte 52 aktiva blant 10.382 kandidater.

**QCaaS-modell**: Ingen CAPEX for SB1. Hardware hos Rigetti. SaaS-leveranse. Pilot på 3 måneder. Estimert AUM-forbedring 0.3–1.2% p.a.

**McKinsey**: $400–600B verdiskapning i finanssektoren innen 2035 fra kvanteteknologi.`,

  6: `**BC03 Risikomodellering**: Norske banker kjører nattbatcher for VaR under Basel III. Quantum amplitude estimation gir kvadratisk speedup — O(M^-½) til O(M^-1). Forskningsbenchmarks viser 5.6x raskere enn HPC-klynger.

**SB1-eksponering**: SMN NOK 249 mrd., SR-Bank 220 mrd., total allianse 625 mrd. Kapitalforbedring på 0.1–0.5% gir NOK 625M–3.1 mrd. i effekt.

**Basel IV**: CRR3 krever mer granulære modeller fra 2025. Quantum MC gir SB1 en strukturell presisjonsmarginal.`,

  7: `**BC04 Svindeldeteksjon**: NOK 928M i faktiske svindeltap i 2023, +51% YoY. Banker forhindret ytterligere NOK 2.072 mrd. i forsøk. Quantum ML kan forbedre deteksjonsraten med 15–40%.

**Teknologi**: Quantum kernel methods for anomalideteksjon. QRC for tidsserieanalyse. Hybride modeller kompatible med dagens NISQ-hardware.

**SB1 SMN**: Allerede investert NOK 40M i NTNU AI Lab. Neste steg er kvantum-ML som komplementerer eksisterende AI-infrastruktur.`,

  8: `**BC05 QRNG**: Kryptografisk entropi fra kvantemekanikken. JPMorgan sertifiserte 71.313 bits i Nature (2025). HSBC bruker QRNG for tokenisert gull.

**SB1 use cases**: BankID-autentisering, Vipps betalingsprotokoll (1.52 mrd. txns i 2024), Monte Carlo frøverdier, DORA Art. 7 nøkkelgenerering.

**Kostnad**: ~NOK 0.1 per million operasjoner. Implementeringstid 1–3 måneder. Drop-in i eksisterende HSM-er.`,

  9: `**Markedsstørrelse**: Quantum computing i finans vokser med 72% CAGR til $19 mrd. innen 2032 (Deloitte). PQC-markedet alene til $2.84 mrd. innen 2030 (MarketsandMarkets). McKinsey: $400–600B verdiskapning.

**Defensiv vs. offensiv**: Defensivt (PQC) fra $7M til $3.7B. Offensivt (QCaaS) fra $73M til $15.3B. QDaria dekker begge.

**Bare 5%** av bedrifter har quantum-safe kryptering i dag (Keyfactor 2025). 48% innrømmer å være uforberedt.`,

  10: `**QDaria AS**: Norges eneste kvanteselskap etter NQCGs oppløsning desember 2024. Holding-selskap i Oslo med datterselskaper i Sveits (IP), Delaware (US-marked), Singapore (Asia-Pacific), UAE (MENA) og Malta (iGaming QRNG).

**Produktportefølje**: Zipminator (PQC), QCaaS via Rigetti, Qm9 (fintech), QDiana (edtech). Dual capability — både sikkerhet og verdiskapning.

**Rigetti-partnerskap**: Direkte tilgang til hardware brukt av HSBC, Standard Chartered og Nasdaq.`,

  11: `**Neste steg**: Vi foreslår tre faser. Fase 1 (3 mnd.): PoC med Zipminator + QRNG i BankID testmiljø. Fase 2 (6–12 mnd.): QCaaS pilot og fraud ML sandkasse. Fase 3 (12–24 mnd.): Full PQC-migrering og strategisk allianse.

**Call to action**: Vi ber ikke om en kjøpsbeslutning i dag. Vi ber om en pilot-avtale som lar SpareBank 1 evaluere teknologien i sitt eget miljø. Risikoen er lav, men oppsiden — å bli Nordens første kvantebank — er historisk.

**Kontakt**: Daniel Mo Houshmand, CEO, mo@qdaria.com. Mike Piech (Rigetti VP) er invitert til neste møte.`,

  // New slides — unique keys 100+ to avoid conflicts with old content-keyed notes

  100: `**Produktportefølje**: QDaria er et holdingselskap med fem spinoff-selskaper som dekker hele kvantum-verdikjeden. Zipminator er PQC-flaggskipet i beta. QCaaS leverer kvantumberegning via Rigetti. Qm9 er fintech-spinoffen for prising og risiko. QDiana er live edtech-plattform. QDaria Smart House kombinerer RuView WiFi-sensing med kvantumkrypto for kamerafri sikkerhet.

**Seeding**: Total seed-runde på $9M fordelt på fem selskaper. Hvert selskap har eget marked, egen P&L og direkte relevans for SB1. Alle fem har SB1-overlapp: fra DORA-compliance til eiendomsfinansiering.

**SB1-vinkel**: Geir (Real Estate) har direkte interesse i Smart House. Peder og Jostein (TMT) ser QCaaS og Zipminator. ODIN ser porteføljeoptimalisering. Alliansen ser compliance. Alle fem spinoffs kan aktiveres.`,

  101: `**Agentisk AI**: QDaria har bygget en enterprise-klar AI-orkestreringsplattform med 200+ spesialiserte agenter. Hver SB1-ansatt kan få sin egen personlige AI-assistent som hjelper med daglige oppgaver: compliance-sjekk, rapportgenerering, risikoanalyse, svindelovervåking.

**Teknisk plattform**: Ruflo (tidl. claude-flow) er orkestreringsmotoren med 215 MCP-verktøy, swarm-intelligens og skill-system. Agentene kjører på Claude Opus 4 med 1M token kontekstvindu.

**Daglig verdi**: En typisk dag starter med compliance-sjekk kl. 08, risikoanalyse kl. 09, svindelflaging kl. 10, nyhetsbriefing kl. 14 og styrenotat kl. 16. Alt automatisert. Spare timer daglig per ansatt.`,

  102: `**Kostnadsbilde**: Vi presenterer tre scenarier. Med QDaria: NOK 8–15M, 12–24 måneder, 14 banker beskyttet. Egenutviklet: NOK 80–150M, 3–5 år, krever 10+ kvantumspesialister som ikke finnes i Norge. Gjør ingenting: potensielt NOK 600M–1.3 mrd. i DORA-bøter, pluss $6.08M per datalekkasje.

**Nøkkelargument**: Det finnes ikke 10 kvantumkryptografer tilgjengelig i Norge. Rekrutteringstiden alene overskrider DORA-fristen. QDaria er den eneste realistiske veien til compliance i tide.

**Kilde**: IBM Cost of a Data Breach 2024 ($6.08M finans-snitt). DORA Art. 6 bøter inntil 2% av global omsetning.`,

  103: `**QDaria Smart House**: Vår neste spinoff kombinerer RuView (WiFi DensePose) med Zipminator kvantumkryptografi. RuView bruker ESP32-S3 mesh-nettverk til å detektere mennesker, pust, hjerteslag og bevegelse gjennom vegger via WiFi CSI-signaler — uten kameraer, uten wearables, uten internett.

**Physical Cryptography**: Fire lag: (1) WiFi DensePose for sensing, (2) PUEK — stedsbundne krypteringsnøkler fra rommets EM-signatur, (3) Vital-Sign Auth — kontinuerlig biometrisk autentisering, (4) EM Canary — automatisk nøkkelrotasjon ved avlyttingsforsøk.

**SB1-relevans**: SpareBank 1 Markets Real Estate finansierer smarte bygg. QDaria Smart House leverer sikkerhet uten kameraer for sykehjem, forsvarsobjekter og nybygde leiligheter. Geir Rønnestad sin avdeling har direkte interesse.`,
};
