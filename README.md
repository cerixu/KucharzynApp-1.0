# Kucharzyna v3.3 Core — GitHub Pages ROOT

PWA Kucharzyna przygotowana do publikacji jako statyczna strona na GitHub Pages.

## v3.3 — Core / zdjęcia / wyszukiwanie / składniki
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
- Wyszukiwarka lokalna nie renderuje ekranu podczas wpisywania, więc Safari nie traci fokusu klawiatury.
- Ingredient Atlas używa transparentnego WebP oraz fallbacków emoji dla składników bez osobnego zdjęcia.
- Pierogi ruskie są automatycznie dodawane/migrowane do istniejącej bazy wraz ze zdjęciem i podziałem na Ciasto/Farsz.

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


## Ingredient Atlas 2.0
Kucharzyna 3.2.5 uses one transparent `ingredient-atlas.webp` sprite with 96 cut-out ingredient assets for small thumbnails beside recipe ingredients. The atlas uses alpha transparency and a compact 32×3 grid, so the UI avoids dozens of individual image requests while keeping ingredient icons crisp and lightweight.

## 3.2.4 patch
- Naprawiono wyszukiwanie receptur bez rerenderowania pola podczas pisania.
- Wyszukiwanie obejmuje nazwę, opis, kategorię, kuchnię, tagi, uwagi i składniki.
- Dodano/utrwalono recepturę „Pierogi ruskie” z lokalnym zdjęciem `photo-pierogi-ruskie.webp`.
- Ingredient Atlas korzysta z transparentnego WebP i mapowania 12×8.
- Service Worker cache bumped to `kucharzyna-v3.2.4-pierogi-atlas-v2`.


## v3.3 — Polska
- Dodano Pierogi z mięsem oraz rozszerzono bibliotekę o kolejne polskie klasyki: Kotlet schabowy, Placki ziemniaczane, Gołąbki z mięsem i ryżem, Kopytka, Naleśniki z twarogiem, Racuchy z jabłkami, Barszcz czerwony i Sałatkę jarzynową.
- Istniejące instalacje dostają te receptury przez migrację IndexedDB, bez kasowania własnych receptur.
- Dla trzech nowych dań użyto zdjęć z Wikimedia Commons na licencjach CC BY-SA; w recepturze zapisano autora, źródło i licencję. Pozostałe nowe dania korzystają z lokalnych istniejących assetów jako fallback, bez udawania dedykowanego zdjęcia.
- Zdjęcia zewnętrzne działają online; przy braku sieci aplikacja przechodzi do lokalnego fallbacku.


## v3.4 — Polska: większa biblioteka zdjęć i przepisów
- Rozszerzono kuchnię polską o 13 dodatkowych receptur: Bigos, Żurek, Biały barszcz, Mizeria, Kotlet mielony, Kaczka z jabłkami, Golonka po polsku, Flaki po warszawsku, Krupnik, Kluski śląskie, Pyzy z mięsem, Sernik i Makowiec.
- Łącznie biblioteka migracji obejmuje 22 polskie klasyki razem z wcześniejszą paczką.
- Dodano zdjęcia z Wikimedia Commons jako zewnętrzne grafiki z zapisanym autorem, źródłem i licencją.
- Podmieniono część wcześniejszych zdjęć zastępczych na dokładniejsze zdjęcia potraw.
- Zdjęcia zewnętrzne wymagają internetu; aplikacja zachowuje lokalny fallback, gdy obraz jest niedostępny.
- Service Worker otrzymał nową wersję cache.


## v3.5 — wyszukiwanie kategorii
- Naprawiono wyszukiwanie wewnątrz kategorii receptur.
- Naprawiono wyszukiwanie kuchni świata oraz dań w wybranej kuchni.
- Wyszukiwanie działa na żywo bez ponownego renderowania całego widoku, dzięki czemu klawiatura i fokus na iOS Safari nie znikają po każdej literze.
- Zmieniono wersję cache Service Workera.


## v3.7 — exact dish photos
- Replaced random/generic Polish dish photos with exact Wikimedia Commons food images.
- Added a final exact-photo layer so older local fallback mappings cannot override the correct dish image.
- Recipe metadata stores the Wikimedia source URL, author/credit and license where available.
- Service Worker cache version bumped to v3.7.


## v3.8 — ingredient icons
- Replaced the old ingredient atlas mapping with recognizable OpenMoji food ingredient icons loaded from jsDelivr.
- Ingredient icons now use exact/common food glyphs for flour, tomato, garlic, onion, dairy, eggs, meats, seafood, pasta, rice, vegetables, herbs, spices, fruits and sauces.
- Unknown ingredients fall back to a neutral food icon instead of an unrelated atlas tile.
- OpenMoji is licensed CC BY-SA 4.0: https://openmoji.org/

## v3.9 — Motyw systemowy, regionalność, ikony składników, Liquid Glass
- Naprawiono reakcję trybu Automatyczny na zmianę jasnego/ciemnego motywu systemu iOS.
- Polskie receptury nie są już automatycznie oznaczane jako „tradycyjne”; oznaczenie jest nadawane tylko wybranym klasykom.
- Dodano etykietę REGIONALNE oraz region pochodzenia dla dań, dla których region jest określony.
- Rozszerzono mapowanie ikon składników, w tym Bułka pszenna, pieczywo, bulion, mąki, mięsa i warzywa; nieznane składniki nie dostają już talerza ze sztućcami.
- Start otrzymał ambientowe tło z aktualnego zdjęcia hero oraz warstwy Liquid Glass.


## v3.10 — Photo-integrated Liquid Glass Start
- Ekran Start nie używa już zdjęcia jako prostokątnej karty hero.
- Główne zdjęcie jest atmosferycznym tłem z miękkim zanikiem, a jego kolory przechodzą przez całą powierzchnię Startu.
- Menu i sekcje są półprzezroczystymi powierzchniami Liquid Glass z rozmyciem i subtelnym światłem.
- Na iPhone ma mocniejszy efekt głębi i łagodniejsze przejście zdjęcie → tło aplikacji.
- Fallback bez backdrop-filter pozostaje bezpieczny.

## v3.11 — Liquid Glass + ingredient icon hardening
- photo-driven Liquid Glass home polish: atmospheric photo, soft color spill, layered glass surfaces and mobile tuning.
- ingredient icons hardened globally: OpenMoji exact icon where available, semantic emoji fallback when the remote asset is unavailable, with broader ingredient matching.
- no ingredient falls back to the fork-and-plate icon.
- OpenMoji graphics are CC BY-SA 4.0; attribution retained in project documentation.

## v3.12 — Magazyn / Lodówka
- Added local IndexedDB inventory store `inventoryItems`.
- Professional profile labels the feature **Magazyn**; Amateur profile labels it **Lodówka**.
- Inventory supports manual add/edit/delete, search, units g/kg/ml/l/szt./porcja.
- Recipe ingredients are automatically deducted when a cooking session reaches completion.
- Deduction is protected by a per-cook-session `inventoryConsumed` flag to prevent double subtraction.
- Compatible weight/volume units are converted automatically; incompatible units are left untouched and reported as missing.
- Inventory is included in JSON backup/import.


## v3.13 — Magazyn/Lodówka: alerty i potwierdzenie zużycia
- Każdy składnik może mieć własny próg alertu „kończy się”.
- Start modułu pokazuje listę produktów poniżej progu.
- Po zakończeniu GOTUJĘ aplikacja pyta, czy odjąć składniki z Magazynu/Lodówki.
- „Tak, odejmij” zużywa dostępne ilości i zapisuje decyzję.
- „Nie, zostaw” nie zmienia stanu magazynu i zapisuje decyzję, aby nie pytać ponownie dla tego samego gotowania.
- Reset GOTUJĘ pozwala ponownie ugotować recepturę i podjąć nową decyzję.


## v3.14 — Brakuje do przepisu
- Na widoku każdej receptury Kucharzyna porównuje wymagane ilości z Magazynem/Lodówką.
- Pokazuje dokładnie, których składników i jakiej ilości brakuje.
- Jednostki g/kg oraz ml/l są przeliczane.
- Jeśli stan wystarcza, pokazuje potwierdzenie „Masz wszystko do tego przepisu”.
- Nie zmienia ani nie odejmuje stanów magazynowych podczas samego sprawdzania.


## Kucharzyna v4.0
- Naprawiono warstwowanie zdjęcia Start: główne zdjęcie jest ostre i widoczne, ambient pozostaje tylko tłem.
- Usunięto blur z całego hero Start, który wcześniej rozmywał fotografię przez `backdrop-filter`.
- Uporządkowano Liquid Glass kart menu: mniej przezroczystości, czytelniejszy tekst, delikatny blur tylko na kartach.
- Zachowano obsługę safe-area i trybu jasnego/ciemnego.
