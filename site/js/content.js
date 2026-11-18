// Calendar copy and default package clues.
const P=n=>`Dein Päckchen trägt die Nummer ${String(n).padStart(2,'0')}.`;
const D=[
["Das erste Abenteuer wird knusprig.",P(1)],
["Für die Tage ohne Hantel: Dein Kleiderschrank bekommt Verstärkung.",P(2)],
["Heute wird gerollt – aber nicht auf dem Sofa. Halte dir den Abend frei, wir gehen aus.","Kein Päckchen heute. Die Uhrzeit verrate ich dir beim Frühstück."],
["Heute versuchen wir, den Abspann gemeinsam zu erleben. Heißgetränk inklusive.","Kein Päckchen heute. Heute Abend: Sofa, Decke, ich sorge für den Rest."],
["Frühstücks-Quest: etwas Warmes, Rundes, mit rotem Beeren-Buff. Der Pfannenmeister bin heute ich.","Kein Päckchen. Bleib sitzen – das Frühstück kommt zu dir."],
["Heute darf Honey die Welt auswählen – und ich schaue mit offenen Augen zu. Ohne Augenrollen. Fast.","Kein Päckchen. Heute Abend läuft dein Lieblingsgenre, ich sitze neben dir."],
["Kleiner bunter Bonus-Fund für zwischendurch. Wackelt und ist überraschend süß.",P(7)],
["Hier fehlt noch ein bisschen Weihnachtszauber … ✨",P(8)],
["Bunt, glibberig, gnadenlos gut. Teilen ist optional.",P(9)],
["Braun, süß und rucksacktauglich. Der Notvorrat für Tage mit wenig Nerven.",P(10)],
["Etwas zum Zergehen – im Mund, nicht in der Tasche. Bitte nicht in der Sonne parken.",P(11)],
["Kakao-Energie in kompakter Form. Das Sofa kann zusehen.",P(12)],
["Für den seltenen Fall, dass das Sofa wieder stärker ist als du.",P(13)],
["Flüssiger Buff, gut gekühlt. Das Croissant bleibt heute im Backfach.",P(14)],
["Ein Schluck Wachbleiben für den Serienabend. Ich zähle die Minuten mit.",P(15)],
["Das Croissant hat heute trainingsfrei. Zeit für Plan B.",P(16)],
["Eine Probe-Portion für den Pump. Ein Löffelchen Zukunft, sozusagen.",P(17)],
["Kompakter Muskelsnack für unterwegs. Passt in jede Jackentasche.",P(18)],
["Zum Reinbeißen zwischen zwei Sätzen. Der Pump sagt danke.",P(19)],
["Plan B braucht ein Gefäß. Schütteln, nicht rühren, Herr Honey.",P(20)],
["Ein bisschen Gänsehaut. Diesmal bist du dabei noch wach.",P(21)],
["Weich, warm und sofatauglich. Eines für heute, eines für morgen.",P(22)],
["Teil zwei der Kuschel-Ausrüstung. Dein Sofa-Look ist jetzt komplett.",P(23)],
["Das letzte Fundstück: für kalte Füße beim Serienmarathon. Und für mich, wenn ich sie klaue.",P(24)]];
const FIN="Alle 24 Fundstücke sind gehoben. Danke, dass du jeden Morgen mit mir geöffnet hast, Honey. Das schönste Level war immer das Sofa – mit dir.";

// Memory card faces
const MEMORY_SYMBOLS=[['🎮','Gamepad'],['🏋️','Hantel'],['🏴‍☠️','Piratenflagge'],['❤️','Herz']];

// Chocolate bear copy
const BEAR_INTRO='Na, wer steckt denn da drin? Tipp mich an! 🤎';
const BEAR_REVEAL='Überraschung! Ich bin die süße Füllung. 😘';

// Shaker copy
const SHAKER_INTRO='Bereit für deinen Shake?';
const SHAKER_REVEAL='Für große Gains braucht man den richtigen Shake. 💪';

// Lotus game configuration and copy
const LOTUS_CONFIG={giftHint:''};
const LOTUS_ROOT='assets/day-05/';
const LOTUS_STAGES=['stage-0-plate-illustrated.png','stage-1-base-illustrated.png','stage-2-cream-illustrated.png','stage-3-finished-illustrated.png'];
const LOTUS_ALTS=['Leerer Teller','Teller mit Keksboden','Cheesecake mit Cremeschicht','Fertiger Lotus-Cheesecake mit Keks'];
const LOTUS_NAMES=['Kekse','Creme','Lotus-Aufstrich'];
const LOTUS_INGREDIENTS=['ingredient-biscuits-illustrated.png','ingredient-cream-illustrated.png','ingredient-lotus-illustrated.png'];
const LOTUS_TITLE='Heute bist du der Cheesecake-Chef!';
const LOTUS_WIN='';

// Movie game configuration and copy
const MOVIE_ROOT='assets/day-07/';
const MOVIE_TITLE='';
const MOVIE_KEYS=['lampOff','tvOn','mugsTaken'];
const MOVIE_MESSAGES={lampOff:'Licht aus. Gemütlichkeit an.',tvOn:'Der Film kann warten. Hauptsache, wir sind zusammen.',mugsTaken:'Heiße Schokolade? Unbedingt.'};
const MOVIE_LABELS={lampOff:['Lampe ausschalten','Lampe ist ausgeschaltet'],tvOn:['Fernseher einschalten','Fernseher ist eingeschaltet'],mugsTaken:['Heiße Schokolade nehmen','Heiße Schokolade ist in unseren Händen']};

// Gift text displayed in the HTML cards.
const COPY={
  "massageCaption": "Kopf aus. Gänsehaut an. 🤤",
  "lotusInstructions": "Finde die richtige Reihenfolge! Zieh die Zutaten auf den Teller oder tippe sie an.",
  "lotusTouchGuide": "Zum Ziehen kurz gedrückt halten.",
  "lotusVoucherTitle": "Ein süßes Versprechen",
  "lotusVoucherCopy": "Ein bisschen knusprig, ein bisschen cremig und mit ganz viel Liebe. Was dahintersteckt? Das verrät dir dein Päckchen Nummer 05.",
  "movieInstructions": "Drei kleine Handgriffe fehlen noch. Findest du sie?",
  "movieScreenLabel": "Unser Filmabend",
  "movieInvitationTitle": "Unser Filmabend ist bereit 🤎",
  "movieInvitationCopy": "Du suchst den Film aus. Gekuschelt wird sowieso. Such dein Päckchen Nummer 07."
};

// Sections whose images are loaded only when that gift is opened.
const ENERGY_TITLE='Neue Energie für Andre! ⚡';
const ENERGY_WIN='';
const ENERGY_HELP='';
const ENERGY_CALM_HELP='Wähle die Batterien mit Tab und Enter oder tippe sie an. Sammle fünf Stück.';
const ENERGY_BATTERY='assets/day-09/battery.png';
const ENERGY_STEPS=['Andre hat nur noch 3 % Akku. Fang die Batterien!','Ein bisschen Strom. Weiter so!','Er blinzelt schon. Noch drei!','Fast wach. Noch zwei!','Er lächelt! Noch eine!','Akku voll! Der Abspann ist in Reichweite.'];
const ENERGY_MOODS={sleepy:'Andre schläft auf dem Sofa',awake:'Andre wird langsam wach',happy:'Andre lächelt',cheer:'Andre jubelt mit beiden Armen in der Luft'};
const MATCH_TITLE='Bärchen sammeln, Päckchen öffnen! 🤎';
const MATCH_ROOT='assets/day-10/';
const MIRROR_TITLE='Beschlagener Spiegel ✨';
const MIRROR_STEPS=['Der Spiegel ist beschlagen. Wisch mit dem Finger darüber.','Da ist etwas … wisch weiter.','Fast frei. Man ahnt schon, was da steht.','Gleich hast du es.'];
const DAY_MEDIA={1:'pirate',3:'bear',4:'elixir',5:'lotus',6:'massage',7:'movie',8:'tree',9:'energy',10:'match',12:'cookie',13:'locker',14:'snack'};

// Day 8: room-relative star positions and bulb centers on the supplied full images.
const TREE_ROOT='assets/day-08/';
const TREE_TITLE=D[7][0];
const TREE_WIN='Viel besser! Jetzt darfst du Päckchen Nr. 8 öffnen. 🤎';
const TREE_STARS=[
 {id:'upper',label:'Ersten Stern finden',foundLabel:'Ersten Stern gefunden',x:48,y:18},
 {id:'middle',label:'Zweiten Stern finden',foundLabel:'Zweiten Stern gefunden',x:58,y:40},
 {id:'lower',label:'Dritten Stern finden',foundLabel:'Dritten Stern gefunden',x:43,y:69}
];
const TREE_BULBS={
 upper:[[36.6,23.4],[40.8,25.1],[45.9,26.5],[51.4,27.1],[56.9,27.3],[62.1,26.2],[65.8,24.9]],
 middle:[[26.8,43.7],[31.5,45.4],[37.2,46.5],[44,47.4],[50.6,47.3],[57,46.2],[62.8,44.8],[68.1,43.2],[72.4,41.3]],
 lower:[[20.9,59.8],[26.1,61.8],[31.9,63.3],[38.4,64.3],[45.6,64.8],[52.9,64.6],[59.9,64],[66.4,62.6],[72.2,61.3],[77.4,59.7]]
};
COPY.treeInstructions='Drei kleine Sterne bringen ihn zurück.';

const COOKIE_TITLE='Knusprig außen, karamellig innen. Zimt gibt’s gratis.';

const PIRATE_TITLE='Ein Abenteuer beginnt … 🏴‍☠️';
