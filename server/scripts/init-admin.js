const mongoose = require('mongoose');
const User = require('../models/User');
const BlogPost = require('../models/BlogPost');
require('dotenv').config();

// Helper function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

// Sample blog posts data
const samplePosts = [
  {
    title: 'The Ancient Civilizations of Mesopotamia',
    slug: generateSlug('The Ancient Civilizations of Mesopotamia'),
    content: `
      <h2>Introduction</h2>
      <p>Mesopotamia, often referred to as the "Cradle of Civilization," was home to some of the earliest known human civilizations. Located between the Tigris and Euphrates rivers in what is now modern-day Iraq, this region witnessed the development of writing, agriculture, urban planning, and complex social structures.</p>
      
      <h2>Early Development</h2>
      <p>The first cities in Mesopotamia emerged around 4000 BCE, with Uruk being one of the most significant early urban centers. These cities were characterized by monumental architecture, including ziggurats (temple towers) and sophisticated irrigation systems that supported agricultural production.</p>
      
      <h2>Writing and Literature</h2>
      <p>One of Mesopotamia's most significant contributions to human civilization was the development of cuneiform writing around 3200 BCE. This system, which used wedge-shaped marks on clay tablets, enabled the recording of laws, literature, and administrative records. The Epic of Gilgamesh, one of the world's oldest literary works, originated in this region.</p>
      
      <h2>Social Structure</h2>
      <p>Mesopotamian society was hierarchical, with kings and priests at the top, followed by merchants, artisans, and farmers. Slavery was also present, though slaves often had certain rights and could earn their freedom. The Code of Hammurabi, established around 1750 BCE, provides insight into the legal and social structures of the time.</p>
      
      <h2>Legacy</h2>
      <p>The innovations developed in Mesopotamia, including writing, mathematics, astronomy, and urban planning, influenced civilizations throughout the ancient world and continue to impact modern society. The region's contributions to human knowledge and culture cannot be overstated.</p>
    `,
    category: 'history',
    tags: ['ancient', 'civilization', 'mesopotamia', 'writing', 'urbanization'],
    featured: true,
    author: 'Dr. Sarah Johnson'
  },
  {
    title: 'Quantum Computing: The Future of Information Processing',
    slug: generateSlug('Quantum Computing: The Future of Information Processing'),
    content: `
      <h2>Understanding Quantum Computing</h2>
      <p>Quantum computing represents a revolutionary approach to information processing that leverages the principles of quantum mechanics. Unlike classical computers that use bits (0s and 1s), quantum computers use quantum bits or qubits, which can exist in multiple states simultaneously through superposition.</p>
      
      <h2>Key Principles</h2>
      <p>Quantum computing relies on several fundamental principles of quantum mechanics:</p>
      <ul>
        <li><strong>Superposition:</strong> Qubits can exist in multiple states at once</li>
        <li><strong>Entanglement:</strong> Qubits can be correlated in ways that classical bits cannot</li>
        <li><strong>Interference:</strong> Quantum states can interfere with each other constructively or destructively</li>
      </ul>
      
      <h2>Potential Applications</h2>
      <p>Quantum computing has the potential to revolutionize various fields:</p>
      <ul>
        <li><strong>Cryptography:</strong> Breaking current encryption methods and creating new quantum-resistant ones</li>
        <li><strong>Drug Discovery:</strong> Simulating molecular interactions with unprecedented accuracy</li>
        <li><strong>Optimization:</strong> Solving complex optimization problems in logistics and finance</li>
        <li><strong>Machine Learning:</strong> Accelerating AI training and inference</li>
      </ul>
      
      <h2>Current Challenges</h2>
      <p>Despite its potential, quantum computing faces several significant challenges:</p>
      <ul>
        <li>Qubit decoherence and error correction</li>
        <li>Scalability and maintaining quantum states</li>
        <li>Development of quantum algorithms</li>
        <li>Integration with existing computing infrastructure</li>
      </ul>
      
      <h2>Future Outlook</h2>
      <p>While large-scale quantum computers are still in development, the field is advancing rapidly. Major technology companies and research institutions are investing heavily in quantum computing research, and we may see practical applications emerge within the next decade.</p>
    `,
    category: 'technology',
    tags: ['quantum', 'computing', 'technology', 'future', 'innovation'],
    featured: true,
    author: 'Prof. Michael Chen'
  },
  {
    title: 'The Human Brain: Understanding Consciousness',
    slug: generateSlug('The Human Brain: Understanding Consciousness'),
    content: `
      <h2>The Complexity of the Human Brain</h2>
      <p>The human brain is the most complex organ in the human body, containing approximately 86 billion neurons and trillions of synaptic connections. This remarkable organ is responsible for all our thoughts, emotions, memories, and behaviors, yet much about how it works remains a mystery.</p>
      
      <h2>Structure and Function</h2>
      <p>The brain is divided into several major regions, each with specialized functions:</p>
      <ul>
        <li><strong>Cerebrum:</strong> Responsible for higher cognitive functions, including thinking, learning, and memory</li>
        <li><strong>Cerebellum:</strong> Coordinates movement and balance</li>
        <li><strong>Brainstem:</strong> Controls basic life functions like breathing and heart rate</li>
        <li><strong>Limbic System:</strong> Regulates emotions and memory formation</li>
      </ul>
      
      <h2>The Mystery of Consciousness</h2>
      <p>Consciousness remains one of the most challenging problems in neuroscience and philosophy. Despite advances in brain imaging and neuroscience, we still don't fully understand how subjective experience emerges from neural activity. This "hard problem of consciousness" continues to puzzle researchers and philosophers alike.</p>
      
      <h2>Neural Plasticity</h2>
      <p>One of the brain's most remarkable features is its ability to change and adapt throughout life. This neural plasticity allows us to learn new skills, form memories, and recover from injuries. The brain can reorganize itself by forming new neural connections and strengthening existing ones.</p>
      
      <h2>Memory and Learning</h2>
      <p>Memory formation involves complex processes at the cellular and molecular levels. Different types of memory (short-term, long-term, procedural, declarative) are processed in different brain regions and involve different neural mechanisms. Understanding these processes could lead to treatments for memory disorders and improved learning strategies.</p>
      
      <h2>Future Research Directions</h2>
      <p>Advances in technology, such as functional magnetic resonance imaging (fMRI) and optogenetics, are providing new insights into brain function. Researchers are also developing brain-computer interfaces and exploring ways to treat neurological disorders through targeted interventions.</p>
    `,
    category: 'science',
    tags: ['neuroscience', 'consciousness', 'brain', 'memory', 'research'],
    featured: true,
    author: 'Dr. Emily Rodriguez'
  },
  {
    title: 'The Renaissance: A Cultural Revolution',
    slug: generateSlug('The Renaissance: A Cultural Revolution'),
    content: `
      <h2>The Dawn of a New Era</h2>
      <p>The Renaissance, spanning roughly from the 14th to the 17th century, marked a period of profound cultural, artistic, and intellectual transformation in Europe. This "rebirth" of classical knowledge and artistic expression laid the foundation for the modern world.</p>
      
      <h2>Artistic Innovation</h2>
      <p>Renaissance art was characterized by a renewed interest in classical forms, perspective, and human anatomy. Artists like Leonardo da Vinci, Michelangelo, and Raphael created masterpieces that continue to inspire and amaze. The period saw the development of techniques like linear perspective, chiaroscuro (light and shadow), and sfumato (smoky transitions).</p>
      
      <h2>Scientific Advancement</h2>
      <p>The Renaissance was also a time of significant scientific progress. Figures like Copernicus, Galileo, and Vesalius challenged traditional beliefs and laid the groundwork for modern science. The period saw advances in astronomy, anatomy, mathematics, and engineering.</p>
      
      <h2>Humanism and Education</h2>
      <p>Renaissance humanism emphasized the value and agency of human beings, individually and collectively. This philosophy influenced education, literature, and political thought, promoting critical thinking and the study of classical texts. The period saw the establishment of new universities and the spread of literacy.</p>
      
      <h2>Economic and Social Changes</h2>
      <p>The Renaissance coincided with significant economic and social transformations, including the growth of trade, the rise of merchant classes, and the development of banking systems. These changes created new opportunities for cultural patronage and artistic expression.</p>
      
      <h2>Legacy</h2>
      <p>The Renaissance's influence extends far beyond its historical period. Its emphasis on human potential, artistic excellence, and intellectual inquiry continues to shape our understanding of culture, education, and human achievement.</p>
    `,
    category: 'culture',
    tags: ['renaissance', 'art', 'culture', 'history', 'humanism'],
    author: 'Prof. David Thompson'
  },
  {
    title: 'Climate Change: Understanding Our Planet\'s Future',
    slug: generateSlug('Climate Change: Understanding Our Planet\'s Future'),
    content: `
      <h2>The Science of Climate Change</h2>
      <p>Climate change refers to long-term shifts in global weather patterns and average temperatures. While climate has changed throughout Earth's history, the current warming trend is unprecedented in both its speed and the level of scientific certainty about its causes.</p>
      
      <h2>Evidence and Observations</h2>
      <p>Multiple lines of evidence confirm that Earth's climate is warming:</p>
      <ul>
        <li>Rising global temperatures</li>
        <li>Melting glaciers and ice sheets</li>
        <li>Rising sea levels</li>
        <li>Changes in precipitation patterns</li>
        <li>Shifts in plant and animal ranges</li>
      </ul>
      
      <h2>Human Contributions</h2>
      <p>Scientific consensus indicates that human activities, particularly the burning of fossil fuels and deforestation, are the primary drivers of recent climate change. The increase in greenhouse gases like carbon dioxide traps heat in Earth's atmosphere, leading to global warming.</p>
      
      <h2>Impacts and Consequences</h2>
      <p>Climate change affects various aspects of our planet:</p>
      <ul>
        <li><strong>Ecosystems:</strong> Habitat loss and species extinction</li>
        <li><strong>Weather:</strong> More frequent and severe extreme weather events</li>
        <li><strong>Oceans:</strong> Acidification and rising sea levels</li>
        <li><strong>Human Health:</strong> Heat-related illnesses and disease spread</li>
      </ul>
      
      <h2>Solutions and Adaptation</h2>
      <p>Addressing climate change requires both mitigation (reducing emissions) and adaptation (preparing for changes). Solutions include:</p>
      <ul>
        <li>Transitioning to renewable energy sources</li>
        <li>Improving energy efficiency</li>
        <li>Protecting and restoring forests</li>
        <li>Developing climate-resilient infrastructure</li>
      </ul>
      
      <h2>Global Cooperation</h2>
      <p>Climate change is a global challenge that requires international cooperation. Agreements like the Paris Climate Accord represent important steps toward coordinated action, though much work remains to be done to meet the goals of limiting global warming.</p>
    `,
    category: 'science',
    tags: ['climate', 'environment', 'science', 'global warming', 'sustainability'],
    author: 'Dr. Lisa Chen'
  }
];

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URI_ATLAS);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists, skipping user creation');
    } else {
      // Create admin user
      const adminUser = new User({
        username: process.env.ADMIN_USERNAME || 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@hiddenwiki.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        profile: {
          displayName: 'System Administrator',
          bio: 'System administrator for HiddenWiki'
        }
      });

      await adminUser.save();
      console.log('Admin user created successfully');
    }

    // Check if blog posts already exist
    const existingPosts = await BlogPost.countDocuments();
    if (existingPosts === 0) {
      // Create sample blog posts
      for (const postData of samplePosts) {
        const post = new BlogPost(postData);
        await post.save();
      }
      console.log(`${samplePosts.length} sample blog posts created successfully`);
    } else {
      console.log('Blog posts already exist, skipping creation');
    }

    // Create additional sample users (optional)
    const sampleUsers = [
      {
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
        role: 'user',
        profile: {
          displayName: 'Alice Johnson',
          bio: 'History enthusiast and researcher'
        }
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123',
        role: 'user',
        profile: {
          displayName: 'Bob Smith',
          bio: 'Technology consultant and developer'
        }
      },
      {
        username: 'carol',
        email: 'carol@example.com',
        password: 'password123',
        role: 'user',
        profile: {
          displayName: 'Carol Davis',
          bio: 'Science writer and educator'
        }
      }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`Sample user ${userData.username} created successfully`);
      }
    }

    console.log('Database initialization completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase(); 