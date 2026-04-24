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
    "autoscaling","cybersecurity","infrastructure","documentation","architecture","multithreading","cryptography","telecommunication","decentralization","hyperautomation"
  ],
  gaming: [
    "quest","lobby","combo","level","spawn","speed","token","party","arcade","rescue",
    "avatar","battle","puzzle","mission","stamina","sandbox","leaderboard","checkpoint","campaign","multiplayer",
    "adventure","inventory","character","controller","challenge","scoreboard","matchmaking","achievement","customizer","competitive",
    "tournament","simulation","crafting","crossplay","speedrunner","cooperative","strategist","completionist","exploration","progression",
    "cinematic","matchpoint","powerup","elimination","consolation","reputation","leaderstats","voicechat","integration","community"
  ],
  movies: [
    "scene","actor","drama","music","comedy","poster","camera","cinema","thrill","script",
    "dialogue","director","festival","narrator","costume","blockbuster","character","screenplay","adventure","animation",
    "soundtrack","franchise","mystery","suspense","producer","premiere","indiefilm","biography","cinematics","documentary",
    "psychology","historical","epicstory","voiceover","intermission","sounddesign","storyboard","cliffhanger","timejump","performance",
    "production","shortfilm","sequel","prequel","trilogy","masterpiece","satire","reenactment","flashback","monologue"
  ],
  science: [
    "atom","cell","orbit","force","mass","plant","virus","laser","brain","fossil",
    "energy","gravity","species","climate","element","ecosystem","particle","quantum","telescope","molecule",
    "chemistry","dinosaur","equation","mutation","velocity","radiation","satellite","researcher","evolution","laboratory",
    "microscope","experiment","volcanoes","photosynthesis","biodiversity","thermodynamics","neuroscience","astronomy","geology","meteorology",
    "nanotechnology","biochemistry","electromagnetism","paleontology","cardiovascular","pharmacology","bioluminescence","microbiology","cytogenetics","astrobiology"
  ],
  sports: [
    "team","goal","race","dive","jump","kick","coach","score","event","sprint",
    "player","league","stamina","captain","athlete","stadium","penalty","defense","offense","fitness",
    "training","strategy","tournament","marathon","swimming","wrestling","baseball","volleyball","basketball","gymnastics",
    "endurance","referee","champion","knockout","playmaker","crossbar","dribbling","freekick","relayrace","tabletennis",
    "badminton","snowboarding","motorsport","triathlon","weightlifting","quarterback","goalkeeper","powerlifting","synchronised","professional"
  ],
  travel: [
    "trip","visa","tour","map","camp","hike","train","hotel","beach","guide",
    "resort","flight","island","museum","temple","journey","luggage","tourism","backpack","vacation",
    "mountain","passport","landmark","currency","adventure","roadtrip","itinerary","timezone","explorer","sightseeing",
    "destination","transit","embassy","homestay","navigation","photospot","boardwalk","seaport","highlands","waterfall",
    "crossborder","wilderness","expedition","countryside","pilgrimage","metropolis","transportation","archipelago","underground","intercontinental"
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
];
