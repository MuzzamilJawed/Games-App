export const IMPOSTER_WORDS: Record<string, string[]> = {
  movies: [
    "Inception", "Avatar", "Joker", "Interstellar", "Gladiator", "Matrix", "Titanic", "Avengers",
    "Godfather", "Braveheart", "Frozen", "Ratatouille", "Shrek", "Batman", "Superman", "Spiderman",
    "Deadpool", "Extraction", "Incredibles", "Moana", "Coco", "Cars", "Zootopia", "Dune", "Oppenheimer",
    "Barbie", "Tenet", "Gravity", "Up", "Soul", "Minions", "Predator", "Alien", "Rambo"
  ],
  food: [
    "Pizza", "Burger", "Pasta", "Sushi", "Taco", "Steak", "Ramen", "Biryani", "Donut", "Lasagna",
    "Pancakes", "Waffles", "Salad", "Sandwich", "Falafel", "Shawarma", "Hummus", "Omelette",
    "Brownie", "Cupcake", "Ice Cream", "Noodles", "Dumplings", "Burrito", "Nachos", "Quesadilla",
    "Spaghetti", "Risotto", "Croissant", "Bagel", "Hotdog", "Kebab", "Fries", "Gelato"
  ],
  places: [
    "Paris", "Tokyo", "Dubai", "London", "Mumbai", "New York", "Rome", "Sydney", "Cairo", "Moscow",
    "Berlin", "Madrid", "Toronto", "Seoul", "Bangkok", "Istanbul", "Singapore", "Venice", "Vienna",
    "Prague", "Amsterdam", "Athens", "Mexico City", "Rio de Janeiro", "Cape Town", "Chicago", "Miami",
    "Hong Kong", "Shanghai", "Beijing", "San Francisco", "Barcelona", "Florence", "Kyoto"
  ],
  sports: [
    "Football", "Cricket", "Tennis", "Boxing", "Hockey", "Basketball", "Golf", "Baseball",
    "Rugby", "Volleyball", "Badminton", "Swimming", "Athletics", "Cycling", "Gymnastics",
    "Archery", "Bowling", "Fencing", "Judo", "Karate", "Surfing", "Skating", "Skiing",
    "Wrestling", "Squash", "Billiards", "Darts", "Polo", "Snooker", "Handball", "Chess"
  ],
  tech: [
    "React", "Docker", "Linux", "Typescript", "Github", "Python", "NodeJS", "Google", "Apple", "Microsoft",
    "Amazon", "Netflix", "Facebook", "Twitter", "Instagram", "Snapchat", "Tiktok", "Tesla", "Nvidia",
    "OpenAI", "ChatGPT", "Android", "iPhone", "Macbook", "Windows", "Uber", "Airbnb", "Spotify",
    "Adobe", "Slack", "Zoom", "Discord", "Pinterest", "Oracle"
  ],
  objects: [
    "Table", "Phone", "Chair", "Clock", "Lamp", "Keyboard", "Mirror", "Hammer", "Laptop", "Backpack",
    "Bottle", "Camera", "Glasses", "Headphones", "Key", "Wallet", "Watch", "Umbrella", "Spoon", "Fork",
    "Knife", "Plate", "Bowl", "Towel", "Pillow", "Blanket", "Candle", "Vase", "Mirror", "Painting",
    "Sculpture", "Guitar", "Piano", "Trumpet", "Violin", "Radio", "Television"
  ],
};

export type ImposterCategory = keyof typeof IMPOSTER_WORDS;
export const DEFAULT_CATEGORIES = Object.keys(IMPOSTER_WORDS);
