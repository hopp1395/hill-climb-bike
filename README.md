# Hill Climb Bike

Ein Browser-Spiel im Stil von Hill Climb Racing, mit Motorrad — komplett in **einer einzigen
HTML-Datei**, ohne Build-Tools, ohne Framework, ohne externe Requests. `index.html` doppelklicken
und losfahren.

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
entscheidet über Landung oder Sturz.

**Am Handy:** Gas, Bremse und Boost lassen sich gleichzeitig halten, und ein Finger darf von einem
Feld aufs andere wandern. Der Knopf ⛶ oben schaltet ins Vollbild (und versucht dabei, aufs
Querformat zu drehen); im Hochformat weist ein Hinweis aufs Drehen hin, lässt sich aber wegtippen.

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

## Hinweis zu den Bildern

Die Dateien in `charaktere/` sind Fotos realer Personen und werden hier mit deren Einverständnis
verwendet. Bitte nicht weiterverwenden oder weiterverbreiten.
