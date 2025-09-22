const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample Discovery Content for different topics and grade levels
const discoveryContent = [
  // Chemistry Content (Grade 6)
  {
    topicTitle: 'Chemistry',
    category: 'DISCOVERY',
    subtype: 'FACT',
    title: 'Water Molecule Structure',
    payload: {
      text: 'Water has the chemical formula H2O.',
      detail: 'Each water molecule consists of two hydrogen atoms bonded to one oxygen atom, creating a bent molecular shape that gives water its unique properties.',
      points: [
        'Two hydrogen atoms',
        'One oxygen atom',
        'Bent molecular shape'
      ],
      source: 'https://www.chem4kids.com',
      preview: 'H2O - the most important molecule for life on Earth...'
    }
  },
  {
    topicTitle: 'Chemistry',
    category: 'DISCOVERY',
    subtype: 'INFO',
    title: 'States of Matter',
    payload: {
      text: 'Matter exists in three main states: solid, liquid, and gas.',
      detail: 'The state of matter depends on temperature and pressure. Heating adds energy to particles, making them move faster and change states.',
      points: [
        'Solid - particles vibrate in place',
        'Liquid - particles flow freely',
        'Gas - particles spread out completely'
      ],
      preview: 'From ice to steam, matter changes states with energy...'
    }
  },
  {
    topicTitle: 'Chemistry',
    category: 'DISCOVERY',
    subtype: 'FACT',
    title: 'Chemical Reactions',
    payload: {
      text: 'Chemical reactions create new substances with different properties.',
      detail: 'During a chemical reaction, atoms rearrange to form new compounds. The total number of atoms stays the same, but they bond differently.',
      points: [
        'Atoms rearrange',
        'New substances form',
        'Conservation of mass'
      ],
      source: 'https://www.khanacademy.org',
      preview: 'When atoms dance and rearrange, new substances emerge...'
    }
  },

  // Space Exploration Content (Grade 4)
  {
    topicTitle: 'Test Topic - Space Exploration',
    category: 'DISCOVERY',
    subtype: 'FACT',
    title: 'Solar System Planets',
    payload: {
      text: 'Our solar system has eight planets orbiting the Sun.',
      detail: 'The planets are divided into inner rocky planets (Mercury, Venus, Earth, Mars) and outer gas giants (Jupiter, Saturn, Uranus, Neptune).',
      points: [
        'Four inner rocky planets',
        'Four outer gas giants',
        'All orbit the Sun'
      ],
      source: 'https://www.nasa.gov',
      preview: 'Eight worlds dance around our bright yellow star...'
    }
  },
  {
    topicTitle: 'Test Topic - Space Exploration',
    category: 'DISCOVERY',
    subtype: 'INFO',
    title: 'International Space Station',
    payload: {
      text: 'The ISS orbits Earth at about 408 kilometers above the surface.',
      detail: 'Astronauts from different countries live and work together on the ISS, conducting experiments and maintaining the station while traveling at 28,000 km/h.',
      points: [
        'Orbits every 90 minutes',
        'International cooperation',
        'Microgravity research'
      ],
      preview: 'A laboratory in the sky where gravity barely exists...'
    }
  },
  {
    topicTitle: 'Test Topic - Space Exploration',
    category: 'DISCOVERY',
    subtype: 'FACT',
    title: 'Moon Phases',
    payload: {
      text: 'The Moon appears to change shape in a 28-day cycle.',
      detail: 'The Moon phases occur because we see different amounts of the sunlit side of the Moon as it orbits Earth. The Moon does not actually change shape.',
      points: [
        'New Moon to Full Moon',
        'Sunlight creates phases',
        '28-day cycle'
      ],
      source: 'https://www.timeanddate.com',
      preview: 'Our cosmic companion plays peek-a-boo each month...'
    }
  },

  // More Earth & Ocean Facts (Grade 5)
  {
    topicTitle: 'Earth & Ocean Facts',
    category: 'DISCOVERY',
    subtype: 'FACT',
    title: 'Ocean Currents',
    payload: {
      text: 'Ocean currents transport heat around the planet.',
      detail: 'The Gulf Stream carries warm water from the tropics to northern regions, affecting weather patterns and climate across continents.',
      points: [
        'Heat transportation',
        'Weather influence',
        'Global circulation'
      ],
      source: 'https://www.noaa.gov',
      preview: 'Rivers of warm and cold water shape our planet\'s weather...'
    }
  },
  {
    topicTitle: 'Earth & Ocean Facts',
    category: 'DISCOVERY',
    subtype: 'INFO',
    title: 'Tectonic Plates',
    payload: {
      text: 'Earth\'s surface is made of moving pieces called tectonic plates.',
      detail: 'These massive rock slabs float on the mantle and slowly move, creating mountains, earthquakes, and volcanic activity when they interact.',
      points: [
        'Floating rock slabs',
        'Cause earthquakes',
        'Create mountains'
      ],
      preview: 'Giant puzzle pieces that reshape our planet over millions of years...'
    }
  }
]

// Sample Arcade Content for different topics
const arcadeContent = [
  // Chemistry Quizzes (Grade 6)
  {
    topicTitle: 'Chemistry',
    category: 'ARCADE',
    subtype: 'QUIZ',
    title: 'States of Matter Quiz',
    payload: {
      subtype: 'QUIZ',
      questions: [
        {
          stem: 'What happens to water when it freezes?',
          choices: [
            { text: 'It becomes ice (solid)', correct: true },
            { text: 'It becomes gas', correct: false },
            { text: 'It stays liquid', correct: false },
            { text: 'It disappears', correct: false }
          ],
          explanation: 'When water freezes at 0°C (32°F), it changes from liquid to solid state, forming ice. The water molecules slow down and form a rigid structure.'
        },
        {
          stem: 'Which state of matter has a definite shape and volume?',
          choices: [
            { text: 'Solid', correct: true },
            { text: 'Liquid', correct: false },
            { text: 'Gas', correct: false },
            { text: 'Plasma', correct: false }
          ],
          explanation: 'Solids have both definite shape and volume because their particles are tightly packed and vibrate in fixed positions.'
        }
      ]
    }
  },
  {
    topicTitle: 'Chemistry',
    category: 'ARCADE',
    subtype: 'FLASHCARDS',
    title: 'Chemical Elements Flashcards',
    payload: {
      subtype: 'FLASHCARDS',
      cards: [
        {
          front: 'What is the chemical symbol for Hydrogen?',
          back: 'H - Hydrogen is the lightest and most abundant element in the universe.'
        },
        {
          front: 'What is the chemical symbol for Oxygen?',
          back: 'O - Oxygen is essential for combustion and breathing.'
        },
        {
          front: 'What is the chemical symbol for Carbon?',
          back: 'C - Carbon forms the backbone of all organic molecules.'
        },
        {
          front: 'What is the chemical symbol for Helium?',
          back: 'He - Helium is a noble gas that makes balloons float.'
        }
      ]
    }
  },

  // Space Exploration Content (Grade 4)
  {
    topicTitle: 'Test Topic - Space Exploration',
    category: 'ARCADE',
    subtype: 'QUIZ',
    title: 'Solar System Quiz',
    payload: {
      subtype: 'QUIZ',
      questions: [
        {
          stem: 'Which planet is closest to the Sun?',
          choices: [
            { text: 'Mercury', correct: true },
            { text: 'Venus', correct: false },
            { text: 'Earth', correct: false },
            { text: 'Mars', correct: false }
          ],
          explanation: 'Mercury is the closest planet to the Sun. It orbits the Sun every 88 Earth days and has extreme temperature variations.'
        },
        {
          stem: 'What is the largest planet in our solar system?',
          choices: [
            { text: 'Jupiter', correct: true },
            { text: 'Saturn', correct: false },
            { text: 'Neptune', correct: false },
            { text: 'Earth', correct: false }
          ],
          explanation: 'Jupiter is the largest planet in our solar system. It\'s so big that all the other planets could fit inside it!'
        },
        {
          stem: 'How many moons does Earth have?',
          choices: [
            { text: 'One', correct: true },
            { text: 'Two', correct: false },
            { text: 'Three', correct: false },
            { text: 'None', correct: false }
          ],
          explanation: 'Earth has one natural moon, which we simply call "the Moon." It orbits Earth approximately every 28 days.'
        }
      ]
    }
  },
  {
    topicTitle: 'Test Topic - Space Exploration',
    category: 'ARCADE',
    subtype: 'FLASHCARDS',
    title: 'Space Facts Flashcards',
    payload: {
      subtype: 'FLASHCARDS',
      cards: [
        {
          front: 'How long does it take for light from the Sun to reach Earth?',
          back: 'About 8 minutes and 20 seconds. Light travels at 300,000 kilometers per second!'
        },
        {
          front: 'What is the name of our galaxy?',
          back: 'The Milky Way. It contains over 100 billion stars including our Sun.'
        },
        {
          front: 'Who was the first person to walk on the Moon?',
          back: 'Neil Armstrong in 1969 during the Apollo 11 mission.'
        },
        {
          front: 'What is a shooting star?',
          back: 'A meteor - a small piece of space rock burning up in Earth\'s atmosphere.'
        }
      ]
    }
  },

  // Earth & Ocean Content (Grade 5)
  {
    topicTitle: 'Earth & Ocean Facts',
    category: 'ARCADE',
    subtype: 'QUIZ',
    title: 'Earth Science Quiz',
    payload: {
      subtype: 'QUIZ',
      questions: [
        {
          stem: 'What percentage of Earth\'s surface is covered by oceans?',
          choices: [
            { text: 'About 71%', correct: true },
            { text: 'About 50%', correct: false },
            { text: 'About 25%', correct: false },
            { text: 'About 90%', correct: false }
          ],
          explanation: 'Oceans cover about 71% of Earth\'s surface. This is why Earth is often called the "Blue Planet" when viewed from space.'
        },
        {
          stem: 'What causes earthquakes?',
          choices: [
            { text: 'Moving tectonic plates', correct: true },
            { text: 'Ocean waves', correct: false },
            { text: 'Wind storms', correct: false },
            { text: 'Volcanic ash', correct: false }
          ],
          explanation: 'Earthquakes are caused by the sudden movement of tectonic plates along fault lines. The energy released creates seismic waves.'
        }
      ]
    }
  },
  {
    topicTitle: 'Earth & Ocean Facts',
    category: 'ARCADE',
    subtype: 'GAME',
    title: 'Ocean Layers Explorer',
    payload: {
      subtype: 'GAME',
      gameType: 'drag-and-drop',
      objective: 'Match ocean creatures to their correct depth zones',
      instructions: 'Drag each sea creature to the ocean zone where it lives.',
      items: [
        {
          id: 1,
          name: 'Dolphin',
          correctZone: 'sunlight',
          description: 'Lives near the surface where there is plenty of light'
        },
        {
          id: 2,
          name: 'Anglerfish',
          correctZone: 'midnight',
          description: 'Lives in the deep, dark ocean and makes its own light'
        },
        {
          id: 3,
          name: 'Kelp',
          correctZone: 'sunlight',
          description: 'Seaweed that needs sunlight to grow'
        },
        {
          id: 4,
          name: 'Giant Squid',
          correctZone: 'twilight',
          description: 'Lives in the dim twilight zone of the ocean'
        }
      ],
      zones: [
        { id: 'sunlight', name: 'Sunlight Zone (0-200m)', color: '#87CEEB' },
        { id: 'twilight', name: 'Twilight Zone (200-1000m)', color: '#4682B4' },
        { id: 'midnight', name: 'Midnight Zone (1000m+)', color: '#191970' }
      ]
    }
  }
]

async function getTopicIdByTitle(title) {
  const { data, error } = await supabase
    .from('topics')
    .select('id')
    .eq('title', title)
    .single()

  if (error) {
    console.error(`Error finding topic "${title}":`, error.message)
    return null
  }
  return data.id
}

async function insertContent(contentArray, contentType) {
  console.log(`\n📝 Inserting ${contentType} content...`)
  
  for (const content of contentArray) {
    try {
      const topicId = await getTopicIdByTitle(content.topicTitle)
      if (!topicId) {
        console.error(`❌ Topic "${content.topicTitle}" not found, skipping content: ${content.title}`)
        continue
      }

      // Check if content already exists
      const { data: existing } = await supabase
        .from('topic_content_entries')
        .select('id')
        .eq('topic_id', topicId)
        .eq('title', content.title)
        .single()

      if (existing) {
        console.log(`⏭️  Content "${content.title}" already exists, skipping...`)
        continue
      }

      const entry = {
        topic_id: topicId,
        category: content.category,
        subtype: content.subtype,
        title: content.title,
        payload: content.payload,
        status: 'published',
        ai_generated: true,
        version: 1,
        created_by: '58ed7802-ff6c-4333-bc52-3a1dc20a58fc' // Admin user ID
      }

      // Add Discovery-specific fields (using defaults for non-nullable columns)
      if (content.category === 'DISCOVERY') {
        // These seem to be auto-generated from payload, so we'll omit them
        // entry.preview_text = content.payload.preview || ''
        // entry.detail_text = content.payload.detail || ''
        // entry.source_text = content.payload.source || ''
      }

      const { data, error } = await supabase
        .from('topic_content_entries')
        .insert(entry)
        .select()

      if (error) {
        console.error(`❌ Error inserting "${content.title}":`, error.message)
      } else {
        console.log(`✅ Successfully inserted: ${content.title} (${content.subtype})`)
      }

    } catch (error) {
      console.error(`❌ Unexpected error with "${content.title}":`, error.message)
    }
  }
}

async function populateDatabase() {
  console.log('🚀 Starting to populate database with sample content...')
  
  try {
    // First check what topics exist
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .order('title')

    if (topicsError) {
      console.error('❌ Error fetching topics:', topicsError.message)
      return
    }

    console.log('\n📚 Available topics:')
    topics.forEach(topic => {
      console.log(`- ${topic.title} (Grade ${topic.grade_level})`)
    })

    // Insert Discovery content
    await insertContent(discoveryContent, 'Discovery')

    // Insert Arcade content
    await insertContent(arcadeContent, 'Arcade')

    console.log('\n🎉 Database population complete!')
    
    // Show final statistics
    const { data: finalContent } = await supabase
      .from('topic_content_entries')
      .select('category, subtype')
      .eq('status', 'published')

    const stats = finalContent.reduce((acc, item) => {
      const key = `${item.category}_${item.subtype}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    console.log('\n📊 Content Statistics:')
    Object.entries(stats).forEach(([key, count]) => {
      const [category, subtype] = key.split('_')
      console.log(`- ${category} ${subtype}: ${count} entries`)
    })

  } catch (error) {
    console.error('❌ Unexpected error during population:', error.message)
  }
}

// Run the population script
populateDatabase()