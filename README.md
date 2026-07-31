# Hill Climb Bike

Ein Browser-Spiel im Stil von Hill Climb Racing, mit Motorrad — **ohne Build-Tools, ohne
Framework, ohne externe Requests**. `index.html` doppelklicken und losfahren.

Punkte gibt es für erklommene Höhe, und je höher du kommst, desto mehr ist jeder Meter wert.

## Spielen

**Online:** https://hopp1395.github.io/hill-climb-bike/

**Lokal:** Repo klonen und `index.html` im Browser öffnen. Alternativ ein kleiner Server, falls der
Browser lokale Bilder blockiert:

```sh
python -m http.server 8777
# dann http://127.0.0.1:8777/index.html
```

## Steuerung

| Aktion | Tastatur | Touch/Maus |
|---|---|---|
| Gas | `→`, `↑` oder `D` | rechte Bildschirmhälfte |
| Bremse / rückwärts | `←`, `↓` oder `A` | linke Bildschirmhälfte |
| Boost | Leertaste | Leiste unten mittig |
| Neustart | `R` | Button im Overlay |

In der Luft kippt Gas die Nase hoch und Bremse sie runter — der Anstellwinkel beim Aufsetzen
entscheidet über Landung oder Sturz. Hältst du die Nase nach der Landung oben, fährst du einen
**Wheelie**, hältst du sie unten, einen **Stoppie**. Beide geben Punkte, und zwar umso mehr, je
länger sie stehen: der Satz vervierfacht sich innerhalb von 0,75 Sekunden. Die Zahl läuft während
der Nummer sichtbar mit und bleibt danach kurz stehen.

**Am Handy:** Gas, Bremse und Boost lassen sich gleichzeitig halten, und ein Finger darf von einem
Feld aufs andere wandern. Der Knopf ⛶ oben schaltet ins Vollbild (und versucht dabei, aufs
Querformat zu drehen); im Hochformat weist ein Hinweis aufs Drehen hin, lässt sich aber wegtippen.

Die Spielfläche richtet sich nach `visualViewport`, nicht nach `innerHeight` — sie endet also
genau über der Browserleiste statt dahinter, und die Knöpfe wandern mit, wenn die Leiste ein-
oder ausfährt. Gescrollt wird nichts: `body` steht auf `position:fixed`.

## Das Menü

Auf der Hauptansicht steht nur, was man vor jedem Lauf wirklich braucht: Kategorie und Modus,
eine Zeile mit dem aktuellen Fahrer, der Startknopf. Alles Seltenere liegt eine Ebene tiefer —
die Fahrerzeile führt zu Karten, Leveln und Upgrades, der kleine Knopf darunter zu Steuerung und
Tipps. So passt die Hauptansicht ohne Scrollen auf jeden Bildschirm; nachgemessen bleibt sie
zwischen 219 px (flaches Querformat) und 392 px, auch der Endbildschirm mit seiner Statistik.

## Was drin ist

- **Fünf Höhenzonen** mit eigenem Terrain, Wetter und Deko: Fels → Schnee (100 m) → Eis (250 m) →
  Vulkan (500 m) → Sternenzone (750 m).
- **Finale bei 1000 m:** flaches Stück, dann ein immer steilerer Endberg, an dessen Gipfel die
  Gravitation auf 0 geht und du ins Weltall abhebst.
- **Physik** über Verlet-Integration: drei Partikel (zwei Räder + Fahrer) als starres Dreieck,
  Federung an beiden Rädern, Grip sinkt auf Schnee und Eis.
- **Hindernisse:** Steilwände, Sprungrampen, Schluchten mit Brücken, Lavabecken und Geysire, die
  sich an den Boden anpassen.
- **Wetter:** Regen (rutschig), Wind, Gewitter mit Blitzeinschlägen, Tornado.
- **Deko und Leben:** Startdorf mit Häusern, Bäume, Wanderwege — dazu Dorfbewohner, Schneehiker,
  Vulkanexperten und Aliens, jeweils passend zur Zone. Große Objekte werfen Schatten passend zum
  Sonnenstand oben rechts.
- **Sechs Fahrer** mit eigenen Fähigkeiten, Sprit- und Boost-System, Flip-Bonus, Coins,
  Rekord in `localStorage`.

## Testmodus

Taste `+` öffnet ein Panel zum Ausprobieren: Wetter erzwingen, Unsterblichkeit, unendlich Sprit,
und Teleport zur nächsten Brücke / Steilwand / Rampe / Lavabecken / zum Gipfel oder direkt ins
Weltall. `+` schließt es wieder.

## Technik

Canvas 2D, `requestAnimationFrame`-Loop, deterministisches Terrain aus einer vorberechneten
Höhenfunktion (`TFIELD`) — kein Zufall zur Laufzeit, jeder Durchlauf hat dieselbe Strecke.
Sämtliche Grafik ist im Code gezeichnet; einzige Assets sind die Fahrer-Porträts in `charaktere/`.

## Aufbau

```
index.html      nur das Markup und die Ladereihenfolge
css/stil.css    das gesamte Aussehen der Oberfläche
js/
  config.js     alle Werte, an denen sich das Fahrgefühl schrauben lässt
  modi.js       Schwierigkeitsgrade, Sondermodi, Kategorien der Startauswahl
  canvas.js     Auflösung und Kamera, Welt- zu Bildschirmkoordinaten
  terrain.js    Höhenfeld, Hindernisse, Schluchten, Rampen, Finale
  physik.js     drei Verlet-Partikel als starres Dreieck
  zustand.js    Zustand einer Runde, Gebietsgrenzen, Kanister, Geisteraufnahme
  wetter.js     Wetterlagen und ihre Kräfte
  gefahren.js   Adler, Entführer, Komet
  tricks.js     Wheelie und Stoppie
  spiel.js      Start, Tod, Mitflug und der Takt von update()
  fahrer.js     Fahrer, Level, Fähigkeiten
  bild/         alles Gezeichnete, von basis.js bis draw.js
  hud.js        Anzeigen, Meldungen, Overlay
  input.js      Zeiger, Bedienfelder, Vollbild
  testmodus.js  das Panel auf Taste +
  tasten.js     Tastatursteuerung
  menue.js      Startauswahl und das Hochfahren beim Laden
  main.js       die Schleife
```

Es sind **klassische Skripte, keine ES-Module** — deshalb läuft das Spiel weiterhin per
Doppelklick von der Platte, wo Module an der CORS-Sperre scheitern würden. Der Preis dafür: alle
Dateien teilen sich einen Namensraum, und **die Reihenfolge in `index.html` ist die
Abhängigkeit**. Eine Datei darf alles benutzen, was weiter oben eingehängt ist — zur Laufzeit,
nicht schon beim Laden. Neue Datei also an der Stelle einhängen, an der ihre Voraussetzungen
schon stehen, und in `index.html` eintragen.

Innerhalb von `js/bild/` gilt zusätzlich: die Reihenfolge der Dateien ist ungefähr die Reihenfolge
im Bild, von hinten nach vorn. Was tatsächlich wann gezeichnet wird, steht gesammelt in
`js/bild/draw.js`.

## Hinweis zu den Bildern

Die Dateien in `charaktere/` sind Fotos realer Personen und werden hier mit deren Einverständnis
verwendet. Bitte nicht weiterverwenden oder weiterverbreiten.
