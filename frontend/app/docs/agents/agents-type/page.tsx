'use client';

import Link from 'next/link';
import { ArrowLeft, Brain, Zap } from 'lucide-react';

export default function AgentTypesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Available Agent Types</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Explore the diverse range of specialized agents available on One Last AI.
          </p>
        </div>
      </section>

      <div className="container-custom section-padding">
        {/* Back Button */}
        <Link href="/docs/agents" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-brand-100 rounded-xl p-2"><Brain className="w-6 h-6 text-brand-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Agent Specialization</h2>
            </div>
            <p className="text-neural-600">
              Each agent on One Last AI is trained and optimized for specific domains and tasks. This specialization allows them to provide 
              expert-level insights and guidance in their respective fields. You can use agents individually or combine multiple agents 
              for complex, multi-faceted projects.
            </p>
          </section>

          {/* Einstein */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 rounded-xl p-2"><Zap className="w-6 h-6 text-purple-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Einstein</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-purple-600 font-semibold mb-2">Specialty: Scientific Research & Analysis</p>
                <p className="text-neural-600">
                  Einstein is your expert companion for all things scientific. With deep knowledge across physics, chemistry, biology, 
                  and mathematics, Einstein excels at explaining complex scientific concepts, solving research problems, and providing 
                  up-to-date scientific insights.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Best For:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Understanding scientific concepts and theories</li>
                  <li>Research assistance and literature analysis</li>
                  <li>Mathematical problem-solving and explanations</li>
                  <li>Science homework and educational inquiries</li>
                  <li>Explaining cutting-edge scientific discoveries</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Configuration Tips:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Set citation mode to "Full Citations" for research work</li>
                  <li>Choose your area of focus (Physics, Chemistry, Biology, etc.)</li>
                  <li>Use "Technical" tone for precise scientific language</li>
                  <li>Request detailed responses for complex topics</li>
                </ul>
              </div>

              <p className="text-neural-600 text-sm">
                <strong>Example:</strong> "Explain quantum superposition and how it differs from classical physics. Include recent experimental evidence."
              </p>
            </div>
          </section>

          {/* Tech Wizard */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-xl p-2"><Zap className="w-6 h-6 text-blue-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Tech Wizard</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-blue-600 font-semibold mb-2">Specialty: Technology & Software Development</p>
                <p className="text-neural-600">
                  Tech Wizard is your go-to expert for all programming and technology needs. From debugging code to architecting systems, 
                  learning new frameworks to understanding cloud infrastructure, Tech Wizard provides practical, hands-on guidance.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Best For:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Programming assistance in any language</li>
                  <li>Debugging and troubleshooting code</li>
                  <li>Learning new frameworks and libraries</li>
                  <li>System architecture and design patterns</li>
                  <li>DevOps, cloud infrastructure, and deployment</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Configuration Tips:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Set programming language preference (Python, JavaScript, Java, etc.)</li>
                  <li>Specify framework focus (React, Django, Spring, etc.)</li>
                  <li>Request code examples in responses</li>
                  <li>Use "Technical" tone for precision</li>
                  <li>Enable output format for "Code Format" when requesting solutions</li>
                </ul>
              </div>

              <p className="text-neural-600 text-sm">
                <strong>Example:</strong> "I have an infinite loop in my React component. Here's the code: [paste code]. What's the issue and how do I fix it?"
              </p>
            </div>
          </section>

          {/* Travel Buddy */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 rounded-xl p-2"><Zap className="w-6 h-6 text-green-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Travel Buddy</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-green-600 font-semibold mb-2">Specialty: Travel Planning & Recommendations</p>
                <p className="text-neural-600">
                  Travel Buddy is your companion for all travel-related questions. Whether you're planning a weekend getaway or an around-the-world 
                  adventure, Travel Buddy helps you discover destinations, plan itineraries, find activities, and travel smarter.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Best For:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Destination recommendations and research</li>
                  <li>Itinerary planning and scheduling</li>
                  <li>Local attractions, restaurants, and activities</li>
                  <li>Travel tips and budgeting advice</li>
                  <li>Cultural information and travel logistics</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Configuration Tips:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Set budget range for travel recommendations</li>
                  <li>Specify travel style (Adventure, Luxury, Budget, Cultural, etc.)</li>
                  <li>Indicate travel duration and dates</li>
                  <li>Set climate preferences</li>
                  <li>Use detailed responses for comprehensive itineraries</li>
                </ul>
              </div>

              <p className="text-neural-600 text-sm">
                <strong>Example:</strong> "I have 10 days in September, $3000 budget, and love hiking. Where should I go and what should I do?"
              </p>
            </div>
          </section>

          {/* Chef Biew */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 rounded-xl p-2"><Zap className="w-6 h-6 text-orange-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Chef Biew</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-orange-600 font-semibold mb-2">Specialty: Culinary Arts & Cooking</p>
                <p className="text-neural-600">
                  Chef Biew is your culinary expert, ready to assist with recipes, cooking techniques, meal planning, and dietary guidance. 
                  From quick weeknight dinners to elaborate party menus, Chef Biew can help you create delicious meals.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Best For:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Recipe suggestions and creation</li>
                  <li>Cooking technique explanations</li>
                  <li>Meal planning and nutrition guidance</li>
                  <li>Dietary restriction accommodations</li>
                  <li>Food pairing and menu composition</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Configuration Tips:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Set dietary restrictions (vegetarian, vegan, gluten-free, etc.)</li>
                  <li>Specify cuisine preferences</li>
                  <li>Indicate cooking skill level</li>
                  <li>List available cooking equipment</li>
                  <li>Set serving size for recipes</li>
                </ul>
              </div>

              <p className="text-neural-600 text-sm">
                <strong>Example:</strong> "Give me a vegetarian recipe for 4 people, takes less than 30 minutes, and uses no dairy. I have a stovetop and oven."
              </p>
            </div>
          </section>

          {/* Fitness Guru */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 rounded-xl p-2"><Zap className="w-6 h-6 text-red-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Fitness Guru</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-red-600 font-semibold mb-2">Specialty: Health, Fitness & Wellness</p>
                <p className="text-neural-600">
                  Fitness Guru is your health and fitness expert, providing personalized workout guidance, nutrition advice, and wellness coaching. 
                  Whether you're starting a fitness journey or optimizing training, Fitness Guru supports your goals.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Best For:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Workout routines and exercise guidance</li>
                  <li>Nutrition and meal planning advice</li>
                  <li>Training program design</li>
                  <li>Fitness goal setting and tracking</li>
                  <li>Injury prevention and recovery</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Configuration Tips:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Set fitness goals (weight loss, muscle gain, endurance, etc.)</li>
                  <li>Specify current fitness level (beginner, intermediate, advanced)</li>
                  <li>List available equipment at your location</li>
                  <li>Indicate physical limitations or injuries</li>
                  <li>Set dietary preferences and restrictions</li>
                </ul>
              </div>

              <p className="text-neural-600 text-sm">
                <strong>Example:</strong> "I want to build muscle over the next 3 months. I'm intermediate level, have dumbbells at home, and follow a high-protein diet. What routine should I do?"
              </p>
            </div>
          </section>

          {/* Ben Sega */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-pink-100 rounded-xl p-2"><Zap className="w-6 h-6 text-pink-600" /></div>
              <h2 className="text-2xl font-bold text-neural-900">Ben Sega</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-pink-600 font-semibold mb-2">Specialty: Gaming & Entertainment</p>
                <p className="text-neural-600">
                  Ben Sega is your entertainment and gaming expert, with deep knowledge of video games, esports, gaming strategy, 
                  and entertainment industry trends. Get gaming advice, entertainment recommendations, and cultural insights.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Best For:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Game recommendations and reviews</li>
                  <li>Gaming strategies and tips</li>
                  <li>Esports insights and industry news</li>
                  <li>Entertainment recommendations</li>
                  <li>Pop culture and gaming trends analysis</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-neural-800 font-semibold mb-3">Configuration Tips:</p>
                <ul className="list-disc list-inside text-neural-600 space-y-1 ml-2">
                  <li>Specify gaming platforms (PC, Console, Mobile)</li>
                  <li>Indicate game genre preferences</li>
                  <li>Set your gaming skill level</li>
                  <li>Use casual tone for entertainment discussions</li>
                  <li>Request detailed recommendations</li>
                </ul>
              </div>

              <p className="text-neural-600 text-sm">
                <strong>Example:</strong> "I love strategy RPGs and have 50+ hours free. What's the best game I should play on PC right now?"
              </p>
            </div>
          </section>

          {/* Choosing the Right Agent */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Choosing the Right Agent</h2>

            <div className="space-y-4 text-neural-600">
              <p>
                <strong>Quick Selection Guide:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Science & Research?</strong> Choose Einstein</li>
                <li><strong>Programming & Tech?</strong> Choose Tech Wizard</li>
                <li><strong>Travel Planning?</strong> Choose Travel Buddy</li>
                <li><strong>Cooking & Food?</strong> Choose Chef Biew</li>
                <li><strong>Fitness & Health?</strong> Choose Fitness Guru</li>
                <li><strong>Gaming & Entertainment?</strong> Choose Ben Sega</li>
              </ul>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                <p className="text-green-700 font-semibold mb-2">💡 Pro Tip:</p>
                <p className="text-neural-600 text-sm">
                  Don't limit yourself to one agent! Use multiple agents for different aspects of complex projects. 
                  For example, ask Tech Wizard about coding, then Einstein about the math, then Fitness Guru about app requirements.
                </p>
              </div>
            </div>
          </section>

          {/* Agent Evolution */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-neural-100">
            <h2 className="text-2xl font-bold text-neural-900 mb-6">Future Agents Coming Soon</h2>
            <p className="text-neural-600 mb-4">
              One Last AI continuously develops new specialized agents to expand our platform. Future agents under development include:
            </p>
            <ul className="list-disc list-inside text-neural-600 space-y-2 ml-2">
              <li>Business Strategy & Consulting Expert</li>
              <li>Legal & Compliance Advisor</li>
              <li>Marketing & Growth Specialist</li>
              <li>Creative Writing & Story Development Agent</li>
              <li>Financial Planning & Investment Advisor</li>
              <li>Language Learning & Translation Expert</li>
            </ul>
            <p className="text-neural-600 mt-4 text-sm">
              Subscribe to our newsletter to stay updated about new agents and platform features.
            </p>
          </section>

          {/* Related Links */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Link 
              href="/docs/agents/getting-started"
              className="p-4 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-neural-100 transition-colors"
            >
              <h3 className="font-semibold text-brand-600 mb-2">← Getting Started</h3>
              <p className="text-neural-600 text-sm">New to agents?</p>
            </Link>
            <Link 
              href="/docs/agents/configuration"
              className="p-4 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-neural-100 transition-colors"
            >
              <h3 className="font-semibold text-brand-600 mb-2">← Configuration</h3>
              <p className="text-neural-600 text-sm">Customize agents</p>
            </Link>
            <Link 
              href="https://mumtaz.ai/agents"
              className="p-4 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-neural-100 transition-colors"
            >
              <h3 className="font-semibold text-brand-600 mb-2">All Agents →</h3>
              <p className="text-neural-600 text-sm">Try them now</p>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
