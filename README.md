# Kucharzyna v3.2.2 — GitHub Pages ROOT

PWA Kucharzyna przygotowana do publikacji jako statyczna strona na GitHub Pages.

## v3.2 — UX / nawigacja / gotowanie / zdjęcia
- Stały przycisk `←` w lewym górnym rogu na każdym ekranie.
- Inteligentny powrót: gotowanie → receptura → poprzedni ekran.
- Stały przycisk `⚙ Ustawienia` w górnym pasku, również w trybie Amator.
- Ustawienia dostępne także jako szybka akcja na ekranie Start.
- „Ukończ krok” daje natychmiastowy feedback i zapisuje postęp.
- Ostatni ukończony krok kończy tryb GOTUJĘ i pokazuje ekran „Gotowanie zakończone”.
- Można cofnąć ukończenie pojedynczego kroku.
- Można zresetować gotowanie i rozpocząć je ponownie.
- Receptury mają bardziej rozbudowane opisy oraz sekcję „Na co zwrócić uwagę”.
- Zdjęcia mają odporny fallback zamiast pustego miejsca; obrazy zewnętrzne są dodatkowo cache'owane przez Service Workera, gdy przeglądarka je pobierze.
- Brak podkatalogów — wszystkie pliki pozostają w katalogu głównym GitHub Pages.
- Wyszukiwanie przepisów przez Google otwiera wyniki wyszukiwania w osobnej karcie Safari; Kucharzyna nie osadza zewnętrznych wyników w iframe.
- Service Worker podbity do wersji v3.2.2 i precache'uje całą lokalną bibliotekę zdjęć.
- Każda z 66 bazowych receptur ma przypisane osobne zdjęcie.
- W recepturach temperatura została zastąpiona polem `Na ciepło / Na zimno / Przekąska`; temperatura technologiczna pozostaje tylko w kalkulatorze pizzy.

## Pliki
- `index.html`
- `styles.css`
- `app.js`
- `db.js`
- `service-worker.js`
- `manifest.webmanifest`
- `icon-180.png`
- `icon-192.png`
- `icon-512.png`

## Publikacja
1. Rozpakuj ZIP.
2. Wgraj **wszystkie pliki bezpośrednio do głównego katalogu repozytorium GitHub**.
3. GitHub → Settings → Pages → Deploy from branch → wybierz branch i `/ (root)`.
4. Otwórz stronę w Safari na iPhonie.
5. Safari → Udostępnij → Dodaj do ekranu początkowego.

## Ważne przy aktualizacji
Po publikacji nowej wersji Service Worker ma nowy numer cache. Jeśli iPhone pokazuje starą wersję, zamknij PWA, otwórz stronę ponownie i zaakceptuj komunikat o nowej wersji.


## v3.2
- Stały przycisk Powrót jest niezależny od renderowanego ekranu.
- Usunięto zewnętrzne źródła zdjęć; grafiki receptur są lokalnymi plikami PWA.
- Zdjęcia działają offline po instalacji bez API Openverse.
- Uspójniono kontrast topbara i przycisku Powrót także w trybie Amator.


## 3.2
- Receptury 2.0: bogatsze karty, szczegółowy widok, szybka zmiana zdjęcia.
- GOTUJĘ 2.0: timer, zapis postępu i Wake Lock na iOS.
- Zakupy 2.0: scalanie składników oraz szybkie +/- ilości.
- Poprawiony landscape splash dla iPhone 17 Pro Max.

## Hardening 3.2.1
- Bezpieczny startup z obsługą błędów inicjalizacji.
- Globalna obsługa `error` i `unhandledrejection`, bez blokowania interfejsu.
- IndexedDB odrzuca błędy transakcji w kontrolowany sposób.
- Service Worker cache'uje assety pojedynczo, więc brak jednego pliku nie blokuje instalacji SW.
- Obrazy lokalne zwalniają tymczasowe Object URL po kompresji.


## Obrazy
Biblioteka zdjęć potraw jest dostarczana lokalnie jako WebP 900×760, zoptymalizowane pod iPhone/Safari. Service Worker cache’uje komplet 67 assetów zdjęciowych offline.


## Ingredient Atlas 1.0
Kucharzyna 3.2.4 uses one transparent `ingredient-atlas.webp` sprite with 96 cut-out ingredient assets for small thumbnails beside recipe ingredients. The atlas uses alpha transparency and a compact 32×3 grid, so the UI avoids dozens of individual image requests while keeping ingredient icons crisp and lightweight.
