# Wifi data forespørsel - Oppsummering
**`Det bes om tilgang til Wifi data av typen:`** 

{`'_id'`: ObjectId('6335d2cc454b6283b947e2c3'), `'client':` {`'clientmac':` '046c.59d9.115b', `'details':` [{`'seenonap':` 'NAV-B06-09', `ssid':` 'NAV-gjest', `'clientip':` '172.28.160.196', `'username':` 'navn@nav.no', `'lastSeen':` '2022-09-29 19:15:05'}]}} <br>


`'_id':` ObjectId('6335d2cc454b6283b947e2c3') <br>
Dette feltet kan ignoreres da det bare er en unik identifikator generert av databasen. <br>

`'client':` {'clientmac': '046c.59d9.115b', 'details': [{'seenonap': 'NAV-B06-09', 'ssid': 'NAV'<br>
`'clientip':` '172.28.160.196', 'username': 'navn@nav.no', 'lastSeen': '2022-09-29 19:15:05'}]} <br>
`'clientmac'` er MAC-adressen til enheten som brukte Wi-Fi-tilgangspunktet. <br>
`'seenonap'` er navnet på tilgangspunktet enheten var tilkoblet. <br>
`'ssid'` er navnet på Wi-Fi-nettverket som enheten brukte. <br>
`'clientip'` er IP-adressen som enheten ble tildelt av Wi-Fi-tilgangspunktet. <br>
`'username'` er brukernavnet til personen som er knyttet til enheten. <br>
`'lastSeen'` er datoen og klokkeslettet for når enheten sist ble observert på Wi-Fi-tilgangspunktet <br>

**`Formål:`** *Pilot om tilstedeværelse i bygg.* Hennsikten med forespørselen er å kartlegge tilstedeværelse i alle oppholdsrom Fystikkalleen 1 for å gi økt innsikt til beslutningstøtte og optimalisering av ressurser. Derfor er vi mere opptatt av aggregerte data, pseudoanonymisert, anonymisert eller maskerte personopplysninger med tidspunkt, lokasjon på NAV ansatte på dedikerte ansatt-wifi og ikke noe interesse i NAV-guest for eksempel. Nedenfor gis nivå av viktighet hva de forskjellige feltene er for oss fra 1-10, der 1 har bortimot ingen viktighet og 10 er kritisk viktig <br>
**`Gjennomføring`:** <br> Wifi data ønskes overført fra Flowscape til Azure plattformen for renskning, behandling og preparering til maskinlæringsalgoritmer, analyser og eller visualisering. <br>
**`Periode`:** <br> 2. januar 2023 - DD og fremtiden <br>
**`Risikoeier:`** Hans Petter ... (Har godkjent restrisiko) <br>
**`Prosjektleder:`** Eric Bortzmeyer <br>
**`Teamleder:`** Lars Røed Hansen <br>
**`Data Scientist:`** Daniel Mo Houshmand <br>
**`Begrensninger i uttrekkene: - Hva er det vi trenger å vite om:`** <br>
    * **brukeren?** `1/10` <br>
    * **tilstedeværelsen?** `10/10` <br>
    * **bygget?** `10/10`<br>
    * **tilgangspunktet?** `10/10`<br>
    * **nettverket?** `8/10`<br>
    * **IP-adressen?** `3/10`<br>
    * **brukernavnet?** `1/10`<br>
    * **datoen og klokkeslettet?**`9/10` <br>



Skisse
 
Helt overordnet går behandlingen ut på å samle inn, sammenstille, aggregere og deretter slette personopplysninger.  

Fig.1: Dataflyt i analyseplattformen: 
https://confluence.adeo.no/pages/viewpage.action?pageId=470747788 

Figuren over illustrer forenklet dataflyt i analyseplattformen illustrert med kildene som er tenkt brukt i pilotperioden. Behandling av personopplysninger skjer i flytens to første steg. De øvrige stegene viser hva som skjer med data som er aggregert til et nivå hvor de ikke lenger kan re-identifiseres ved hjelp av rimelige midler.  

 

Forklaring av flytens ulike steg: 

1. Personopplysninger (loggdata) hentes ut fra kildesystem(er) 

For piloten vil dette være: <br>  

a) Cisco Wifi access point <br> 

b) Azure Active Directory <br> 

 

2. Loggdata lastes inn i rådatalager. <br>  

En automatisk transformasjonsjobb (Azure App Function) transformerer, sammenstiller og aggregerer data til et nivå der risikoen for å re-identifisere individer er tilstrekkelig lav (i praksis vil data være anonyme). Umiddelbart etter transformasjonsjobben er kjørt slettes rådata fra rådatalageret. 

  

3. Aggregerte datasett lastes videre til en analytisk database hvor de lagres og gjøres tilgjengelig for ulike visualiseringsverktøy 

For piloten vil analytisk database være Snowflake. 

 

4. Analyser for økt innsikt på eiendomsområdet gjøres ved hjelp av utvikling av dashboard i BI-visualiseringsverktøy 

For piloten vil visualiseringsverktøy være Tableau.  

 

Steg 3 og 4 vil ikke innebære behandling av personopplysninger.  

Likevel vil verken ledere fra ulike enheter eller andre uten tjenstlig behov ha tilgang til visualiseringsverktøyet. Ved behov for analyse/informasjon vil eiendomsseksjonen bygge en rapport som kan utleveres. Slike rapporter skal ikke inneholde personopplysninger og det skal påses at denne type rapporter reelt sett er anonyme og ikke uten videre kan kobles opp mot kilder rapportmottaker har eller kan skaffe seg som gir mulighet for re-identifisering.  

Løsningen for innsamling, produksjon og visualiseringsdata består av følgende komponenter:  

 

A: Et rådatalager der ulike loggdata skal hentes inn til. Her vil dataene ligge kun kort tid – og slettes etter at jobb for å bearbeide disse data videre har kjørt.  

B: Et analytisk lager der analytisk data lagres for analytiske formål.  

C: Et visualiseringsverktøy som kan hente inn og visualisere analytiske data.  

 

I tillegg vil løsningen ha en transformasjonsjobb som genererer det analytiske datasettet ved å først sammenstille og beregne relevante nøkkeltall, for så å lagre datasettet i analytisk lager på et avidentifisert/aggregert nivå med tanke på personopplysning.  

 

# Beskrivelse av teknisk løsning 

## Overordnet beskrivelse av løsningen
Løsningen for innsamling, produksjon og visualiseringsdata består av følgende komponenter:  

 

A: Et rådatalager der ulike loggdata skal hentes inn til. Her vil dataene ligge kun kort tid – og slettes etter at jobb for å bearbeide disse data videre har kjørt.  <br>

B: Et analytisk lager der analytisk data lagres for analytiske formål.<br>  

C: Et visualiseringsverktøy som kan hente inn og visualisere analytiske data. <br> 

 

I tillegg vil løsningen ha en transformasjonsjobb som genererer det analytiske datasettet ved å først sammenstille og beregne relevante nøkkeltall, for så å lagre datasettet i analytisk lager på et avidentifisert/aggregert nivå med tanke på personopplysning.  <br>
## Om dataflyten i systemet 
 
1. I første steg innebærer behandlingen transformasjon av rådata av type personopplysning til et analytisk datasett – og de blir i operasjonen avidentifisert og videre aggregert til et tilstrekkelig nivå slik at risiko for å identifisere enkeltindivid er minimal før data tilgjengeliggjøres videre. Når transformasjonen av datasettet er utført skal rådatalageret slettes slik at dataene ikke skal lagres permanent her.  <br>

 

2. Avidentifiserte/aggregerte data lagres så i database for lagring av analytiske data (type Snowflake) for å understøtte historisk sammenstilling med data fra andre datakilder.  <br>

 

3. Data blir videre tilgjengeliggjort for visualisering i Tableau eller Microstrategy. Begge verktøy er anskaffet og tilgjengeliggjort i NAV for dette formålet, og disse verktøy er risikovurdert separat. <br>


**Beskrivelse:** Loggdata vil hentes inn fra ulike kildesystem i rådataformat og lagres i et rådatalager basert på «Azure Log Analytics». Azure Log Analytics er en tjeneste i Azure for håndtering av typiske loggdata, og brukes i dag av NAV it for lagring av denne type logger. <br>

**Tilgangsstyring:** Vi ønsker å begrense tilgang til rådata her til rollen administrator og rollen data engineer, dvs. kun de som trenger tilgang for å implementere og forvalte dataflyten. Lastejobber vil settes opp med bruk av servicekonto (Azure Managed Identity).  <br>  

**Logging:** Tjenesten har innebygget funksjon for logging. <br> 

## Om rådatalageret

**Beskrivelse:** Loggdata vil hentes inn fra ulike kildesystem i rådataformat og lagres i et rådatalager basert på «Azure Log Analytics». Azure Log Analytics er en tjeneste i Azure for håndtering av typiske loggdata, og brukes i dag av NAV it for lagring av denne type logger. <br> 

**Tilgangsstyring:** Vi ønsker å begrense tilgang til rådata her til rollen administrator og rollen data engineer, dvs. kun de som trenger tilgang for å implementere og forvalte dataflyten. Lastejobber vil settes opp med bruk av servicekonto (Azure Managed Identity).  <br>  

**Logging:** Tjenesten har innebygget funksjon for logging.  <br>

## Om lagring av analytiske data 

**Beskrivelse:** Loggdata transformeres videre til analytiske data og overføres til lager for analytiske data. I transformasjonen vil rådata avidentifiseres og videre aggregeres til et tilstrekkelig nivå, slik at risiko for å identifiseres er minimal. <br> 

Lagring av analytiske data vil foregå i Snowflake – og her vil visualiseringseksperter få tilgang til å hente ut data til visualiseringsverktøy.  

Snowflake en skybasert «Software As A Service»-databasetjeneste som kan kjøre både i Azure plattform og Google Cloud Plattform. Denne teknologien pekt på i NAV sin databasestrategi som et foretrukket valg for denne type brukscase – dvs lagring av analytiske data, 

**Tilgangsstyring:** Vi vil få egen instans og med det muligheter for å styre tilgang på alle nivåer selv. Datavarehus/Snowflake vil settes opp med integrasjon mot AD og tilgang til data vil gis gjennom bruk av AD grupper. Tilgang til data vil her begrenses til rollen analytiker, som har som oppgave å produsere visualisering/dashboard. <br>

**Logging:** Datavarehus/Snowflake vil settes opp med logging, og sporingslogger vil overføres til Arcsight. Disse loggene vil behandles som personopplysning, og tilgang til logger er begrenset til nødvendige administratorer.  <br>

## Om visualisering

**Beskrivelse** Analytiske datasett hentes i første omgang inn i visualiseringsverktøyet Tableau. Dette er et godkjent/risikovurdert verktøy som benyttes til denne type data over hele direktoratet/etaten. Videre vil også visualiseringsverktøyet MicroStrategy bli tatt i bruk for visualisering av data når denne komponenten er godkjent og klargjort for bruk.  <br>

 

**Tilgangsstyring:** Eiendom vil få egne områder til tilgjengeliggjøring av dashboard, der tilgangen til dashboard kan begrenses til ulike roller. Tableau er satt opp med integrasjon med AD og tilgang gis gjennom bruk av dedikerte AD grupper. Tilgang vil begrenses til ansatte med tjenstlig behov, der formål er å understøtte analyse og forvaltning av eiendomsområdet. <br>

 

**Logging:** Sporingslogger fra bruk av dashboard hentes ut og sendes videre til Arcsight. Loggene behandles som personopplysning, og tilgang til disse loggene er begrenset til nødvendige administratorer.  <br>

# Risikovurdering av plattform  

Siden den tekniske løsningen består av flere komponenter bygger denne risikovurdering på grunnleggende risikovurdering av følgende komponenter:  

* Azure med «Azure Log Analytics» og «Azure Function App»  

* Databasen «Snowflake» 

* Visualiseringsverktøyene «Tableau» og «MicroStrategy» 

 

Vår godkjenning av risikovurdering av løsning forutsetter grunnleggende risikovurdering av komponentene/teknologien i bruk.  

 

Videre vil risikodrøfting i denne omgang i hovedsak ta for seg risiko knyttet til konfidensialitet. Den endelige risikovurdering vil i tillegg ta for seg perspektivene «integritet» og «tilgjengelighet».  