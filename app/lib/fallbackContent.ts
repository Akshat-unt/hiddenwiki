// Fallback content for when Wikipedia API is unavailable
// This provides basic information about common historical topics

export interface FallbackArticle {
  title: string;
  extract: string;
  content: string;
  category: string;
}

export const fallbackArticles: Record<string, FallbackArticle> = {
  'Mahatma Gandhi': {
    title: 'Mahatma Gandhi',
    extract: 'Mohandas Karamchand Gandhi, also known as Mahatma Gandhi, was an Indian lawyer, anti-colonial nationalist and political ethicist who employed nonviolent resistance to lead the successful campaign for India\'s independence from British rule.',
    content: `<h2>Early Life</h2>
<p>Mohandas Karamchand Gandhi was born on 2 October 1869 in Porbandar, Gujarat, India. He came from a merchant family and was the youngest child of his parents.</p>

<h2>Education and Early Career</h2>
<p>Gandhi studied law at University College London and became a barrister. He first worked as a lawyer in India before moving to South Africa in 1893.</p>

<h2>South Africa Period</h2>
<p>In South Africa, Gandhi developed his political views and tactics of nonviolent resistance while fighting discrimination against Indians.</p>

<h2>Return to India</h2>
<p>Gandhi returned to India in 1915 and became the leader of the Indian independence movement. He organized numerous campaigns of civil disobedience against British rule.</p>

<h2>Independence and Partition</h2>
<p>Gandhi played a key role in India's independence in 1947, though he was deeply saddened by the partition of India and Pakistan.</p>

<h2>Legacy</h2>
<p>Gandhi's philosophy of nonviolent resistance influenced civil rights movements worldwide. He was assassinated on 30 January 1948 in New Delhi.</p>`,
    category: 'Biography'
  },

  'Mughal Empire': {
    title: 'Mughal Empire',
    extract: 'The Mughal Empire was an early-modern empire that controlled much of the Indian subcontinent between the 16th and 18th centuries. Founded by Babur in 1526, it was one of the largest and most powerful empires in Indian history.',
    content: `<h2>Foundation</h2>
<p>The Mughal Empire was founded by Babur, a descendant of Timur and Genghis Khan, after his victory at the Battle of Panipat in 1526.</p>

<h2>Great Mughal Emperors</h2>
<p>The empire reached its zenith under emperors like Akbar the Great (1556-1605), Jahangir (1605-1627), Shah Jahan (1628-1658), and Aurangzeb (1658-1707).</p>

<h2>Administration</h2>
<p>The Mughals established a sophisticated administrative system with a centralized government and efficient revenue collection.</p>

<h2>Culture and Architecture</h2>
<p>The Mughal period saw a flowering of Indo-Islamic art and architecture, including iconic monuments like the Taj Mahal, Red Fort, and Fatehpur Sikri.</p>

<h2>Decline</h2>
<p>The empire began to decline after Aurangzeb's death in 1707, eventually becoming a British protectorate and ending in 1857.</p>`,
    category: 'Empire'
  },

  'Ancient India': {
    title: 'Ancient India',
    extract: 'Ancient India refers to the Indian subcontinent from prehistoric times to the beginning of medieval India in the 8th century CE. This period includes the Indus Valley Civilization, Vedic period, and various ancient kingdoms.',
    content: `<h2>Indus Valley Civilization</h2>
<p>The Indus Valley Civilization (3300-1300 BCE) was one of the world's earliest urban civilizations, known for its advanced city planning and drainage systems.</p>

<h2>Vedic Period</h2>
<p>The Vedic period (1500-500 BCE) saw the composition of the Vedas, the oldest Hindu scriptures, and the establishment of the caste system.</p>

<h2>Mauryan Empire</h2>
<p>The Mauryan Empire (322-185 BCE) was the first empire to unify most of the Indian subcontinent under Chandragupta Maurya and later Ashoka the Great.</p>

<h2>Gupta Empire</h2>
<p>The Gupta Empire (320-550 CE) is considered the Golden Age of India, marked by achievements in science, mathematics, astronomy, religion, and philosophy.</p>

<h2>Achievements</h2>
<p>Ancient India made significant contributions to mathematics (concept of zero), astronomy, medicine (Ayurveda), literature, and philosophy.</p>`,
    category: 'Ancient History'
  },

  'British Raj': {
    title: 'British Raj',
    extract: 'The British Raj was the rule by the British Crown on the Indian subcontinent from 1858 to 1947. It included present-day India, Pakistan, Bangladesh, and Myanmar.',
    content: `<h2>Establishment</h2>
<p>The British Raj was established in 1858 after the Indian Rebellion of 1857, replacing the rule of the East India Company.</p>

<h2>Administration</h2>
<p>The Raj was governed by a Viceroy representing the British Crown, with the capital initially in Calcutta and later moved to New Delhi in 1911.</p>

<h2>Economic Impact</h2>
<p>British rule transformed India's economy, building railways and telegraph systems but also extracting vast wealth from the subcontinent.</p>

<h2>Independence Movement</h2>
<p>The Indian independence movement gained momentum in the 20th century under leaders like Mahatma Gandhi, Jawaharlal Nehru, and Subhas Chandra Bose.</p>

<h2>Partition and Independence</h2>
<p>The British Raj ended on 15 August 1947 with the partition of India into two independent nations: India and Pakistan.</p>`,
    category: 'Colonial History'
  },

  'Indian Independence': {
    title: 'Indian Independence Movement',
    extract: 'The Indian independence movement was a series of historic events with the ultimate aim of ending British rule in India. It lasted from 1857 to 1947 and involved various forms of resistance.',
    content: `<h2>Early Resistance</h2>
<p>The movement began with the Indian Rebellion of 1857, also known as the First War of Independence, though it was ultimately unsuccessful.</p>

<h2>Formation of Congress</h2>
<p>The Indian National Congress was founded in 1885, becoming the principal organization leading the independence movement.</p>

<h2>Gandhian Era</h2>
<p>Mahatma Gandhi's arrival in 1915 transformed the movement with his philosophy of non-violent resistance (Satyagraha).</p>

<h2>Major Movements</h2>
<p>Key movements included the Non-Cooperation Movement (1920-22), Salt March (1930), and Quit India Movement (1942).</p>

<h2>Independence and Partition</h2>
<p>India gained independence on August 15, 1947, but was partitioned into India and Pakistan, leading to massive displacement and communal violence.</p>`,
    category: 'Independence Movement'
  }
};

export const getFallbackArticle = (title: string): FallbackArticle | null => {
  // Try exact match first
  if (fallbackArticles[title]) {
    return fallbackArticles[title];
  }
  
  // Try case-insensitive match
  const lowerTitle = title.toLowerCase();
  for (const [key, article] of Object.entries(fallbackArticles)) {
    if (key.toLowerCase() === lowerTitle) {
      return article;
    }
  }
  
  // Try partial match
  for (const [key, article] of Object.entries(fallbackArticles)) {
    if (key.toLowerCase().includes(lowerTitle) || lowerTitle.includes(key.toLowerCase())) {
      return article;
    }
  }
  
  return null;
};

export const getFallbackSearchResults = (query: string): Array<{title: string, snippet: string, pageid: number, size: number, wordcount: number, timestamp: string}> => {
  const results = [];
  const lowerQuery = query.toLowerCase();
  
  for (const [title, article] of Object.entries(fallbackArticles)) {
    if (title.toLowerCase().includes(lowerQuery) || 
        article.extract.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery)) {
      results.push({
        title,
        snippet: article.extract,
        pageid: Math.floor(Math.random() * 1000000),
        size: article.content.length,
        wordcount: article.content.split(' ').length,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return results;
};
