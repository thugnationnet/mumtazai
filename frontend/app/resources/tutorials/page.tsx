'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { BookOpen, ArrowRight, Sparkles, Target, Lightbulb, MessageSquare, Layout, Code, Database } from 'lucide-react'
import { getAgentChatUrl } from '@/lib/agentUrl'

export default function TutorialsPage() {
  const [selectedAgent, setSelectedAgent] = useState('einstein')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current && window.innerWidth < 1024) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedAgent])

  const agents = [
    {
      id: 'einstein',
      name: 'Einstein',
      avatar: '🧠',
      description: 'Physics & Mathematics Expert',
      color: 'from-blue-500 to-cyan-500',
      tutorial: {
        features: ['Advanced physics calculations', 'Mathematical theorem explanation', 'Scientific research guidance', 'Problem-solving methodology'],
        specialties: ['Quantum mechanics', 'Relativity theory', 'Complex mathematics', 'Scientific reasoning'],
        howItWorks: 'Einstein specializes in providing in-depth explanations of complex physics and mathematics concepts. Ask questions about theories, equations, or scientific principles and receive expert-level insights.',
        useCases: ['Academic learning and tutoring', 'Research assistance', 'Homework help', 'Scientific concept clarification'],
        example: 'Ask: "Explain the theory of relativity" or "Help me solve this differential equation"'
      }
    },
    {
      id: 'comedy-king',
      name: 'Comedy King',
      avatar: '🎭',
      description: 'Humor & Entertainment',
      color: 'from-purple-500 to-pink-500',
      tutorial: {
        features: ['Joke generation and storytelling', 'Comedy timing and delivery', 'Humorous content creation', 'Entertainment recommendations'],
        specialties: ['Stand-up comedy style', 'Witty remarks and puns', 'Funny story creation', 'Comedy writing'],
        howItWorks: 'Comedy King brings humor and entertainment to conversations. Whether you need a laugh, want to learn about comedy, or need funny content, this agent delivers laughs and entertainment.',
        useCases: ['Entertainment and fun conversations', 'Joke writing and creation', 'Comedy content creation', 'Lighthearted discussions'],
        example: 'Ask: "Tell me a funny joke" or "Create a comedic story about..."'
      }
    },
    {
      id: 'tech-wizard',
      name: 'Tech Wizard',
      avatar: '💻',
      description: 'Technology & Programming',
      color: 'from-green-500 to-emerald-500',
      tutorial: {
        features: ['Code review and debugging', 'Programming language expertise', 'Technology recommendations', 'Development best practices'],
        specialties: ['Full-stack development', 'Cloud technologies', 'DevOps and deployment', 'Software architecture'],
        howItWorks: 'Tech Wizard is your go-to resource for all programming and technology questions. From debugging code to architectural decisions, get expert guidance on technology topics.',
        useCases: ['Code development assistance', 'Bug fixing and debugging', 'Technology selection', 'Development mentoring'],
        example: 'Ask: "How do I implement this feature?" or "Debug this code snippet"'
      }
    },
    {
      id: 'chef-biew',
      name: 'Chef Biew',
      avatar: '👨‍🍳',
      description: 'Cooking & Recipes',
      color: 'from-orange-500 to-red-500',
      tutorial: {
        features: ['Recipe suggestions and guidance', 'Cooking technique explanation', 'Ingredient substitutions', 'Nutritional information'],
        specialties: ['International cuisines', 'Dietary accommodations', 'Meal planning', 'Cooking methodology'],
        howItWorks: 'Chef Biew helps you explore culinary arts. Get recipes, cooking tips, dietary guidance, and learn about different cuisines from around the world.',
        useCases: ['Recipe discovery', 'Cooking instruction', 'Dietary meal planning', 'Culinary learning'],
        example: 'Ask: "What can I make with these ingredients?" or "Teach me how to make pasta from scratch"'
      }
    },
    {
      id: 'fitness-guru',
      name: 'Fitness Guru',
      avatar: '💪',
      description: 'Fitness & Health',
      color: 'from-red-500 to-rose-500',
      tutorial: {
        features: ['Workout planning and guidance', 'Exercise form and technique', 'Nutrition and diet advice', 'Health and wellness tips'],
        specialties: ['Strength training', 'Cardio fitness', 'Flexibility and mobility', 'Holistic health'],
        howItWorks: 'Fitness Guru provides personalized fitness and health guidance. Get workout plans, exercise instructions, nutritional advice, and motivation for your fitness journey.',
        useCases: ['Fitness training plans', 'Exercise instruction', 'Health coaching', 'Wellness motivation'],
        example: 'Ask: "Create a workout plan for me" or "How do I do proper form for squats?"'
      }
    },
    {
      id: 'travel-buddy',
      name: 'Travel Buddy',
      avatar: '✈️',
      description: 'Travel & Exploration',
      color: 'from-cyan-500 to-blue-500',
      tutorial: {
        features: ['Destination recommendations', 'Travel planning assistance', 'Cultural insights and tips', 'Itinerary creation'],
        specialties: ['World geography', 'Cultural experiences', 'Budget travel', 'Adventure planning'],
        howItWorks: 'Travel Buddy is your personal travel guide. Discover destinations, plan itineraries, learn about cultures, and get insider tips for amazing travel experiences.',
        useCases: ['Travel planning and research', 'Destination selection', 'Itinerary creation', 'Cultural learning'],
        example: 'Ask: "Plan a 5-day trip to Japan" or "What should I see in Barcelona?"'
      }
    },
    {
      id: 'professor-astrology',
      name: 'Professor Astrology',
      avatar: '🔭',
      description: 'Astrology & Zodiac',
      color: 'from-indigo-500 to-purple-500',
      tutorial: {
        features: ['Zodiac sign information', 'Birth chart analysis', 'Horoscope readings', 'Astrological guidance'],
        specialties: ['Personality traits by sign', 'Compatibility analysis', 'Planetary influences', 'Astrological timing'],
        howItWorks: 'Professor Astrology explores the fascinating world of astrology. Learn about zodiac signs, get horoscope readings, understand planetary influences, and discover astrological insights.',
        useCases: ['Zodiac learning', 'Compatibility checking', 'Horoscope readings', 'Astrological curiosity'],
        example: 'Ask: "What does my zodiac sign say about me?" or "Are we compatible?"'
      }
    },
    {
      id: 'julie-girlfriend',
      name: 'Julie Girlfriend',
      avatar: '💕',
      description: 'Relationship Advice',
      color: 'from-pink-500 to-rose-500',
      tutorial: {
        features: ['Relationship guidance', 'Communication advice', 'Emotional support', 'Dating tips'],
        specialties: ['Relationship dynamics', 'Communication techniques', 'Emotional intelligence', 'Conflict resolution'],
        howItWorks: 'Julie Girlfriend provides thoughtful relationship advice and support. Get guidance on communication, dating, relationships, and emotional connection.',
        useCases: ['Relationship advice', 'Dating guidance', 'Communication help', 'Emotional support'],
        example: 'Ask: "How do I improve my relationship?" or "What should I do about this situation?"'
      }
    },
    {
      id: 'emma-emotional',
      name: 'Emma Emotional',
      avatar: '🤗',
      description: 'Emotional Support',
      color: 'from-yellow-500 to-orange-500',
      tutorial: {
        features: ['Emotional listening and support', 'Stress management techniques', 'Coping strategies', 'Mental wellness guidance'],
        specialties: ['Empathetic conversation', 'Anxiety management', 'Self-care routines', 'Emotional wellness'],
        howItWorks: 'Emma Emotional provides compassionate emotional support. Talk through your feelings, get coping strategies, and receive guidance on emotional wellness.',
        useCases: ['Emotional support and listening', 'Stress and anxiety management', 'Self-care guidance', 'Wellness coaching'],
        example: "Ask: \"I'm feeling overwhelmed, can you help?\" or \"What are some self-care tips?\""
      }
    },
    {
      id: 'mrs-boss',
      name: 'Mrs Boss',
      avatar: '📊',
      description: 'Business & Management',
      color: 'from-emerald-500 to-teal-500',
      tutorial: {
        features: ['Business strategy advice', 'Management techniques', 'Leadership guidance', 'Decision-making frameworks'],
        specialties: ['Strategic planning', 'Team management', 'Business growth', 'Executive decision-making'],
        howItWorks: 'Mrs Boss provides expert business and management guidance. Get strategic advice, leadership coaching, and business insights from an experienced perspective.',
        useCases: ['Business planning', 'Management coaching', 'Strategic decision-making', 'Leadership guidance'],
        example: "Ask: \"How do I scale my business?\" or \"What's the best approach for team management?\""
      }
    },
    {
      id: 'bishop-burger',
      name: 'Bishop Burger',
      avatar: '🍔',
      description: 'Food & Cuisine',
      color: 'from-amber-500 to-yellow-500',
      tutorial: {
        features: ['Food recommendations', 'Restaurant suggestions', 'Food pairing advice', 'Culinary discussions'],
        specialties: ['Cuisine varieties', 'Food culture', 'Flavor combinations', 'Dining experiences'],
        howItWorks: 'Bishop Burger explores the world of food and cuisine. Get restaurant recommendations, food pairing suggestions, and discuss culinary preferences.',
        useCases: ['Food discovery', 'Restaurant recommendations', 'Dining planning', 'Culinary discussions'],
        example: 'Ask: "Recommend a good restaurant" or "What should I eat today?"'
      }
    },
    {
      id: 'ben-sega',
      name: 'Ben Sega',
      avatar: '🎮',
      description: 'Gaming & Retro',
      color: 'from-violet-500 to-purple-500',
      tutorial: {
        features: ['Gaming recommendations', 'Retro game nostalgia', 'Game strategies and tips', 'Gaming community insights'],
        specialties: ['Classic and retro games', 'Modern gaming trends', 'Game design', 'Gaming culture'],
        howItWorks: 'Ben Sega is your gaming companion. Get game recommendations, retro gaming insights, strategies, and dive into gaming culture and history.',
        useCases: ['Game recommendations', 'Gaming strategy help', 'Retro gaming nostalgia', 'Gaming discussions'],
        example: 'Ask: "Recommend a good game for me" or "Tell me about classic Sega games"'
      }
    },
    {
      id: 'rook-jokey',
      name: 'Rook Jokey',
      avatar: '🃏',
      description: 'Humor & Jokes',
      color: 'from-teal-500 to-green-500',
      tutorial: {
        features: ['Joke telling and humor', 'Funny observations', 'Entertainment value', 'Playful commentary'],
        specialties: ['Classic jokes', 'Wordplay and puns', 'Funny situations', 'Comedic timing'],
        howItWorks: 'Rook Jokey brings fun and laughter. Exchange jokes, enjoy humorous conversations, and lighten your mood with entertaining content.',
        useCases: ['Entertainment and fun', 'Joke exchange', 'Humor appreciation', 'Lighthearted chat'],
        example: 'Ask: "Tell me something funny" or "Make me laugh"'
      }
    },
    {
      id: 'nid-gaming',
      name: 'Nid Gaming',
      avatar: '🎮',
      description: 'Modern Gaming & Esports',
      color: 'from-green-500 to-teal-500',
      tutorial: {
        features: ['Current game tips and strategies', 'Esports news and insights', 'Gaming hardware advice', 'Build recommendations'],
        specialties: ['Video Games', 'Esports', 'Gaming Hardware', 'Game Strategy'],
        howItWorks: 'Nid Gaming is your expert guide to modern gaming. Get tips, strategies, hardware recommendations, and stay updated on the latest esports news and competitive gaming scene.',
        useCases: ['Game strategy improvement', 'Esports updates', 'Gaming hardware selection', 'Build optimization'],
        example: 'Ask: "What\'s the best gaming setup for 2024?" or "How do I improve at competitive gaming?"'
      }
    },
    {
      id: 'drama-queen',
      name: 'Drama Queen',
      avatar: '👑',
      description: 'Theatre & Performing Arts',
      color: 'from-pink-500 to-fuchsia-500',
      tutorial: {
        features: ['Acting techniques and tips', 'Theatre history and classics', 'Performance coaching', 'Script analysis and writing'],
        specialties: ['Theatre', 'Acting', 'Playwriting', 'Performance Arts'],
        howItWorks: 'Drama Queen brings theatrical passion to every conversation. Learn about acting techniques, explore theatre history from Shakespeare to Broadway, and get guidance on performance and creative writing.',
        useCases: ['Acting skill development', 'Theatre education', 'Script writing help', 'Performance preparation'],
        example: 'Ask: "How do I deliver a powerful monologue?" or "Tell me about Shakespeare\'s influence"'
      }
    },
    {
      id: 'chess-player',
      name: 'Chess Master',
      avatar: '♟️',
      description: 'Chess Strategy & Analysis',
      color: 'from-slate-600 to-slate-800',
      tutorial: {
        features: ['Opening repertoire guidance', 'Middlegame strategies', 'Endgame techniques', 'Position analysis'],
        specialties: ['Chess Strategy', 'Tactical Patterns', 'Opening Theory', 'Game Analysis'],
        howItWorks: 'Chess Master is your expert teacher for the royal game. Get strategic insights, learn tactical patterns, analyze positions, and improve your chess at any skill level.',
        useCases: ['Chess improvement training', 'Opening preparation', 'Game analysis', 'Learning from grandmasters'],
        example: 'Ask: "What\'s the best opening for beginners?" or "Analyze this chess position"'
      }
    },
    {
      id: 'knight-logic',
      name: 'Knight Logic',
      avatar: '⚔️',
      description: 'Logic & Problem Solving',
      color: 'from-amber-500 to-orange-600',
      tutorial: {
        features: ['Logic puzzle solving', 'Critical thinking development', 'Strategic reasoning', 'Brain teasers and riddles'],
        specialties: ['Logic Puzzles', 'Strategic Thinking', 'Problem Solving', 'Critical Analysis'],
        howItWorks: 'Knight Logic sharpens your mind with logical challenges. Get help solving puzzles, develop critical thinking skills, and tackle complex problems with systematic approaches.',
        useCases: ['Logic puzzle practice', 'Critical thinking training', 'Problem-solving skills', 'Brain exercise'],
        example: 'Ask: "Give me a logic puzzle" or "How do I approach complex problems?"'
      }
    },
    {
      id: 'lazy-pawn',
      name: 'Lazy Pawn',
      avatar: '🐢',
      description: 'Relaxed Chill Companion',
      color: 'from-emerald-400 to-teal-500',
      tutorial: {
        features: ['Relaxed conversations', 'Stress-free advice', 'Laid-back perspective', 'Low-pressure interaction'],
        specialties: ['Relaxation', 'Stress Relief', 'Casual Chat', 'Life Advice'],
        howItWorks: 'Lazy Pawn is your chill companion for relaxed conversations. No rush, no pressure - just easygoing chat and a laid-back perspective on life\'s challenges.',
        useCases: ['Stress relief', 'Casual conversation', 'Relaxed advice', 'Chill vibes'],
        example: 'Ask: "Just want to chat about nothing" or "Help me chill out"'
      }
    }
  ]

  const selectedAgentData = agents.find(a => a.id === selectedAgent) || agents[0]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-14 md:py-20 overflow-hidden rounded-b-[2rem] themed-section-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-white/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-purple-100/20 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" style={{ transform: 'skewY(-2deg)' }} />
        <div className="container-custom text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Agent Tutorials</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Learn how to use each agent and discover their unique capabilities
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">

        {/* Quick Stats */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-lg">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/40 rounded-xl border border-white/50">
                <div className="text-2xl font-bold text-purple-700">18</div>
                <div className="text-xs text-slate-500">AI Agents</div>
              </div>
              <div className="text-center p-4 bg-white/40 rounded-xl border border-white/50">
                <div className="text-2xl font-bold text-indigo-600">Pro</div>
                <div className="text-xs text-slate-500">Quality</div>
              </div>
              <div className="text-center p-4 bg-white/40 rounded-xl border border-white/50">
                <div className="text-2xl font-bold text-green-600">24/7</div>
                <div className="text-xs text-slate-500">Available</div>
              </div>
              <div className="text-center p-4 bg-white/40 rounded-xl border border-white/50">
                <div className="text-2xl font-bold text-purple-600">∞</div>
                <div className="text-xs text-slate-500">Possibilities</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Agent List Sidebar */}
          <div className="w-full lg:w-72 bg-white/40 backdrop-blur-lg rounded-2xl p-4 border border-white/60 shadow-lg flex-shrink-0">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Select an Agent</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition text-sm flex items-center gap-3 ${
                    selectedAgent === agent.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-slate-600 hover:bg-white/40 border border-transparent hover:border-white/60'
                  }`}
                >
                  <span className="text-xl">{agent.avatar}</span>
                  <span className="font-medium text-xs sm:text-sm">{agent.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tutorial Content */}
          <div ref={contentRef} className="flex-1 bg-white/40 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/60 shadow-lg scroll-mt-4">
            {/* Agent Header */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/80">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedAgentData.color} flex items-center justify-center`}>
                <span className="text-3xl">{selectedAgentData.avatar}</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-700">{selectedAgentData.name}</h2>
                <p className="text-slate-500">{selectedAgentData.description}</p>
              </div>
            </div>

            {/* How It Works */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-purple-700" />
                <h3 className="text-xl font-bold text-slate-700">How It Works</h3>
              </div>
              <p className="text-slate-500 leading-relaxed bg-white/30 p-4 rounded-xl border border-white/50">
                {selectedAgentData.tutorial.howItWorks}
              </p>
            </div>

            {/* Features */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-700" />
                <h3 className="text-xl font-bold text-slate-700">Key Features</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedAgentData.tutorial.features.map((feature, idx) => (
                  <div key={idx} className="bg-white/30 p-4 rounded-xl border border-white/50 flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <p className="text-slate-600">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-700" />
                <h3 className="text-xl font-bold text-slate-700">Specialties</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedAgentData.tutorial.specialties.map((specialty, idx) => (
                  <span key={idx} className={`px-4 py-2 rounded-full bg-gradient-to-r ${selectedAgentData.color} text-white text-sm font-medium`}>
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Use Cases */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-700" />
                <h3 className="text-xl font-bold text-slate-700">Use Cases</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedAgentData.tutorial.useCases.map((useCase, idx) => (
                  <div key={idx} className="bg-white/30 p-4 rounded-xl border border-white/50 flex items-start gap-3">
                    <ArrowRight className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-600">{useCase}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Example */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-purple-700" />
                <h3 className="text-xl font-bold text-slate-700">Try It Out</h3>
              </div>
              <div className="bg-slate-800 text-white p-4 rounded-xl">
                <p className="italic">{selectedAgentData.tutorial.example}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-6 border-t border-white/80">
              <Link
                href={getAgentChatUrl(selectedAgentData.id)}
                className={`inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r ${selectedAgentData.color} text-white rounded-xl font-semibold hover:opacity-90 transition shadow-lg`}
              >
                Start Using {selectedAgentData.name}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Canvas Builder Section */}
        <div className="max-w-6xl mx-auto mt-16 mb-12">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 themed-section-bg">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/20 rounded-full blur-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                  <Layout className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Canvas Builder</h2>
                  <p className="text-slate-500">AI-Powered App Generator — 201 tools • 8 AI models</p>
                </div>
              </div>
              <p className="text-lg text-slate-500 mb-8 max-w-2xl">
                Describe what you want to build in plain text and Canvas generates a fully functional web application — HTML, CSS, JavaScript, and React — in seconds. Includes live preview, version history, and one-click deploy.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                  <Code className="w-8 h-8 text-purple-700 mb-3" />
                  <h3 className="font-bold text-slate-800 mb-2">Text-to-App</h3>
                  <p className="text-sm text-slate-500">Describe your app in natural language and get working code instantly</p>
                </div>
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                  <Sparkles className="w-8 h-8 text-indigo-600 mb-3" />
                  <h3 className="font-bold text-slate-800 mb-2">Live Preview</h3>
                  <p className="text-sm text-slate-500">See your app running in real-time — desktop, tablet & mobile views</p>
                </div>
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                  <Target className="w-8 h-8 text-green-600 mb-3" />
                  <h3 className="font-bold text-slate-800 mb-2">One-Click Deploy</h3>
                  <p className="text-sm text-slate-500">Publish to a live URL or download clean production-ready code</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-3">What You Can Build</h3>
                <div className="flex flex-wrap gap-2 mb-8">
                  {['Landing Pages', 'Dashboards', 'Portfolios', 'E-commerce', 'Games', 'Calculators', 'Data Viz', 'Interactive Forms', 'Chat UIs', 'Animations'].map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/40 text-slate-700 rounded-full text-sm border border-white/60">{item}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="https://build.mumtaz.ai" className="btn-primary bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:opacity-90">
                  Try Canvas Builder
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </Link>
                <Link href="/docs/canvas" className="btn-secondary text-white border-white/20 hover:bg-slate-200">
                  Canvas Documentation
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Studio IDE Section */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 themed-section-bg">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-200/20 rounded-full blur-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Code className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Canvas Studio IDE</h2>
                  <p className="text-slate-500">Full Online Development Environment — 17 templates • 6 preview modes</p>
                </div>
              </div>
              <p className="text-lg text-slate-500 mb-8 max-w-2xl">
                Unlike the single-prompt Canvas Builder, Canvas Studio gives you a complete development environment with a multi-file code editor, file tree, sandbox runner, live preview, voice input, and 17 starter templates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                  <h3 className="font-bold text-slate-800 mb-2">🗂️ File Tree</h3>
                  <p className="text-sm text-slate-500">Create, rename, delete and organize files &amp; folders like VS Code</p>
                </div>
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                  <h3 className="font-bold text-slate-800 mb-2">✏️ Code Editor</h3>
                  <p className="text-sm text-slate-500">Multi-language syntax highlighting for 10+ languages</p>
                </div>
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                  <h3 className="font-bold text-slate-800 mb-2">▶️ Sandbox Runner</h3>
                  <p className="text-sm text-slate-500">Execute code in a secure sandbox with console output</p>
                </div>
                <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                  <h3 className="font-bold text-slate-800 mb-2">🎙️ Voice Input</h3>
                  <p className="text-sm text-slate-500">Speak instructions and let AI generate code for you</p>
                </div>
              </div>
              <div className="mb-8">
                <h3 className="font-bold text-slate-800 mb-3">17 Starter Templates</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { cat: 'HTML & Web', items: ['Blank HTML', 'Landing Page', 'Portfolio', 'Blog'], color: 'bg-blue-500/20 border-blue-500/30' },
                    { cat: 'React', items: ['React App', 'Dashboard', 'E-commerce', 'Tailwind'], color: 'bg-cyan-500/20 border-cyan-500/30' },
                    { cat: 'Backend', items: ['Node.js API', 'Express', 'Python Flask', 'REST API'], color: 'bg-green-500/20 border-green-500/30' },
                    { cat: 'Advanced', items: ['Three.js 3D', 'Game Engine', 'Data Viz', 'Vue.js', 'Full-Stack'], color: 'bg-violet-500/20 border-violet-500/30' },
                  ].map((group, idx) => (
                    <div key={idx} className={`rounded-xl p-4 border bg-white/30 ${group.color}`}>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{group.cat}</p>
                      <ul className="space-y-1">
                        {group.items.map((item, i) => (
                          <li key={i} className="text-sm text-slate-600">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-8 bg-white/40 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-3">Canvas Builder vs Canvas Studio</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-slate-500">Feature</div><div className="text-center text-purple-700 font-semibold">Builder</div><div className="text-center text-violet-700 font-semibold">Studio</div>
                  {[
                    ['Single-prompt generation', '✅', '✅'],
                    ['Multi-file projects', '—', '✅'],
                    ['File tree & editor', '—', '✅'],
                    ['Sandbox code runner', '—', '✅'],
                    ['17 starter templates', '—', '✅'],
                    ['Voice input', '—', '✅'],
                    ['Live preview', '✅', '✅ (6 modes)'],
                    ['One-click deploy', '✅', '✅'],
                  ].map(([feat, builder, studio], idx) => (
                    <>{/* eslint-disable-next-line react/jsx-key */}
                      <div className="text-slate-600 border-t border-white/50 pt-2">{feat}</div>
                      <div className="text-center border-t border-white/50 pt-2">{builder}</div>
                      <div className="text-center border-t border-white/50 pt-2">{studio}</div>
                    </>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="https://studio.mumtaz.ai" className="btn-primary bg-gradient-to-r from-violet-500 to-purple-500 hover:opacity-90">
                  Open Canvas Studio
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </Link>
                <Link href="/docs/canvas-studio" className="btn-secondary text-white border-white/20 hover:bg-slate-200">
                  Studio Documentation
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Data Generator Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="bg-white/40 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/60 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Database className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-700">AI Data Generator</h2>
                  <p className="text-slate-400">Generate Test Data in Seconds</p>
                </div>
              </div>
              <p className="text-lg text-slate-500 mb-8 max-w-2xl">
                Need realistic test data? Our AI Data Generator creates users, products, posts, analytics, 
                and more with intelligent context-aware generation.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {['Users', 'Products', 'Posts', 'Analytics', 'Comments', 'Emails'].map((type, idx) => (
                  <div key={idx} className="bg-white/30 rounded-xl p-4 text-center border border-white/50 hover:border-purple-200 transition">
                    <div className="text-2xl mb-2">
                      {type === 'Users' ? '👤' : type === 'Products' ? '📦' : type === 'Posts' ? '📝' : type === 'Analytics' ? '📊' : type === 'Comments' ? '💬' : '✉️'}
                    </div>
                    <p className="text-sm font-medium text-slate-600">{type}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/tools/data-generator" className="btn-primary bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white">
                  Try Data Generator
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </Link>
                <Link href="/docs/data-generator" className="btn-secondary">
                  View Documentation
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center themed-section-bg">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-slate-800 via-purple-800 to-indigo-700 bg-clip-text text-transparent">Ready to Get Started?</h2>
              <p className="text-lg text-slate-600 mb-8">
                Explore all our AI agents and find the perfect companion for your needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="https://mumtaz.ai/agents" className="btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25">
                  Browse All Agents
                </Link>
                <Link href="/overview/pricing" className="btn-primary bg-white/60 hover:bg-white/80 text-slate-800 border border-white/60">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
