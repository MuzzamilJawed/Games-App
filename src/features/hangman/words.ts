export type HangmanWordEntry = {
  value: string;
  categories: string[];
};

export type HangmanDifficulty = "easy" | "medium" | "hard" | "mixed";

const CATEGORY_WORDS: Record<string, string[]> = {
  tech: [
    "cache","pixel","cloud","linux","router","script","python","docker","github","socket",
    "backend","frontend","browser","firewall","terminal","database","function","compiler","pipeline","rendering",
    "algorithm","framework","debugging","interface","middleware","encryption","deployment","typescript","repository","microservice",
    "virtualization","authentication","observability","configuration","synchronization","containerization","parallelization","serialization","loadbalancer","orchestration",
    "autoscaling","cybersecurity","infrastructure","documentation","architecture","multithreading","cryptography","telecommunication","decentralization","hyperautomation",
    "webhook","endpoint","payload","runtime","refactor","variable","constant","boolean","iteration","recursion",
    "library","package","devops","staging","version","cluster","session","latency","throttle","caching",
    "monolith","serverless","streaming","protocol","handshake","certificate","firestore","indexing","webhook","sandbox"
  ],
  gaming: [
    "quest","lobby","combo","level","spawn","speed","token","party","arcade","rescue",
    "avatar","battle","puzzle","mission","stamina","sandbox","leaderboard","checkpoint","campaign","multiplayer",
    "adventure","inventory","character","controller","challenge","scoreboard","matchmaking","achievement","customizer","competitive",
    "tournament","simulation","crafting","crossplay","speedrunner","cooperative","strategist","completionist","exploration","progression",
    "cinematic","matchpoint","powerup","elimination","consolation","reputation","leaderstats","voicechat","integration","community",
    "respawn","lootbox","upgrade","stealth","dungeon","bossfight","sidequest","cutscene","dialogue","roleplay",
    "hardmode","tutorial","platform","shooter","strategy","survival","openworld","freeplay","hitpoints","endgame",
    "veteran","newbie","grinder","modding","console","streaming","esports","ranking","season","prestige"
  ],
  movies: [
    "scene","actor","drama","music","comedy","poster","camera","cinema","thrill","script",
    "dialogue","director","festival","narrator","costume","blockbuster","character","screenplay","adventure","animation",
    "soundtrack","franchise","mystery","suspense","producer","premiere","indiefilm","biography","cinematics","documentary",
    "psychology","historical","epicstory","voiceover","intermission","sounddesign","storyboard","cliffhanger","timejump","performance",
    "production","shortfilm","sequel","prequel","trilogy","masterpiece","satire","reenactment","flashback","monologue",
    "credits","casting","audition","trailer","remake","reboot","spinoff","cameo","villain","antihero",
    "plottwist","setting","subtext","genre","horror","thriller","romance","western","fantasy","scifi",
    "editing","lighting","closeup","montage","continuity","reception","premiere","streaming","festival","audience"
  ],
  science: [
    "atom","cell","orbit","force","mass","plant","virus","laser","brain","fossil",
    "energy","gravity","species","climate","element","ecosystem","particle","quantum","telescope","molecule",
    "chemistry","dinosaur","equation","mutation","velocity","radiation","satellite","researcher","evolution","laboratory",
    "microscope","experiment","volcanoes","photosynthesis","biodiversity","thermodynamics","neuroscience","astronomy","geology","meteorology",
    "nanotechnology","biochemistry","electromagnetism","paleontology","cardiovascular","pharmacology","bioluminescence","microbiology","cytogenetics","astrobiology",
    "nuclear","polymer","protein","hormone","neuron","enzyme","isotope","plasma","catalyst","electrode",
    "refraction","diffusion","osmosis","entropy","momentum","amplitude","wavelength","frequency","spectrum","hypothesis",
    "taxonomy","genotype","phenotype","biosphere","ecosystem","symbiosis","predator","mutation","antibiotic","vaccine"
  ],
  sports: [
    "team","goal","race","dive","jump","kick","coach","score","event","sprint",
    "player","league","stamina","captain","athlete","stadium","penalty","defense","offense","fitness",
    "training","strategy","tournament","marathon","swimming","wrestling","baseball","volleyball","basketball","gymnastics",
    "endurance","referee","champion","knockout","playmaker","crossbar","dribbling","freekick","relayrace","tabletennis",
    "badminton","snowboarding","motorsport","triathlon","weightlifting","quarterback","goalkeeper","powerlifting","synchronised","professional",
    "timeout","halftime","overtime","substitute","formation","transfer","contract","sponsor","broadcast","commentary",
    "medal","trophy","podium","bracket","seeding","wildcard","playoff","division","franchise","fanbase",
    "pitching","batting","serving","blocking","tackling","sprinting","hurdling","archery","fencing","rowing"
  ],
  travel: [
    "trip","visa","tour","map","camp","hike","train","hotel","beach","guide",
    "resort","flight","island","museum","temple","journey","luggage","tourism","backpack","vacation",
    "mountain","passport","landmark","currency","adventure","roadtrip","itinerary","timezone","explorer","sightseeing",
    "destination","transit","embassy","homestay","navigation","photospot","boardwalk","seaport","highlands","waterfall",
    "crossborder","wilderness","expedition","countryside","pilgrimage","metropolis","transportation","archipelago","underground","intercontinental",
    "layover","customs","baggage","boarding","lounge","capsule","hostel","glamping","safari","cruise",
    "glacier","canyon","plateau","lagoon","harbor","cobblestone","marketplace","boulevard","cathedral","monument",
    "folklore","culture","language","souvenir","exchange","budget","booking","checkin","checkout","departure"
  ],
  music: [
    "chord","tempo","piano","drums","album","vocal","lyrics","melody","rhythm","guitar",
    "studio","concert","artist","record","treble","bassline","harmony","acoustic","electric","orchestra",
    "composer","producer","vocalist","conductor","ensemble","symphony","sonata","ballad","overture","setlist",
    "crescendo","improvise","pentatonic","chromatic","metronome","synthesizer","amplifier","microphone","frequency","turntable",
    "riff","solo","bridge","chorus","verse","hook","cover","remix","mashup","feature",
    "jazz","blues","opera","reggae","hiphop","classical","folklore","ambient","grunge","techno",
    "playlist","streaming","concert","fanbase","manager","contract","royalty","performance","release","single",
    "drumkit","keyboard","violin","trumpet","saxophone","clarinet","flute","cello","banjo","ukulele"
  ],
  food: [
    "pizza","sushi","burger","pasta","ramen","tacos","curry","steak","salad","donut",
    "waffle","pancake","crepe","omelet","risotto","gumbo","pierogi","baklava","croissant","focaccia",
    "tiramisu","bruschetta","guacamole","shawarma","hummus","lasagna","stroganoff","dumpling","enchilada","falafel",
    "tempura","paella","pho","gelato","ceviche","fondue","tagine","chowder","tamale","kimchi",
    "noodles","brisket","gyoza","katsu","miso","gazpacho","gnocchi","tzatziki","mousse","quiche",
    "tartare","carpaccio","prosciutto","antipasto","pancetta","charcuterie","brulee","sorbet","macaron","eclair",
    "caramel","toffee","truffle","ganache","praline","marmalade","chutney","relish","brine","pickle",
    "sourdough","brioche","baguette","ciabatta","pretzel","muffin","scone","biscotti","granola","porridge"
  ],
};

export const HANGMAN_WORDS: HangmanWordEntry[] = Object.entries(CATEGORY_WORDS).flatMap(
  ([category, words]) => words.map((word) => ({ value: word, categories: [category] })),
);

export const HANGMAN_CATEGORIES: string[] = [
  "tech",
  "gaming",
  "movies",
  "science",
  "sports",
  "travel",
  "music",
  "food",
];
