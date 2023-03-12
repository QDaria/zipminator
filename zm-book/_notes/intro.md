# Zipminator

Zipminator er en open-source Python-pakke skrevet for å håndtere lagre og sletterutiner for personvernkonsekvensutredninger (PVKer), og for å gjøre livet lettere for ansatte i NAV. 

* Automatiserer lagring og sletting av sensitive data på en sikker måte ved å pakke sensitiv informasjon inn i et passordbeskyttet SHA256-kryptert zip-fil som gjør det umulig å låse opp, enn så lenge. Kun personer med tilgang til passordet vil kunne se innholdet i filen.

* Selvdestruksjonsfunksjon som automatisk sletter data på en bestemt tidsplan medfører at brukere kan være trygge på at data blir slettet på en sikker måte. 

* Nyttig verktøy for å beskytte sensitiv informasjon, som personopplysninger eller annen konfidensiell informasjon. 

* Med Zipminator kan brukere også planlegge når filene vil bli slettet automatisk fra systemet, både fra zip-filen og Pandas DataFrame, slik at dataene forblir konfidensielle og beskyttet.

* Bidra til å redusere risikoen for at sensitive data kommer på avveie og blir misbrukt, for eksempel ved at uvedkommende får tilgang til dataene.

1. Først tar zipminator en pandas DataFrame og skriver den til en fil i et pandas-støttet filformat som for eksempel CSV.
2. Deretter blir CSV-filen og pakket inn i en passordbeskyttet zip-fil ved hjelp av SHA256-kryptering. SHA256 er en sikker krypteringsalgoritme som gjør det nesten umulig for noen å få tilgang til dataene dine uten riktig passord.
3. Når zip-filen er opprettet, sletter zipminator automatisk CSV-filen som ble brukt til å opprette zip-filen. Dette garanterer at den opprinnelige CSV-filen ikke lenger er tilgjengelig og dermed ytterligere beskytter dataene.
4. Som en ekstra sikkerhetslag kan zipminator også slette zip-filen selv etter en forhåndsdefinert tidsperiode. Som default 672t (28 dager) om ikke brukeren overstyrer med ønsket tid. Dette forsikrer at data ikke lenger er tilgjengelige etter en tidbestemtsperiode, selv om noen skulle få tak i passordet.
5. For å beskytte personvern enda et hakk så kan selve DataFramen bli slettet etter forhåndsdefinert tid, 24t som deffault hvis ikke det oppgis noe annet. 

Data vi har lagret kan enkelt pakkes ut ved å oppgi passordet vi opprettet tidligere med unzipit-module. Alt i alt er Zipminator ment for å gjøre det enkelt og sikker metode for å beskytte sensitive data for å gi en ekstra lag med beskyttelse for å sikre at dataene dine er trygge.

## Slik brukes Zipminator

Først importerer vi noen nødvendige biblioteker og pakker:

```python
from zipminator.zipit import Zipndel
import pandas as pd
import getpass
import zipfile
import os
```

Deretter oppretter vi en dummy pandas DataFrame:

```python
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6], 'C': [7, 8, 9]})
```

Vi kan nå opprette en Zipndel-instans og kalle zipit-metoden for å pakke inn dataene i en zip-fil:

```python
zipndel = Zipndel(file_name='df', file_format='csv')
zipndel.zipit(df)
zipndel.self_destruct(0, 0, 18)
```

# Aktiver selvestruksjonsfunksjonen etter for eksempel 18 sekunder for demoformål
```python
zipndel.self_destruct(0, 0, 18)
```


## Slik pakker du ut dataene

For å pakke ut dataene, må vi først importere Unzipndel-klassen:

```python   
from zipminator.unzipit import Unzipndel
```

Neste er å opprette en Unzipndel-instans og kalle unzipit-metoden:

```python
df = unzipndel.unzipit()
df
```

```{tableofcontents}
```
