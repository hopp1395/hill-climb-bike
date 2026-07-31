"use strict";
/* Konfiguration – alle Werte, an denen sich das Fahrgefühl schrauben lässt
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
"use strict";

/* =========================================================================
   CONFIG – hier schrauben, wenn sich das Fahrgefühl anders anfühlen soll
   ========================================================================= */
const CFG = {
  GRAV: 2000,          // px/s²
  // Antrieb wirkt nur am Hinterrad -> über den Radstand-Constraint kommt effektiv
  // die Hälfte am Gesamtsystem an. Max. Steigung ohne Schwung: asin(ACC/2/GRAV) ≈ 55°.
  ACC: 3300,           // Antrieb Hinterrad px/s²
  BRAKE_ACC: 2100,     // Bremsen / Rückwärts
  MAXSPD: 1020,        // max. Vorwärtstempo px/s
  MAXREV: 360,         // max. Rückwärtstempo px/s
  WHEELBASE: 62,
  WHEEL_R: 17,
  // Fahrer als eigene Masse über der Achslinie. Der Schwerpunkt des starren
  // Dreiecks liegt dann bei BODY_M*SEAT_H/(2+BODY_M) = 18 px über den Achsen,
  // also ungefähr auf Sitzhöhe – dort dreht sich das Bike in der Luft.
  // Höher geht nicht: am Steilhang kippt das Bike nach hinten weg, sobald
  // tan(Hang) > (Radstand/2)/(Schwerpunkthöhe + Radradius). Bei 9,6 px liegt
  // diese Grenze bei 49,4° und damit sicher über dem Steigungsdeckel von
  // 44,1°. Auf voller Sitzhöhe (18 px) wären es nur 41,5° – gemessen endeten
  // damit 17 von 20 Läufen im Rückwärtsüberschlag.
  SEAT_H: 10,
  SEAT_FWD: 0,         // Vorversatz des Fahrers, 0 = mittig über den Achsen
  BODY_M: 3,           // Fahrermasse, jedes Rad zählt 1
  HEAD_H: 42,          // Kopfhöhe über der Rahmenachse -> Crash-Punkt
  // Drehmoment in der Luft. Bei 200 brauchte eine volle Drehung 1,48 s – mehr
  // als jeder Sprung hergab, der Flip-Bonus war damit unerreichbar.
  // Entscheidend fürs Gefühl ist nicht die Enddrehzahl, sondern wie schnell
  // die Drehung anspringt: bei 640 waren nach 0,3 s erst 54° herum, bei 900
  // sind es 75°. Deutlich mehr macht den Flip zum Selbstläufer.
  // Hoch, weil die Dämpfung unten dagegen arbeitet: zusammen ergibt das eine
  // Drehung, die schnell anspringt (90° in 0,3 s), aber von allein wieder
  // ausklingt, statt nach einem Tipper endlos weiterzulaufen.
  TQ_AIR: 1600,
  // Sobald beide Räder frei sind, zieht es weniger stark nach unten. Das
  // verlängert jeden Sprung, ohne das Fahren am Boden anzufassen.
  AIR_GRAV: 0.9,
  TQ_GROUND: 95,       // Drehmoment am Boden (Wheelie)
  MAX_OMEGA: 9,        // rad/s Deckel
  // Ohne Dämpfung bleibt jede angestoßene Drehung für immer stehen: ein kurzer
  // Tipper drehte das Bike noch eine halbe Sekunde später um 137° weiter, und
  // man kippte ständig ungewollt um. Der Wert ist der Anteil, der pro Sekunde
  // aus der Drehung verschwindet, solange beide Räder frei sind.
  SPIN_DAMP: 3.5,
  // So lange muss das Bike am Boden bleiben, bis ein Sprung als beendet gilt.
  LAND_GRACE: 0.15,
  // Ab so vielen Umdrehungen zählt der erste Flip. Jeder weitere braucht dann
  // eine ganze Drehung mehr – 0,75 / 1,75 / 2,75 usw.
  FLIP_MIN: 0.75,
  /* ---- Wheelie und Stoppie ----
     Gemessen wird der Anstellwinkel GEGEN den Boden, nicht gegen den Horizont:
     sonst zählte jede Steilwand von allein als Wheelie und jede Abfahrt als
     Stoppie. Nach oben ist der Winkel begrenzt, sonst gilt ein beginnender
     Überschlag als Trick. */
  // 12°. Bei 17° zählte gar nichts mehr – das Drehmoment am Boden ist klein,
  // die Nase kommt nach der Landung nur kurz hoch. Bei 10° dagegen sprang die
  // Wertung auch bei ganz normaler Fahrt an.
  TRICK_WINKEL: 0.21,   // rad Mindestanstellung gegen den Hang
  TRICK_MAXW: 1.30,     // darüber (75°) kippt man um, das ist kein Trick mehr
  TRICK_TEMPO: 90,      // px/s Mindesttempo – im Stand aufbocken zählt nicht
  /* Beide Nummern lassen sich nur nach einem Sprung anreißen, nicht aus dem
     Stand – und sie halten sich kurz. Gemessen über 60 s Fahrt mit Absicht:
     64 Fahrten auf dem Hinterrad, die längste 0,22 s, der Schnitt 0,07 s.
     Die Punkte sind auf diese Größenordnung gerechnet: gezählt wird ab einer
     Zehntelsekunde, und der Satz vervierfacht sich innerhalb von 0,75 s. */
  TRICK_START: 0.12,    // s, ab denen die Nummer zählt und die Anzeige aufgeht
  TRICK_GNADE: 0.10,    // s Aussetzer (Bodenwelle), die eine Nummer übersteht
  // Punkte pro Sekunde am Anfang – hoch, weil es um Zehntelsekunden geht.
  // Der Stoppie steht höher: er endet schneller im Überschlag.
  TRICK_SATZ_W: 45,
  TRICK_SATZ_S: 58,
  TRICK_RAMPE: 0.25,    // s, nach denen der Satz doppelt so hoch liegt
  TRICK_MAXSATZ: 4,     // Deckel für den Satz, erreicht nach 0,75 s
  TRICK_CAP: 220,       // Deckel je Nummer, damit die Ebene kein Punktefeld wird
  TRICK_HALT: 0.9,      // s, die die fertige Zahl noch stehen bleibt
  PPM: 26,             // Pixel pro Meter
  // Harter Steigungsdeckel: kein Hang wird steiler als das hier (tan).
  // 0.97 = 44,1°. Klettergrenze aus dem Stand: 55,6° auf Fels, 45,2° im
  // tiefsten Schnee – beide über dem Deckel, also gibt es keinen Hang,
  // an dem man zwangsläufig hängen bleibt. Im Schnee wird es trotzdem zäh.
  SLOPE_CAP: 0.97,
  SLOPE_CAP_DOWN: 1.5, // bergab darf es steiler sein (56°)
  SNOWLINE: 2600,      // ab hier Schnee -> weniger Grip
  SNOW_FADE: 1000,
  GRIP_SNOW: 0.86,
  // Gebiete über dem Schnee. Alle drei sind rein optisch – am Grip wird nichts
  // geändert, sonst rutschte die Klettergrenze unter den Steigungsdeckel und es
  // entstünden Hänge, an denen man zwangsläufig hängen bleibt.
  ICELINE: 6500,       // 250 m – Gletschereis mit eingefrorenen Tieren
  LAVALINE: 13000,     // 500 m – Vulkangestein mit glühenden Adern
  SPACELINE: 19500,    // 750 m – Sternenzone, Luft ist praktisch weg
  // Das Finale. Der Deckel wird hart gesetzt, damit alles bei jedem Seed auf
  // genau derselben Höhe liegt und nicht davon abhängt, wo die Strecke gerade
  // zufällig endet: erst eine ebene Anlaufbahn, dann eine gerade Rampe hoch
  // zum Gipfel auf 1000 m – und ab dort ist die Schwerkraft weg.
  GIPFEL: 26000,       // 1000 m, Absprunghöhe
  FINAL_RISE: 1300,    // 50 m, die die Rampe überwindet
  FINAL_FLAT: 520,     // 20 m ebener Anlauf vor der Rampe
  // Die Rampe wird nach oben hin steiler: unten flach genug, um Tempo zu
  // holen, oben über der Klettergrenze von 45,2° – dort trägt einen nur noch
  // der Schwung von unten. Genau das macht den Absprung steil.
  // Gemessen ist 49° an der Kante das Steilste, das auch der schwächste Fahrer
  // ohne Boost noch schafft; ab 52,4° bleibt er kurz vor dem Gipfel hängen.
  FINAL_SLOPE0: 0.55,  // 28,8° am Fuß
  FINAL_SLOPE1: 1.15,  // 49,0° an der Kante
  FINAL_DROP: 1.3,     // so steil fällt der Berg hinter dem Gipfel ab
  FINAL_LIP: 300,      // px flache Schanzenlippe direkt vor dem Absprung
  FINAL_LIP_SLOPE: 0.16,   // 9° – ruhig genug, um das Bike gerade zu legen
  WELTALL_ZEIT: 6,     // s Schwebeflug nach dem Absprung, dann kommt der Abspann
  ABSPANN_ZEIT: 8,     // s Rückblick: auszoomen, Route nachzeichnen, Sternbild
  /* Mitflug: der Heli hängt hinter und über einer Schanzenkante.

     Ausgemessen über 30 zufällige Welten, nur der erste zusammenhängende Flug
     nach der Kante und mit abgeschalteten Helis (sonst zählt der Mitflug selbst
     als Flugbahn): der Scheitel liegt im Median 227 px hinter und nur 102 px
     über der Kante, Spanne 43-227 px Höhe.

     Bei 150 px Höhe erwischte ihn ein sauberer Anflug mit Boost in 63 % der
     Welten. 200 px liegt deutlich über dem mittleren Scheitel: 37 % mit Boost,
     0 % ohne. Man braucht also beides – den Boost und einen guten Absprung. */
  HELI_DX: 300,        // px hinter der Kante
  HELI_DY: 200,        // px über der Kante
  HELI_R: 74,          // Fangradius um die Kabine
  HELI_ZEIT: 2.4,      // s Mitflug bis zum Absetzen
  HELI_GEWINN: 80,     // m Höhe, die der Mitflug bringt
  ZONE_FADE: 2200,     // px, über die ein Gebiet ein- und ausblendet
  BOOST_ACC: 1.85,     // Schubfaktor während des Boosts
  BOOST_SPD: 1.35,     // erlaubte Höchstgeschwindigkeit dabei
  BOOST_DRAIN: 42,     // %/s -> volle Leiste reicht ~2,4 s
  BOOST_CHARGE: 11,    // %/s -> in ~9 s wieder voll
  BOOST_DELAY: 0.8,    // s Pause, bevor nachgeladen wird
  BOOST_FUEL: 2,       // Spritverbrauch während des Boosts (Faktor)
  FUEL_IDLE: 0.85,     // %/s
  FUEL_GAS: 2.3,       // %/s zusätzlich bei Gas
  FUEL_CAN: 35,        // % pro Kanister
  // Abstand so gewählt, dass es knapp wird: gemessen sinkt der Tank vor dem
  // nächsten Kanister im Tiefpunkt auf gut 10 %, mit Boost geht es sich aus.
  CAN_SPACING: 3600,
  // Wie weit ein Rad je Substep höchstens aus dem Boden geschoben wird.
  // Im normalen Fahren liegt das Eindringen bei wenigen Pixeln, die Grenze
  // greift also nur in Ausnahmefällen – siehe collide().
  /* ---- Federung ----
     Ein echter Schwinger, angetrieben von der gemessenen Geschwindigkeits-
     änderung der Räder: beim Aufsetzen federt er ein und wippt gedämpft aus,
     in der Luft zieht er sich ganz aus. Er hängt einseitig an der Physik und
     wirkt nicht auf sie zurück – das ist Absicht. Beide Wege dorthin habe ich
     ausprobiert und wieder verworfen:
       weiche Bodenauflage -> das Rad klebt an den Steilwänden, sie werden
         ohne Boost von 17 % auf 42 % schaffbar (auch bei 2 px Federweg)
       weiche Streben zum Fahrer -> die Fahrermasse rutscht unter die Achse
         durch und hängt dort, womit die Balance auf dem Kopf steht          */
  SUSP_TRAVEL: 12,     // px Federweg bis zum Anschlag
  SUSP_HIT: 0.09,      // wie viel Federweg je px/s Auftreffgeschwindigkeit
  SUSP_MIN: 120,       // px/s, darunter gilt es nicht als Stoß
  SUSP_K: 260,         // Federhärte -> rund 2,6 Hz Eigenfrequenz
  SUSP_C: 19,          // Dämpfung, lässt genau ein sichtbares Nachwippen zu
  SUSP_SAG: 2.5,       // px Ruhelage am Boden, in der Luft null

  MAX_PEN: 30,
  V_MAX: 36,           // px pro Substep, Obergrenze je Partikel – siehe capV()
  GEY_PERIODE: [5.5, 8],   // s zwischen zwei Ausbrüchen
  GEY_WARN: 1.1,           // s Blubbern als Vorwarnung
  GEY_DAUER: 1.3,          // s Ausbruch
  GEY_R: 34,               // px halbe Breite der Säule
  AIR_DAMP: 0.9994,
  MEER_GRAV: 0.62,     // Auftrieb im Meer-Modus
  MEER_DAMP: 0.9975,   // Wasser bremst stärker als Luft
  ROLL_FRIC: 0.007,
  BRAKE_FRIC: 0.14,
  REST: 0.12,

  /* ---- Wetter ----
     Der Grip-Verlust im Regen ist bewusst klein: die Klettergrenze aus dem
     Stand liegt bei asin(ACC*grip/2/GRAV) und muss über dem Steigungsdeckel
     von 44,1° bleiben, sonst gäbe es Hänge, an denen man zwangsläufig hängt.
     Mit 12 % bleibt sie bei 45,7° – rutschig anfühlen tut es sich trotzdem,
     weil die Bremse fast die Hälfte ihrer Wirkung verliert. */
  WEA_FIRST: [22, 45],       // s bis zur ersten Wetterlage
  WEA_PAUSE: [30, 62],       // s Pause danach
  WEA_RAIN_GRIP: 0.12,       // Grip-Verlust im Regen (nur auf Fels, nicht im Schnee)
  WEA_RAIN_BRAKE: 0.45,      // so viel Bremswirkung geht im Nassen verloren
  WEA_WIND: 250,             // px/s² Gegenwind in der Luft, Böen skalieren das
  WEA_WIND_GROUND: 0.6,      // am Boden hält das Rad dagegen
  WEA_TORNADO_GRAV: 0.55,    // Gravitation direkt am Trichter
  WEA_TORNADO_R: 1600,       // Wirkradius des Trichters
  // Sog als Vielfaches von WEA_WIND. 3,2 heißt am Boden bis 480 px/s²: klar
  // spürbar, aber unter dem Antrieb (1650), man kommt also wieder weg.
  WEA_TORNADO_PULL: 3.2,
  // Auftrieb: 1300 gegen 1100 Schwerkraft im Kern, das Bike hebt also knapp ab.
  // Er läuft mit der Höhe aus, sonst würde man immer weiter steigen. Gemessen
  // hängt man so ~2 s am Stück in der Luft; mit mehr Auftrieb wird man minuten-
  // lang festgehalten und stürzt beim Landen deutlich öfter.
  WEA_TORNADO_LIFT: 1300,    // px/s² direkt über dem Boden
  WEA_TORNADO_LIFT_H: 100,   // px, über denen kein Auftrieb mehr wirkt
  WEA_BOLT_EVERY: [3, 5.5],  // s zwischen zwei Blitzen
  WEA_BOLT_WARN: 1.2,        // s Vorwarnung, bevor es einschlägt
  WEA_BOLT_LEAD: 0.85,       // wie weit der Blitz vorhält (1 = perfekt gezielt)
  WEA_BOLT_SPREAD: 280,      // px Streuung um den vorgehaltenen Punkt
  WEA_BOLT_HIT: 58,          // px Trefferradius

  /* ---- Gefahren, die einen einzeln jagen ----
     Alle drei folgen dem Muster des Blitzes: erst eine sichtbare Vorwarnung,
     dann der Treffer. Ohne Vorwarnung wäre keine davon fair. */
  ADLER_VON: 1500,           // Welt-y, ab der Adler jagen (~58 m)
  ADLER_EVERY: [10, 17],     // s zwischen zwei Angriffen
  // Kreisen und Sturz zusammen sind die Zeit zum Ausweichen. 1,15 s Kreisen
  // plus 1150 px/s Sturz waren zu knapp – jetzt bleibt gut die doppelte Zeit.
  ADLER_WARN: 2.1,           // s Kreisen über dem Fahrer, bevor er stößt
  ADLER_SPEED: 780,          // px/s im Sturzflug
  ADLER_HIT: 44,             // px Trefferradius
  ADLER_LEAD: 0.55,          // wie weit er vorhält

  UFO_EVERY: [8, 14],        // s zwischen zwei Entführungsversuchen
  UFO_WARN: 1.35,            // s, in denen der Strahl anwächst
  UFO_HIT: 60,               // px Radius des Fangstrahls
  UFO_LEAD: 0.8,
  UFO_SPREAD: 240,

  KOMET_EVERY: [5, 9],       // s zwischen zwei Einschlägen
  KOMET_WARN: 1.6,           // s Vorwarnung mit Zielkreis am Boden
  KOMET_HIT: 74,             // px Einschlagradius
  KOMET_LEAD: 0.7,
  KOMET_SPREAD: 300,
};
