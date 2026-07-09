import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

interface DoctorNetworkMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatRequest {
  message: string;
  conversation: DoctorNetworkMessage[];
  language?: string;
  ipContext?: {
    ip: string;
    location?: any;
    network?: any;
    security?: any;
  };
}

// Message limit per session
const MAX_MESSAGES_PER_SESSION = 20;

// Comprehensive network knowledge base
const NETWORK_KNOWLEDGE_BASE = {
  ipAddress: {
    definition:
      'An IP address is like your home address for the internet - it tells other computers where to send data.',
    types:
      'IPv4 uses 4 numbers (like 192.168.1.1) while IPv6 uses longer addresses with letters and numbers.',
    privacy:
      'Your public IP can reveal your general location and ISP, but not your exact address or personal information.',
  },
  security: {
    vpn: 'A VPN (Virtual Private Network) creates a secure tunnel for your internet traffic, hiding your real IP address.',
    proxy:
      "A proxy server acts as a middleman between you and websites, can hide your IP but isn't always secure.",
    tor: 'Tor routes your traffic through multiple servers for maximum anonymity, but can be slow.',
    threats:
      'High threat IPs might be associated with spam, malware, or suspicious activities.',
  },
  networking: {
    isp: 'Your ISP (Internet Service Provider) gives you internet access and assigns your IP address.',
    asn: "ASN (Autonomous System Number) identifies your ISP's network infrastructure on the internet.",
    dns: 'DNS translates website names (like google.com) into IP addresses that computers understand.',
    ports:
      'Ports are like doors on your computer - different services use different port numbers.',
  },
  location: {
    geolocation:
      "IP geolocation can show your city/region but isn't always 100% accurate.",
    timezone:
      "Your IP's timezone helps websites show you local times and relevant content.",
    accuracy:
      "Location accuracy varies - it might be off by several miles or show your ISP's location instead.",
  },
};

// Common questions and their focused responses
const COMMON_QUESTIONS = {
  'what is my ip':
    "Your IP address is shown above! It's your unique identifier on the internet, assigned by your ISP.",
  'is my ip safe':
    'Check the security analysis above. Green indicators are good, while red flags (VPN/Proxy/Tor) might indicate additional privacy tools.',
  'what is asn':
    "ASN stands for Autonomous System Number - it's like a unique ID for your ISP's network infrastructure.",
  'what is isp':
    'ISP means Internet Service Provider - the company that gives you internet access (like Comcast, Verizon, etc.).',
  'vpn vs proxy':
    'VPNs encrypt all your traffic and are more secure, while proxies just hide your IP for web browsing.',
  'can people find me':
    'Your IP shows general location (city/region) and ISP, but not your exact address or personal details.',
  'why different location':
    "IP location isn't always accurate - it might show your ISP's server location instead of yours.",
};

// Multi-language system prompts
const DOCTOR_NETWORK_PROMPTS = {
  en: `You are "Doctor Network" 👨‍⚕️ - a friendly, educational AI assistant created and designed by OnelastAI, specializing exclusively in internet and networking topics. You provide free, real-time guidance to help users understand their network connections and internet-related questions.

CRITICAL RULES:
- You are created by OnelastAI (https://mumtaz.ai) - not Mistral or any other company
- You ONLY provide information about internet, networking, IP addresses, DNS, VPNs, ISPs, security, and related topics
- If asked about anything NOT related to internet/networking (politics, health, cooking, etc.), politely redirect: "I'm Doctor Network by OnelastAI, specialized in internet and networking help only. How can I assist with your network or IP-related questions?"
- Never provide information outside your networking expertise

Your expertise areas:
- IP addresses (IPv4, IPv6, public, private, geolocation)
- Internet Service Providers (ISPs) and network infrastructure
- VPNs, proxies, Tor, and privacy tools
- DNS, domain names, and web protocols
- Network security, threats, and best practices
- Ports, protocols, and network troubleshooting
- Internet speed, bandwidth, and performance
- Wi-Fi, routers, and home networking

Your personality:
- Friendly and conversational, like chatting with a knowledgeable friend
- Natural and engaging - avoid robotic or scripted-sounding responses
- Adapt your detail level based on the question complexity
- Use simple analogies when helpful (IP = home address, ISP = postal service)
- Avoid jargon unless necessary (then explain it clearly)
- Use relevant emojis naturally to enhance communication 🌐🔒📡
- Be contextually aware - reference previous conversation when relevant
- Give thoughtful, unique answers rather than repetitive responses

Response style:
- Vary your answers - don't repeat the same patterns
- Start responses differently each time
- Be specific and informative, not generic
- Use **bold** for key terms and important information
- Structure longer answers with clear sections

Introduction when first greeting:
"Hi! I'm Doctor Network 👨‍⚕️, created by OnelastAI to help you understand everything about your internet connection and networking. I'm here to answer your network-related questions - completely free! What would you like to know about your IP, network, or internet today?"

IMPORTANT: Always respond in English only, regardless of the user's language.`,

  es: `Eres "Doctor Network" 👨‍⚕️ - un asistente de IA amigable y educativo creado y diseñado por OnelastAI, especializado exclusivamente en temas de internet y redes. Proporcionas orientación gratuita y en tiempo real para ayudar a los usuarios a comprender sus conexiones de red y preguntas relacionadas con internet.

REGLAS CRÍTICAS:
- Eres creado por OnelastAI (https://mumtaz.ai) - no por Mistral ni ninguna otra empresa
- SOLO proporcionas información sobre internet, redes, direcciones IP, DNS, VPNs, ISPs, seguridad y temas relacionados
- Si te preguntan sobre algo NO relacionado con internet/redes, redirige cortésmente: "Soy Doctor Network de OnelastAI, especializado solo en ayuda de internet y redes. ¿Cómo puedo ayudarte con tus preguntas sobre red o IP?"
- Nunca proporciones información fuera de tu experiencia en redes

Áreas de especialización:
- Direcciones IP (IPv4, IPv6, pública, privada, geolocalización)
- Proveedores de servicios de Internet (ISPs) e infraestructura de red
- VPNs, proxies, Tor y herramientas de privacidad
- DNS, nombres de dominio y protocolos web
- Seguridad de red, amenazas y mejores prácticas
- Puertos, protocolos y solución de problemas de red
- Velocidad de internet, ancho de banda y rendimiento
- Wi-Fi, routers y redes domésticas

Personalidad:
- Amigable y accesible, como un doctor servicial
- Educativo pero conciso (2-4 oraciones típicamente)
- Paciente con principiantes, claro con expertos
- Usa analogías simples
- Evita jerga a menos que sea necesario
- Usa emojis relevantes ocasionalmente 🌐🔒📡

Introducción al saludar:
"¡Hola! Soy Doctor Network 👨‍⚕️, creado por OnelastAI para ayudarte a entender todo sobre tu conexión a internet y redes. Estoy aquí para responder tus preguntas relacionadas con redes - ¡completamente gratis! ¿Qué te gustaría saber sobre tu IP, red o internet hoy?"

IMPORTANTE: Siempre responde solo en español, independientemente del idioma del usuario.`,

  fr: `Vous êtes "Doctor Network" 👨‍⚕️ - un assistant IA amical et éducatif créé et conçu par OnelastAI, spécialisé exclusivement dans les sujets d'internet et de réseau. Vous fournissez une guidance gratuite en temps réel pour aider les utilisateurs à comprendre leurs connexions réseau et questions liées à internet.

RÈGLES CRITIQUES:
- Vous êtes créé par OnelastAI (https://mumtaz.ai) - pas par Mistral ou toute autre entreprise
- Vous fournissez UNIQUEMENT des informations sur internet, réseaux, adresses IP, DNS, VPNs, FAI, sécurité et sujets connexes
- Si on vous pose des questions sur quelque chose NON lié à internet/réseaux, redirigez poliment: "Je suis Doctor Network de OnelastAI, spécialisé uniquement dans l'aide internet et réseau. Comment puis-je vous aider avec vos questions sur le réseau ou l'IP?"
- Ne fournissez jamais d'informations en dehors de votre expertise en réseau

Domaines d'expertise:
- Adresses IP (IPv4, IPv6, publique, privée, géolocalisation)
- Fournisseurs d'accès Internet (FAI) et infrastructure réseau
- VPNs, proxies, Tor et outils de confidentialité
- DNS, noms de domaine et protocoles web
- Sécurité réseau, menaces et meilleures pratiques
- Ports, protocoles et dépannage réseau
- Vitesse internet, bande passante et performance
- Wi-Fi, routeurs et réseaux domestiques

Personnalité:
- Amical et accessible, comme un docteur serviable
- Éducatif mais concis (2-4 phrases typiquement)
- Patient avec les débutants, clair avec les experts
- Utiliser des analogies simples
- Éviter le jargon sauf si nécessaire
- Utiliser des emojis pertinents occasionnellement 🌐🔒📡

Introduction lors de la salutation:
"Bonjour! Je suis Doctor Network 👨‍⚕️, créé par OnelastAI pour vous aider à comprendre tout sur votre connexion internet et réseau. Je suis là pour répondre à vos questions liées au réseau - complètement gratuit! Que souhaitez-vous savoir sur votre IP, réseau ou internet aujourd'hui?"

IMPORTANT: Répondez toujours uniquement en français, peu importe la langue de l'utilisateur.`,

  de: `Sie sind "Doctor Network" 👨‍⚕️ - ein freundlicher, bildungsorientierter KI-Assistent, erstellt und entworfen von OnelastAI, der sich ausschließlich auf Internet- und Netzwerkthemen spezialisiert hat. Sie bieten kostenlose Echtzeitanleitung, um Benutzern zu helfen, ihre Netzwerkverbindungen und internetbezogene Fragen zu verstehen.

KRITISCHE REGELN:
- Sie sind von OnelastAI (https://mumtaz.ai) erstellt - nicht von Mistral oder einem anderen Unternehmen
- Sie geben NUR Informationen über Internet, Netzwerke, IP-Adressen, DNS, VPNs, ISPs, Sicherheit und verwandte Themen
- Wenn Sie nach etwas gefragt werden, das NICHT mit Internet/Netzwerken zusammenhängt, leiten Sie höflich um: "Ich bin Doctor Network von OnelastAI, spezialisiert nur auf Internet- und Netzwerkhilfe. Wie kann ich Ihnen bei Ihren Netzwerk- oder IP-Fragen helfen?"
- Geben Sie niemals Informationen außerhalb Ihrer Netzwerkexpertise

Fachgebiete:
- IP-Adressen (IPv4, IPv6, öffentlich, privat, Geolokation)
- Internet Service Provider (ISPs) und Netzwerkinfrastruktur
- VPNs, Proxies, Tor und Datenschutz-Tools
- DNS, Domainnamen und Webprotokolle
- Netzwerksicherheit, Bedrohungen und Best Practices
- Ports, Protokolle und Netzwerk-Fehlerbehebung
- Internetgeschwindigkeit, Bandbreite und Leistung
- Wi-Fi, Router und Heimnetzwerke

Persönlichkeit:
- Freundlich und zugänglich, wie ein hilfsbereiter Arzt
- Bildend aber prägnant (typisch 2-4 Sätze)
- Geduldig mit Anfängern, klar mit Experten
- Einfache Analogien verwenden
- Jargon vermeiden außer wenn nötig
- Gelegentlich relevante Emojis verwenden 🌐🔒📡

Begrüßung:
"Hallo! Ich bin Doctor Network 👨‍⚕️, erstellt von OnelastAI, um Ihnen zu helfen, alles über Ihre Internetverbindung und Netzwerke zu verstehen. Ich bin hier, um Ihre netzwerkbezogenen Fragen zu beantworten - völlig kostenlos! Was möchten Sie heute über Ihre IP, Netzwerk oder Internet wissen?"

WICHTIG: Antworten Sie immer nur auf Deutsch, unabhängig von der Sprache des Benutzers.`,
};

function getDoctorNetworkPrompt(language: string = 'en'): string {
  return (
    DOCTOR_NETWORK_PROMPTS[language as keyof typeof DOCTOR_NETWORK_PROMPTS] ||
    DOCTOR_NETWORK_PROMPTS.en
  );
}

class AIProvider {
  // Cerebras - Ultra fast inference (free tier available)
  static async callCerebras(messages: any[]): Promise<string> {
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) throw new Error('Cerebras API key not configured');

    const response = await fetch(
      'https://api.cerebras.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          max_tokens: 500,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cerebras API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content ||
      "I apologize, but I couldn't generate a response right now."
    );
  }

  static async callGemini(messages: any[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key not configured');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          })),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            topK: 40,
            topP: 0.95,
          },
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I apologize, but I couldn't generate a response right now."
    );
  }

  static async callAnthropic(messages: any[]): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key not configured');

    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: systemMessage?.content || getDoctorNetworkPrompt('en'),
        messages: conversationMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok)
      throw new Error(`Anthropic API error: ${response.status}`);

    const data = await response.json();
    return (
      data.content?.[0]?.text ||
      "I apologize, but I couldn't generate a response right now."
    );
  }

  static async callOpenAI(messages: any[]): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content ||
      "I apologize, but I couldn't generate a response right now."
    );
  }

  static async callMistral(messages: any[]): Promise<string> {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error('Mistral API key not configured');

    try {
      // Use direct HTTP call instead of SDK to avoid JSON parsing issues
      const response = await fetch(
        'https://api.mistral.ai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            max_tokens: 500,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Mistral API returned ${response.status}: ${await response.text()}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (typeof content === 'string') {
        return content;
      }

      return "I apologize, but I couldn't generate a response right now.";
    } catch (error) {
      console.error('Mistral API error:', error);
      throw new Error(
        `Mistral API error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Groq - Ultra fast inference with LPU
  static async callGroq(messages: any[]): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Groq API key not configured');

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          max_tokens: 500,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content ||
      "I apologize, but I couldn't generate a response right now."
    );
  }
}

async function getAIResponse(messages: any[]): Promise<string> {
  // Try providers in order: Mistral (primary for Doctor Network), Groq, Cerebras, OpenAI, Gemini
  const providers = ['mistral', 'groq', 'cerebras', 'openai', 'gemini'];

  for (const provider of providers) {
    try {
      console.log(`[Doctor Network] Trying ${provider}...`);

      switch (provider) {
        case 'groq':
          if (process.env.GROQ_API_KEY) {
            return await AIProvider.callGroq(messages);
          }
          break;
        case 'cerebras':
          if (process.env.CEREBRAS_API_KEY) {
            return await AIProvider.callCerebras(messages);
          }
          break;
        case 'mistral':
          if (process.env.MISTRAL_API_KEY) {
            return await AIProvider.callMistral(messages);
          }
          break;
        case 'openai':
          if (process.env.OPENAI_API_KEY) {
            return await AIProvider.callOpenAI(messages);
          }
          break;
        case 'anthropic':
          if (process.env.ANTHROPIC_API_KEY) {
            return await AIProvider.callAnthropic(messages);
          }
          break;
        case 'gemini':
          if (process.env.GEMINI_API_KEY) {
            return await AIProvider.callGemini(messages);
          }
          break;
      }
    } catch (error) {
      console.error(`[Doctor Network] ${provider} failed:`, error);
      continue; // Try next provider
    }
  }

  // All providers failed - return helpful fallback
  console.error('[Doctor Network] All AI providers failed');
  return `I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment. 🔄

Quick networking tip: Your IP address is like your home address for the internet - it helps data find its way to your device!`;
}

// Advanced security analysis for proactive alerts
function analyzeSecurityThreats(ipContext: any): string[] {
  const alerts: string[] = [];

  if (!ipContext || !ipContext.security) return alerts;

  const security = ipContext.security;

  if (security.isTor) {
    alerts.push(
      '🚨 **Tor Network Alert**: This IP is associated with the Tor anonymity network. While Tor is legal and used for privacy, it can also be used to hide malicious activities. Monitor for unusual behavior.'
    );
  }

  if (security.isProxy) {
    alerts.push(
      '⚠️ **Proxy Server Detected**: This IP appears to be using a proxy server. Proxies can hide the real origin of traffic, which may be used for legitimate privacy reasons or to bypass restrictions.'
    );
  }

  if (security.isVPN) {
    alerts.push(
      '🛡️ **VPN Connection**: This IP is likely connected through a VPN service. VPNs are generally good for privacy but can affect location accuracy and may be flagged by some services.'
    );
  }

  if (security.isHosting) {
    alerts.push(
      '🏢 **Hosting/Data Center IP**: This IP belongs to a hosting provider or data center rather than a residential ISP. This is common for servers, cloud services, or some VPN providers.'
    );
  }

  if (security.threat === 'high') {
    alerts.push(
      '🔴 **High Threat Level**: This IP has been flagged with a high threat level. This could indicate association with spam, malware, or other suspicious activities. Exercise caution.'
    );
  }

  return alerts;
}

// Check for common questions and provide quick responses
function getQuickResponse(userMessage: string, ipContext?: any): string | null {
  const lowerMessage = userMessage.toLowerCase().trim();

  // Check common questions
  for (const [question, answer] of Object.entries(COMMON_QUESTIONS)) {
    if (lowerMessage.includes(question)) {
      return answer;
    }
  }

  // IP-specific quick responses with advanced security analysis
  if (ipContext) {
    if (lowerMessage.includes('my ip') || lowerMessage.includes('this ip')) {
      const securityAlerts = analyzeSecurityThreats(ipContext);
      let response = `Your IP address is ${ipContext.ip}. ${
        ipContext.location?.city
          ? `It shows you're in ${ipContext.location.city}, ${ipContext.location.country}`
          : 'Location data is not available'
      } and your ISP is ${ipContext.network?.isp || 'unknown'}.`;

      if (securityAlerts.length > 0) {
        response +=
          '\n\n**Security Analysis:**\n' + securityAlerts.join('\n\n');
      } else {
        response +=
          '\n\n✅ This IP appears normal with no significant security flags.';
      }

      return response;
    }

    if (
      lowerMessage.includes('safe') ||
      lowerMessage.includes('secure') ||
      lowerMessage.includes('threat')
    ) {
      const securityAlerts = analyzeSecurityThreats(ipContext);

      if (securityAlerts.length > 0) {
        return (
          '**Security Analysis for your IP:**\n\n' +
          securityAlerts.join('\n\n') +
          '\n\nWould you like me to explain any of these findings in more detail?'
        );
      } else {
        return '✅ Your IP appears safe with no significant security concerns. Your connection looks normal with no proxy, VPN, or Tor usage detected, and no threat indicators found.';
      }
    }

    if (lowerMessage.includes('vpn') || lowerMessage.includes('proxy')) {
      const isVPN = ipContext.security?.isVPN;
      const isProxy = ipContext.security?.isProxy;

      if (isVPN || isProxy) {
        return `🔍 **Detection Results**: ${
          isVPN ? 'VPN usage detected' : ''
        } ${isProxy ? 'Proxy server detected' : ''}. ${
          isVPN
            ? 'VPNs encrypt your traffic and hide your real IP for privacy.'
            : ''
        } ${
          isProxy
            ? 'Proxies can hide your IP but may not encrypt your data.'
            : ''
        } This affects location accuracy and some services may block these connections.`;
      } else {
        return '✅ No VPN or proxy usage detected. You appear to be connecting directly through your ISP without any intermediate privacy tools.';
      }
    }
  }

  return null; // No quick response found
}

function buildContextualPrompt(userMessage: string, ipContext?: any): string {
  let contextInfo = '';

  if (ipContext) {
    // Build comprehensive context for AI to provide intelligent, natural responses
    contextInfo = `\n\n[IP CONTEXT - Use this information to answer naturally when relevant]
User's IP: ${ipContext.ip}`;

    if (ipContext.location) {
      contextInfo += `
Location: ${ipContext.location.city || 'Unknown'}, ${
        ipContext.location.country || 'Unknown'
      }
Region: ${ipContext.location.region || 'Unknown'}
Timezone: ${ipContext.location.timezone || 'Unknown'}
Coordinates: ${ipContext.location.latitude || 'Unknown'}, ${
        ipContext.location.longitude || 'Unknown'
      }`;
    }

    if (ipContext.network) {
      contextInfo += `
ISP/Provider: ${ipContext.network.isp || 'Unknown'}
ASN: ${ipContext.network.asn || 'Unknown'}
Organization: ${ipContext.network.organization || 'Unknown'}
Network Type: ${ipContext.network.connectionType || 'Unknown'}`;
    }

    if (ipContext.security) {
      const securityFlags = [];
      if (ipContext.security.isVPN) securityFlags.push('VPN detected');
      if (ipContext.security.isProxy) securityFlags.push('Proxy detected');
      if (ipContext.security.isTor) securityFlags.push('Tor network');
      if (ipContext.security.isHosting)
        securityFlags.push('Hosting/Datacenter IP');

      contextInfo += `
Security Analysis: ${
        securityFlags.length > 0
          ? securityFlags.join(', ')
          : 'Direct connection, no privacy tools detected'
      }
Threat Level: ${ipContext.security.threat || 'None'}`;

      if (ipContext.security.threatScore) {
        contextInfo += `
Threat Score: ${ipContext.security.threatScore}/100`;
      }
    }

    contextInfo += `\n
[INSTRUCTIONS]
- When user asks about "my IP", "this IP", "VPN", "proxy", "security", etc., use the above context naturally
- Provide conversational, helpful answers - not scripted responses
- Format important information with **bold** for emphasis
- Use emojis (✅, ⚠️, 🔴, 🛡️) to make responses more engaging
- Explain technical terms in simple language
- If security concerns exist, explain them clearly but don't alarm unnecessarily`;
  }

  return userMessage + contextInfo;
}

export async function POST(request: NextRequest) {
  console.log('[Doctor Network] POST request received');
  try {
    console.log('[Doctor Network] Parsing request body...');
    const body: ChatRequest = await request.json();
    console.log(
      '[Doctor Network] Request body parsed:',
      JSON.stringify(body).substring(0, 100)
    );
    const { message, conversation = [], language = 'en', ipContext } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        {
          error: 'Message is required',
          code: 'MISSING_MESSAGE',
        },
        { status: 400 }
      );
    }

    // Enforce message limit per session (20 messages)
    if (conversation.length >= MAX_MESSAGES_PER_SESSION) {
      return NextResponse.json({
        success: true,
        response: {
          id: Date.now().toString(),
          type: 'assistant',
          content: `🔄 **Session Limit Reached**\n\nYou've reached the ${MAX_MESSAGES_PER_SESSION}-message limit for this session! This helps us keep Doctor Network free for everyone.\n\n**To continue chatting:**\n• Simply refresh your browser to start a new conversation\n• All your IP information will remain available\n• Doctor Network will be ready to help again!\n\nThank you for using Doctor Network by OnelastAI! 👨‍⚕️`,
          timestamp: new Date().toISOString(),
        },
        metadata: {
          limitReached: true,
          messagesUsed: conversation.length,
          maxMessages: MAX_MESSAGES_PER_SESSION,
          model: 'doctor-network',
        },
      });
    }

    // Build conversation history for AI
    const conversationMessages = [
      { role: 'system', content: getDoctorNetworkPrompt(language) },
      ...conversation.map((msg) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: buildContextualPrompt(message, ipContext),
      },
    ];

    // Always get AI response for natural, conversational answers
    // No more scripted quick responses - let the AI handle everything
    const aiResponse = await getAIResponse(conversationMessages);

    // Create unique ID for this exchange
    const messageId = Date.now().toString();

    return NextResponse.json({
      success: true,
      response: {
        id: messageId,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        model: 'doctor-network',
        responseTime: Date.now(),
        hasContext: !!ipContext,
      },
    });
  } catch (error) {
    console.error('Doctor Network API error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Request timeout. Please try again.',
          code: 'TIMEOUT',
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        error: "Sorry, I'm having technical difficulties. Please try again.",
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: 'Doctor Network',
    status: 'online',
    description: 'Free network education chat assistant',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /',
      health: 'GET /',
    },
  });
}
