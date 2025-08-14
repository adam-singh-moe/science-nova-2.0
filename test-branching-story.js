// Test data for branching narrative storybook
export const branchingStoryData = {
  title: "The Mysterious Cave Adventure",
  pages: [
    {
      id: "start",
      content: "You are exploring a forest when you discover a mysterious cave entrance. The air is cool and you can hear strange sounds echoing from within. A wooden sign next to the entrance reads: 'Danger - Ancient Mysteries Await!'",
      backgroundPrompt: "A dark mysterious cave entrance in a lush forest, sunlight filtering through trees",
      choices: [
        { text: "Enter the cave immediately - you're feeling brave!", nextPageId: "enter-brave" },
        { text: "Look for equipment first - better to be prepared", nextPageId: "find-equipment" },
        { text: "Turn back - this seems too dangerous", nextPageId: "turn-back" }
      ]
    },
    {
      id: "enter-brave",
      content: "You boldly step into the dark cave! Your eyes slowly adjust to the darkness. You see two tunnels ahead - one going down deeper into the earth, and another that seems to curve upward toward dim light.",
      backgroundPrompt: "Inside a dark cave with two tunnel entrances, mysterious shadows and rocky walls",
      choices: [
        { text: "Take the tunnel going deeper down", nextPageId: "deep-tunnel" },
        { text: "Follow the tunnel toward the light", nextPageId: "light-tunnel" }
      ]
    },
    {
      id: "find-equipment",
      content: "Smart thinking! You search around and find an old backpack with a flashlight, rope, and some emergency supplies. Now you feel much more prepared for whatever awaits inside the cave.",
      backgroundPrompt: "An old backpack with camping equipment, flashlight and rope near a cave entrance",
      choices: [
        { text: "Enter the cave with your equipment", nextPageId: "enter-prepared" },
        { text: "Mark the location and return with friends", nextPageId: "return-later" }
      ]
    },
    {
      id: "turn-back",
      content: "Sometimes the wisest choice is knowing when not to take a risk. You mark the cave location on your map and head back to town. Later, you organize a proper expedition with experienced cavers and safety equipment. The cave's mysteries will have to wait for another day!",
      backgroundPrompt: "A person walking away from a cave entrance, marking location on a map"
    },
    {
      id: "deep-tunnel",
      content: "You venture deeper into the earth. The tunnel opens into a vast underground chamber filled with glowing crystals! The walls sparkle like stars, and you hear the gentle sound of an underground stream. You've discovered an amazing crystal cavern!",
      backgroundPrompt: "A magnificent underground crystal cavern with glowing blue and purple crystals"
    },
    {
      id: "light-tunnel",
      content: "Following the light leads you to an incredible discovery - an ancient underground garden! Bioluminescent plants create a magical glow, and you see evidence that someone once lived here long ago. What an amazing find!",
      backgroundPrompt: "An underground garden with glowing plants and ancient stone structures"
    },
    {
      id: "enter-prepared",
      content: "With your flashlight guiding the way, you explore safely and methodically. You discover ancient cave paintings on the walls - evidence of people who lived here thousands of years ago! Your preparation paid off as you document this incredible archaeological discovery.",
      backgroundPrompt: "Ancient cave paintings illuminated by flashlight beam, showing primitive art and symbols"
    },
    {
      id: "return-later",
      content: "You return to town and organize a proper scientific expedition. A few weeks later, you lead a team of archaeologists and geologists back to the cave. Together, you make groundbreaking discoveries about ancient civilizations. Your caution and leadership made this success possible!",
      backgroundPrompt: "A scientific expedition team with equipment studying cave formations and ancient artifacts"
    }
  ]
};
