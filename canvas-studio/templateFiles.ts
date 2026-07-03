/**
 * Template Files — Real built-in starter code for each template.
 * Maps template ID → Record<filepath, code>.
 */

export const TEMPLATE_FILES: Record<string, Record<string, string>> = {

// ═══════════════════════════════════════════════════════════════
// HTML Templates
// ═══════════════════════════════════════════════════════════════

'saas-landing': {
'/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ProductivityApp — Work Smarter</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<nav class="navbar">
  <div class="container nav-content">
    <a href="#" class="logo">⚡ ProductivityApp</a>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="#testimonials">Testimonials</a>
      <a href="#" class="btn btn-primary btn-sm">Get Started</a>
    </div>
  </div>
</nav>

<section class="hero">
  <div class="container">
    <div class="hero-badge">🚀 Now in public beta</div>
    <h1>Work smarter,<br><span class="gradient-text">not harder</span></h1>
    <p class="hero-sub">The all-in-one productivity platform that helps teams collaborate, track progress, and ship faster.</p>
    <div class="hero-actions">
      <a href="#" class="btn btn-primary btn-lg">Start Free Trial</a>
      <a href="#" class="btn btn-outline btn-lg">Watch Demo →</a>
    </div>
    <div class="hero-stats">
      <div class="stat"><strong>10K+</strong><span>Active Users</span></div>
      <div class="stat"><strong>99.9%</strong><span>Uptime</span></div>
      <div class="stat"><strong>4.9★</strong><span>Rating</span></div>
    </div>
  </div>
</section>

<section id="features" class="features">
  <div class="container">
    <h2>Everything you need</h2>
    <p class="section-sub">Powerful features to supercharge your workflow</p>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Analytics Dashboard</h3>
        <p>Real-time insights into your team's productivity with beautiful charts and metrics.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🤖</div>
        <h3>AI Assistant</h3>
        <p>Smart suggestions and automation powered by cutting-edge artificial intelligence.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔗</div>
        <h3>Integrations</h3>
        <p>Connect with 100+ tools including Slack, GitHub, Jira, and more.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>Enterprise Security</h3>
        <p>SOC 2 compliant with end-to-end encryption and SSO support.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Lightning Fast</h3>
        <p>Optimized performance with sub-100ms response times globally.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h3>Mobile Ready</h3>
        <p>Full-featured mobile apps for iOS and Android with offline support.</p>
      </div>
    </div>
  </div>
</section>

<section id="pricing" class="pricing">
  <div class="container">
    <h2>Simple pricing</h2>
    <p class="section-sub">No hidden fees. Cancel anytime.</p>
    <div class="pricing-grid">
      <div class="price-card">
        <h3>Starter</h3>
        <div class="price">$0<span>/mo</span></div>
        <ul>
          <li>✓ Up to 5 users</li>
          <li>✓ Basic analytics</li>
          <li>✓ 5GB storage</li>
          <li>✓ Email support</li>
        </ul>
        <a href="#" class="btn btn-outline">Get Started</a>
      </div>
      <div class="price-card popular">
        <div class="popular-badge">Most Popular</div>
        <h3>Pro</h3>
        <div class="price">$29<span>/mo</span></div>
        <ul>
          <li>✓ Unlimited users</li>
          <li>✓ Advanced analytics</li>
          <li>✓ 100GB storage</li>
          <li>✓ Priority support</li>
          <li>✓ API access</li>
        </ul>
        <a href="#" class="btn btn-primary">Start Free Trial</a>
      </div>
      <div class="price-card">
        <h3>Enterprise</h3>
        <div class="price">Custom</div>
        <ul>
          <li>✓ Everything in Pro</li>
          <li>✓ SSO / SAML</li>
          <li>✓ Dedicated support</li>
          <li>✓ SLA guarantee</li>
        </ul>
        <a href="#" class="btn btn-outline">Contact Sales</a>
      </div>
    </div>
  </div>
</section>

<section id="testimonials" class="testimonials">
  <div class="container">
    <h2>Loved by teams</h2>
    <div class="testimonials-grid">
      <div class="testimonial-card">
        <p>"ProductivityApp transformed how our team works. We shipped 3x faster in just one month."</p>
        <div class="testimonial-author">
          <div class="avatar">SK</div>
          <div><strong>Sarah Kim</strong><br><span>CTO, TechStart</span></div>
        </div>
      </div>
      <div class="testimonial-card">
        <p>"The AI features are incredible. It's like having an extra team member."</p>
        <div class="testimonial-author">
          <div class="avatar">MJ</div>
          <div><strong>Mike Johnson</strong><br><span>PM, ScaleUp</span></div>
        </div>
      </div>
      <div class="testimonial-card">
        <p>"Best tool we've adopted this year. The integrations save us hours every week."</p>
        <div class="testimonial-author">
          <div class="avatar">AL</div>
          <div><strong>Amy Lee</strong><br><span>VP Eng, DataFlow</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<footer class="footer">
  <div class="container footer-content">
    <div class="footer-brand">
      <a href="#" class="logo">⚡ ProductivityApp</a>
      <p>Making teams more productive since 2024.</p>
    </div>
    <div class="footer-links">
      <div><h4>Product</h4><a href="#">Features</a><a href="#">Pricing</a><a href="#">Changelog</a></div>
      <div><h4>Company</h4><a href="#">About</a><a href="#">Blog</a><a href="#">Careers</a></div>
      <div><h4>Legal</h4><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a></div>
    </div>
  </div>
</footer>
<script src="script.js"></script>
</body>
</html>`,

'/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --bg: #0a0a0a;
  --surface: #111;
  --border: #1f2937;
  --text: #e5e7eb;
  --text-muted: #9ca3af;
}
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
a { color: inherit; text-decoration: none; }

/* Navbar */
.navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(10,10,10,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
.nav-content { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.logo { font-weight: 800; font-size: 18px; }
.nav-links { display: flex; align-items: center; gap: 28px; font-size: 14px; color: var(--text-muted); }
.nav-links a:hover { color: white; }

/* Buttons */
.btn { display: inline-flex; align-items: center; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: all 0.2s; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); }
.btn-outline { border: 1px solid var(--border); color: var(--text); background: transparent; }
.btn-outline:hover { border-color: var(--primary); color: var(--primary); }
.btn-sm { padding: 8px 16px; font-size: 13px; }
.btn-lg { padding: 14px 28px; font-size: 16px; }

/* Hero */
.hero { padding: 160px 0 80px; text-align: center; }
.hero-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; background: var(--primary)/15; border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; margin-bottom: 24px; }
.hero h1 { font-size: 56px; font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
.gradient-text { background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-sub { font-size: 18px; color: var(--text-muted); max-width: 540px; margin: 0 auto 32px; line-height: 1.6; }
.hero-actions { display: flex; gap: 12px; justify-content: center; margin-bottom: 48px; }
.hero-stats { display: flex; justify-content: center; gap: 48px; }
.stat strong { display: block; font-size: 24px; }
.stat span { font-size: 13px; color: var(--text-muted); }

/* Features */
.features, .pricing, .testimonials { padding: 80px 0; }
h2 { font-size: 36px; font-weight: 800; text-align: center; margin-bottom: 8px; }
.section-sub { text-align: center; color: var(--text-muted); margin-bottom: 48px; }
.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.feature-card { padding: 28px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; transition: all 0.3s; }
.feature-card:hover { border-color: var(--primary); transform: translateY(-4px); }
.feature-icon { font-size: 32px; margin-bottom: 12px; }
.feature-card h3 { font-size: 16px; margin-bottom: 8px; }
.feature-card p { font-size: 14px; color: var(--text-muted); line-height: 1.5; }

/* Pricing */
.pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 900px; margin: 0 auto; }
.price-card { padding: 32px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; text-align: center; position: relative; }
.price-card.popular { border-color: var(--primary); box-shadow: 0 0 40px rgba(99,102,241,0.15); }
.popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; }
.price-card h3 { font-size: 18px; margin-bottom: 12px; }
.price { font-size: 42px; font-weight: 800; margin-bottom: 24px; }
.price span { font-size: 16px; color: var(--text-muted); font-weight: 400; }
.price-card ul { list-style: none; text-align: left; margin-bottom: 24px; }
.price-card li { padding: 8px 0; font-size: 14px; color: var(--text-muted); border-bottom: 1px solid var(--border); }
.price-card .btn { width: 100%; justify-content: center; }

/* Testimonials */
.testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.testimonial-card { padding: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; }
.testimonial-card p { font-size: 14px; line-height: 1.6; margin-bottom: 16px; font-style: italic; }
.testimonial-author { display: flex; align-items: center; gap: 12px; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; }
.testimonial-author strong { font-size: 14px; }
.testimonial-author span { font-size: 12px; color: var(--text-muted); }

/* Footer */
.footer { padding: 48px 0; border-top: 1px solid var(--border); }
.footer-content { display: flex; justify-content: space-between; }
.footer-brand p { font-size: 13px; color: var(--text-muted); margin-top: 8px; }
.footer-links { display: flex; gap: 48px; }
.footer-links h4 { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
.footer-links a { display: block; font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }

@media (max-width: 768px) {
  .hero h1 { font-size: 36px; }
  .features-grid, .pricing-grid, .testimonials-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
}`,

'/script.js': `// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (window.scrollY > 50) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// Animate elements on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card, .price-card, .testimonial-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'all 0.5s ease';
  observer.observe(el);
});`
},

'portfolio': {
'/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Alex Chen — Developer</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<nav class="nav">
  <div class="container">
    <a href="#" class="nav-logo">AC</a>
    <div class="nav-links">
      <a href="#projects">Projects</a>
      <a href="#skills">Skills</a>
      <a href="#contact">Contact</a>
    </div>
  </div>
</nav>

<section class="hero">
  <div class="container">
    <p class="hero-tag">Hello, I'm</p>
    <h1>Alex Chen</h1>
    <p class="hero-role">Full-Stack Developer</p>
    <p class="hero-bio">I build modern web applications with clean code and great user experiences. Currently open to new opportunities.</p>
    <div class="hero-links">
      <a href="#contact" class="btn btn-primary">Get in Touch</a>
      <a href="#projects" class="btn btn-ghost">View Work →</a>
    </div>
  </div>
</section>

<section id="projects" class="projects">
  <div class="container">
    <h2>Featured Projects</h2>
    <div class="project-grid">
      <div class="project-card">
        <div class="project-img" style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
          <span>📊</span>
        </div>
        <div class="project-info">
          <h3>Analytics Dashboard</h3>
          <p>Real-time analytics platform with interactive charts and data visualization.</p>
          <div class="project-tech">
            <span>React</span><span>D3.js</span><span>Node.js</span>
          </div>
          <div class="project-links">
            <a href="#">Live Demo ↗</a>
            <a href="#">GitHub ↗</a>
          </div>
        </div>
      </div>
      <div class="project-card">
        <div class="project-img" style="background: linear-gradient(135deg, #06b6d4, #3b82f6);">
          <span>🛒</span>
        </div>
        <div class="project-info">
          <h3>E-Commerce Platform</h3>
          <p>Full-featured online store with cart, checkout, and payment processing.</p>
          <div class="project-tech">
            <span>Next.js</span><span>Stripe</span><span>PostgreSQL</span>
          </div>
          <div class="project-links">
            <a href="#">Live Demo ↗</a>
            <a href="#">GitHub ↗</a>
          </div>
        </div>
      </div>
      <div class="project-card">
        <div class="project-img" style="background: linear-gradient(135deg, #f59e0b, #ef4444);">
          <span>💬</span>
        </div>
        <div class="project-info">
          <h3>Chat Application</h3>
          <p>Real-time messaging app with rooms, file sharing, and read receipts.</p>
          <div class="project-tech">
            <span>TypeScript</span><span>Socket.io</span><span>Redis</span>
          </div>
          <div class="project-links">
            <a href="#">Live Demo ↗</a>
            <a href="#">GitHub ↗</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="skills" class="skills">
  <div class="container">
    <h2>Skills & Tools</h2>
    <div class="skills-grid">
      <div class="skill-group">
        <h3>Frontend</h3>
        <div class="skill-bar"><span>React / Next.js</span><div class="bar"><div class="fill" style="width:95%"></div></div></div>
        <div class="skill-bar"><span>TypeScript</span><div class="bar"><div class="fill" style="width:90%"></div></div></div>
        <div class="skill-bar"><span>Tailwind CSS</span><div class="bar"><div class="fill" style="width:92%"></div></div></div>
      </div>
      <div class="skill-group">
        <h3>Backend</h3>
        <div class="skill-bar"><span>Node.js</span><div class="bar"><div class="fill" style="width:88%"></div></div></div>
        <div class="skill-bar"><span>Python</span><div class="bar"><div class="fill" style="width:82%"></div></div></div>
        <div class="skill-bar"><span>PostgreSQL</span><div class="bar"><div class="fill" style="width:85%"></div></div></div>
      </div>
    </div>
  </div>
</section>

<section id="contact" class="contact">
  <div class="container">
    <h2>Get In Touch</h2>
    <p class="contact-sub">Have a project in mind? Let's talk.</p>
    <form class="contact-form" onsubmit="handleSubmit(event)">
      <input type="text" placeholder="Your Name" required>
      <input type="email" placeholder="Your Email" required>
      <textarea placeholder="Your Message" rows="5" required></textarea>
      <button type="submit" class="btn btn-primary">Send Message</button>
    </form>
  </div>
</section>

<footer class="footer">
  <div class="container">
    <p>&copy; 2024 Alex Chen. Built with passion.</p>
  </div>
</footer>
<script src="script.js"></script>
</body>
</html>`,

'/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
:root { --accent: #6366f1; --bg: #0a0a0a; --surface: #111; --border: #1f2937; --text: #e5e7eb; --muted: #9ca3af; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
.container { max-width: 900px; margin: 0 auto; padding: 0 24px; }
a { color: var(--accent); text-decoration: none; }

.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(10,10,10,0.85); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); }
.nav .container { display: flex; align-items: center; justify-content: space-between; height: 56px; }
.nav-logo { font-weight: 800; font-size: 18px; color: var(--accent); }
.nav-links { display: flex; gap: 24px; font-size: 14px; }
.nav-links a { color: var(--muted); } .nav-links a:hover { color: white; }

.btn { display: inline-flex; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; }
.btn-primary { background: var(--accent); color: white; } .btn-primary:hover { opacity: 0.9; }
.btn-ghost { color: var(--accent); background: transparent; }

.hero { padding: 140px 0 80px; }
.hero-tag { font-size: 14px; color: var(--accent); font-weight: 600; margin-bottom: 8px; }
.hero h1 { font-size: 52px; font-weight: 800; margin-bottom: 8px; }
.hero-role { font-size: 20px; color: var(--muted); margin-bottom: 16px; }
.hero-bio { font-size: 16px; color: var(--muted); max-width: 500px; line-height: 1.6; margin-bottom: 28px; }
.hero-links { display: flex; gap: 12px; }

.projects, .skills, .contact { padding: 80px 0; }
h2 { font-size: 28px; font-weight: 800; margin-bottom: 32px; }

.project-grid { display: grid; gap: 24px; }
.project-card { display: flex; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; transition: 0.3s; }
.project-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.project-img { width: 200px; min-height: 160px; display: flex; align-items: center; justify-content: center; font-size: 48px; flex-shrink: 0; }
.project-info { padding: 20px; flex: 1; }
.project-info h3 { font-size: 18px; margin-bottom: 8px; }
.project-info p { font-size: 14px; color: var(--muted); line-height: 1.5; margin-bottom: 12px; }
.project-tech { display: flex; gap: 8px; margin-bottom: 12px; }
.project-tech span { padding: 4px 10px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 6px; font-size: 12px; color: var(--accent); }
.project-links { display: flex; gap: 16px; font-size: 13px; }

.skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.skill-group h3 { font-size: 14px; color: var(--accent); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
.skill-bar { margin-bottom: 14px; }
.skill-bar span { font-size: 13px; display: block; margin-bottom: 6px; }
.bar { height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--accent), #06b6d4); border-radius: 4px; transition: width 1s ease; }

.contact-sub { color: var(--muted); margin-bottom: 24px; margin-top: -20px; }
.contact-form { display: flex; flex-direction: column; gap: 12px; max-width: 500px; }
.contact-form input, .contact-form textarea { padding: 12px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-size: 14px; font-family: inherit; }
.contact-form input:focus, .contact-form textarea:focus { outline: none; border-color: var(--accent); }

.footer { padding: 32px 0; border-top: 1px solid var(--border); text-align: center; font-size: 13px; color: var(--muted); }

@media (max-width: 640px) {
  .project-card { flex-direction: column; }
  .project-img { width: 100%; min-height: 120px; }
  .skills-grid { grid-template-columns: 1fr; }
}`,

'/script.js': `// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
});

// Animate skill bars on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.fill').forEach(fill => {
        fill.style.width = fill.style.width; // trigger animation
      });
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.skill-group').forEach(el => observer.observe(el));

function handleSubmit(e) {
  e.preventDefault();
  alert('Message sent! (Demo)');
  e.target.reset();
}`
},

'dashboard-html': {
'/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard — Analytics</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<aside class="sidebar">
  <div class="sidebar-logo">📊 Analytics</div>
  <nav class="sidebar-nav">
    <a href="#" class="nav-item active"><span>📈</span> Dashboard</a>
    <a href="#" class="nav-item"><span>👥</span> Users</a>
    <a href="#" class="nav-item"><span>📦</span> Products</a>
    <a href="#" class="nav-item"><span>💰</span> Revenue</a>
    <a href="#" class="nav-item"><span>⚙️</span> Settings</a>
  </nav>
</aside>
<main class="main">
  <header class="header">
    <div>
      <h1>Dashboard</h1>
      <p class="header-sub">Welcome back, Admin</p>
    </div>
    <div class="header-actions">
      <div class="search-box">
        <span>🔍</span>
        <input type="text" placeholder="Search...">
      </div>
      <button class="icon-btn">🔔<span class="badge">3</span></button>
      <div class="avatar">A</div>
    </div>
  </header>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon" style="background: rgba(99,102,241,0.15); color: #6366f1;">📈</div>
      <div class="stat-info">
        <p class="stat-label">Total Revenue</p>
        <p class="stat-value">$48,250</p>
        <p class="stat-change up">↑ 12.5%</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background: rgba(6,182,212,0.15); color: #06b6d4;">👥</div>
      <div class="stat-info">
        <p class="stat-label">Active Users</p>
        <p class="stat-value">2,420</p>
        <p class="stat-change up">↑ 8.1%</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background: rgba(16,185,129,0.15); color: #10b981;">🛒</div>
      <div class="stat-info">
        <p class="stat-label">Orders</p>
        <p class="stat-value">1,210</p>
        <p class="stat-change up">↑ 3.2%</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background: rgba(245,158,11,0.15); color: #f59e0b;">⚡</div>
      <div class="stat-info">
        <p class="stat-label">Conversion</p>
        <p class="stat-value">3.6%</p>
        <p class="stat-change down">↓ 0.4%</p>
      </div>
    </div>
  </div>

  <div class="charts-row">
    <div class="chart-card wide">
      <h3>Revenue Overview</h3>
      <div class="chart-placeholder">
        <div class="bar-chart">
          <div class="bar" style="height: 40%"><span>Jan</span></div>
          <div class="bar" style="height: 55%"><span>Feb</span></div>
          <div class="bar" style="height: 45%"><span>Mar</span></div>
          <div class="bar" style="height: 70%"><span>Apr</span></div>
          <div class="bar" style="height: 65%"><span>May</span></div>
          <div class="bar" style="height: 85%"><span>Jun</span></div>
          <div class="bar active" style="height: 90%"><span>Jul</span></div>
        </div>
      </div>
    </div>
    <div class="chart-card">
      <h3>Traffic Sources</h3>
      <div class="donut-list">
        <div class="donut-item"><span class="dot" style="background:#6366f1"></span>Direct — 42%</div>
        <div class="donut-item"><span class="dot" style="background:#06b6d4"></span>Social — 28%</div>
        <div class="donut-item"><span class="dot" style="background:#10b981"></span>Organic — 18%</div>
        <div class="donut-item"><span class="dot" style="background:#f59e0b"></span>Referral — 12%</div>
      </div>
    </div>
  </div>

  <div class="table-card">
    <div class="table-header">
      <h3>Recent Activity</h3>
      <button class="btn-sm">View All</button>
    </div>
    <table>
      <thead>
        <tr><th>User</th><th>Action</th><th>Date</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr><td><div class="user-cell"><div class="avatar-sm">JD</div>John Doe</div></td><td>Purchased Pro Plan</td><td>2 min ago</td><td><span class="status success">Completed</span></td></tr>
        <tr><td><div class="user-cell"><div class="avatar-sm">SK</div>Sarah Kim</div></td><td>Signed up</td><td>15 min ago</td><td><span class="status success">Completed</span></td></tr>
        <tr><td><div class="user-cell"><div class="avatar-sm">MJ</div>Mike Johnson</div></td><td>Submitted ticket</td><td>1 hr ago</td><td><span class="status pending">Pending</span></td></tr>
        <tr><td><div class="user-cell"><div class="avatar-sm">AL</div>Amy Lee</div></td><td>Upgraded plan</td><td>3 hr ago</td><td><span class="status success">Completed</span></td></tr>
      </tbody>
    </table>
  </div>
</main>
<script src="script.js"></script>
</body>
</html>`,

'/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
:root { --bg: #0a0a0a; --surface: #111; --border: #1f2937; --text: #e5e7eb; --muted: #9ca3af; --accent: #6366f1; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); display: flex; min-height: 100vh; }

.sidebar { width: 220px; background: var(--surface); border-right: 1px solid var(--border); padding: 20px 0; flex-shrink: 0; position: fixed; top: 0; bottom: 0; }
.sidebar-logo { font-size: 16px; font-weight: 800; padding: 0 20px 20px; border-bottom: 1px solid var(--border); }
.sidebar-nav { padding: 12px 0; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; font-size: 14px; color: var(--muted); transition: 0.2s; }
.nav-item:hover { color: var(--text); background: rgba(255,255,255,0.03); }
.nav-item.active { color: var(--accent); background: rgba(99,102,241,0.08); border-right: 2px solid var(--accent); }
a { text-decoration: none; color: inherit; }

.main { margin-left: 220px; flex: 1; padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.header h1 { font-size: 24px; font-weight: 700; }
.header-sub { font-size: 13px; color: var(--muted); }
.header-actions { display: flex; align-items: center; gap: 12px; }
.search-box { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
.search-box input { background: none; border: none; color: var(--text); outline: none; font-size: 13px; width: 160px; }
.icon-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px; cursor: pointer; position: relative; font-size: 16px; }
.badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; align-items: center; gap: 14px; }
.stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.stat-label { font-size: 12px; color: var(--muted); }
.stat-value { font-size: 22px; font-weight: 700; margin: 2px 0; }
.stat-change { font-size: 12px; font-weight: 600; }
.stat-change.up { color: #10b981; }
.stat-change.down { color: #ef4444; }

.charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
.chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; }
.chart-card h3 { font-size: 14px; margin-bottom: 16px; }
.bar-chart { display: flex; align-items: flex-end; gap: 12px; height: 180px; }
.bar { flex: 1; background: linear-gradient(to top, rgba(99,102,241,0.3), rgba(99,102,241,0.1)); border-radius: 6px 6px 0 0; position: relative; transition: 0.3s; min-width: 30px; }
.bar.active { background: linear-gradient(to top, var(--accent), rgba(99,102,241,0.5)); }
.bar:hover { background: linear-gradient(to top, var(--accent), rgba(99,102,241,0.5)); }
.bar span { position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); font-size: 11px; color: var(--muted); }
.donut-list { display: flex; flex-direction: column; gap: 14px; padding-top: 8px; }
.donut-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--muted); }
.dot { width: 10px; height: 10px; border-radius: 50%; }

.table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.table-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; }
.table-header h3 { font-size: 14px; }
.btn-sm { padding: 6px 14px; font-size: 12px; background: rgba(99,102,241,0.1); color: var(--accent); border: 1px solid rgba(99,102,241,0.2); border-radius: 6px; cursor: pointer; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 10px 20px; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--border); }
td { padding: 12px 20px; font-size: 13px; border-bottom: 1px solid var(--border); }
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar-sm { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: white; flex-shrink: 0; }
.status { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status.success { background: rgba(16,185,129,0.1); color: #10b981; }
.status.pending { background: rgba(245,158,11,0.1); color: #f59e0b; }

@media (max-width: 768px) {
  .sidebar { display: none; }
  .main { margin-left: 0; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
}`,

'/script.js': `// Simple interactivity
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// Animate stat values
document.querySelectorAll('.stat-value').forEach(el => {
  const final = el.textContent;
  el.textContent = '...';
  setTimeout(() => { el.textContent = final; }, 300);
});`
},

'ecommerce-store': {
'/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ShopVibe — Modern Store</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<header class="topbar">
  <div class="container header-inner">
    <a href="#" class="logo">🛍 ShopVibe</a>
    <nav class="main-nav">
      <a href="#">All</a>
      <a href="#">Shoes</a>
      <a href="#">Clothing</a>
      <a href="#">Accessories</a>
    </nav>
    <div class="header-right">
      <button class="icon-btn">🔍</button>
      <button class="icon-btn cart-btn" onclick="toggleCart()">🛒<span id="cart-count" class="cart-badge">0</span></button>
    </div>
  </div>
</header>

<main class="container">
  <section class="hero-banner">
    <div class="hero-text">
      <p class="hero-tag">New Collection</p>
      <h1>Summer 2024</h1>
      <p>Discover the latest trends in fashion</p>
      <button class="btn btn-primary" onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})">Shop Now</button>
    </div>
  </section>

  <section id="products">
    <div class="section-header">
      <h2>Featured Products</h2>
      <div class="filter-bar">
        <button class="filter active" onclick="filterProducts('all', this)">All</button>
        <button class="filter" onclick="filterProducts('shoes', this)">Shoes</button>
        <button class="filter" onclick="filterProducts('clothing', this)">Clothing</button>
        <button class="filter" onclick="filterProducts('accessories', this)">Accessories</button>
      </div>
    </div>
    <div class="product-grid" id="product-grid"></div>
  </section>
</main>

<div class="cart-overlay" id="cart-overlay" onclick="toggleCart()"></div>
<aside class="cart-drawer" id="cart-drawer">
  <div class="cart-header">
    <h3>Your Cart</h3>
    <button onclick="toggleCart()" class="close-btn">✕</button>
  </div>
  <div class="cart-items" id="cart-items">
    <p class="empty-cart">Your cart is empty</p>
  </div>
  <div class="cart-footer">
    <div class="cart-total">
      <span>Total</span>
      <strong id="cart-total">$0.00</strong>
    </div>
    <button class="btn btn-primary btn-full">Checkout</button>
  </div>
</aside>

<script src="script.js"></script>
</body>
</html>`,

'/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }
:root { --bg: #0a0a0a; --surface: #111; --border: #1f2937; --text: #e5e7eb; --muted: #9ca3af; --accent: #6366f1; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
a { color: inherit; text-decoration: none; }

.topbar { position: sticky; top: 0; z-index: 40; background: rgba(10,10,10,0.9); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); }
.header-inner { display: flex; align-items: center; justify-content: space-between; height: 60px; }
.logo { font-weight: 800; font-size: 18px; }
.main-nav { display: flex; gap: 24px; font-size: 14px; color: var(--muted); }
.main-nav a:hover { color: white; }
.header-right { display: flex; gap: 8px; }
.icon-btn { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 16px; color: var(--text); position: relative; }
.cart-badge { position: absolute; top: -5px; right: -5px; background: var(--accent); color: white; font-size: 10px; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }

.btn { padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; }
.btn-primary { background: var(--accent); color: white; } .btn-primary:hover { opacity: 0.9; }
.btn-full { width: 100%; }

.hero-banner { margin: 24px 0; padding: 60px 40px; background: linear-gradient(135deg, #6366f140, #06b6d420); border: 1px solid var(--border); border-radius: 16px; }
.hero-tag { font-size: 13px; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.hero-banner h1 { font-size: 42px; font-weight: 800; margin-bottom: 8px; }
.hero-banner p { color: var(--muted); margin-bottom: 20px; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin: 32px 0 20px; }
.section-header h2 { font-size: 22px; font-weight: 700; }
.filter-bar { display: flex; gap: 8px; }
.filter { padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; background: var(--surface); border: 1px solid var(--border); color: var(--muted); cursor: pointer; }
.filter.active { background: var(--accent); color: white; border-color: var(--accent); }

.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding-bottom: 48px; }
.product-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; transition: 0.3s; }
.product-card:hover { border-color: var(--accent); transform: translateY(-3px); }
.product-img { height: 200px; display: flex; align-items: center; justify-content: center; font-size: 56px; position: relative; }
.product-badge { position: absolute; top: 10px; left: 10px; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #ef4444; color: white; }
.product-body { padding: 14px; }
.product-body h3 { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.product-body .cat { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
.product-footer { display: flex; justify-content: space-between; align-items: center; padding: 0 14px 14px; }
.product-price { font-size: 18px; font-weight: 700; color: var(--accent); }
.product-price .old { font-size: 13px; color: var(--muted); text-decoration: line-through; margin-left: 6px; font-weight: 400; }
.add-btn { padding: 8px 14px; border-radius: 8px; background: var(--accent); color: white; border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.add-btn:hover { opacity: 0.85; }

.cart-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; }
.cart-overlay.open { display: block; }
.cart-drawer { position: fixed; top: 0; right: -380px; width: 380px; height: 100vh; background: var(--surface); border-left: 1px solid var(--border); z-index: 51; display: flex; flex-direction: column; transition: right 0.3s; }
.cart-drawer.open { right: 0; }
.cart-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--border); }
.cart-header h3 { font-size: 16px; }
.close-btn { background: none; border: none; color: var(--muted); font-size: 18px; cursor: pointer; }
.cart-items { flex: 1; overflow-y: auto; padding: 16px 20px; }
.empty-cart { color: var(--muted); text-align: center; padding: 40px 0; font-size: 14px; }
.cart-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.cart-item-img { width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; background: rgba(99,102,241,0.1); flex-shrink: 0; }
.cart-item-info { flex: 1; }
.cart-item-info h4 { font-size: 13px; margin-bottom: 2px; }
.cart-item-info p { font-size: 12px; color: var(--muted); }
.cart-item-price { font-size: 14px; font-weight: 700; color: var(--accent); }
.cart-footer { padding: 20px; border-top: 1px solid var(--border); }
.cart-total { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 16px; }

@media (max-width: 768px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); }
  .main-nav { display: none; }
}`,

'/script.js': `const products = [
  { id: 1, name: "Air Max Pulse", cat: "shoes", price: 149.99, sale: null, emoji: "👟", bg: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
  { id: 2, name: "Classic Hoodie", cat: "clothing", price: 79.99, sale: 59.99, emoji: "🧥", bg: "linear-gradient(135deg, #06b6d4, #3b82f6)" },
  { id: 3, name: "Leather Watch", cat: "accessories", price: 199.99, sale: null, emoji: "⌚", bg: "linear-gradient(135deg, #f59e0b, #ef4444)" },
  { id: 4, name: "Running Shoes", cat: "shoes", price: 129.99, sale: 99.99, emoji: "👟", bg: "linear-gradient(135deg, #10b981, #059669)" },
  { id: 5, name: "Denim Jacket", cat: "clothing", price: 119.99, sale: null, emoji: "🧥", bg: "linear-gradient(135deg, #8b5cf6, #ec4899)" },
  { id: 6, name: "Sunglasses", cat: "accessories", price: 89.99, sale: null, emoji: "🕶️", bg: "linear-gradient(135deg, #f97316, #eab308)" },
  { id: 7, name: "Canvas Sneakers", cat: "shoes", price: 69.99, sale: null, emoji: "👟", bg: "linear-gradient(135deg, #14b8a6, #06b6d4)" },
  { id: 8, name: "Backpack Pro", cat: "accessories", price: 149.99, sale: 119.99, emoji: "🎒", bg: "linear-gradient(135deg, #6366f1, #06b6d4)" },
];

let cart = [];

function renderProducts(filter = 'all') {
  const grid = document.getElementById('product-grid');
  const filtered = filter === 'all' ? products : products.filter(p => p.cat === filter);
  grid.innerHTML = filtered.map(p => \`
    <div class="product-card">
      <div class="product-img" style="background: \${p.bg}">\${p.sale ? '<span class="product-badge">SALE</span>' : ''}
        <span style="font-size:56px">\${p.emoji}</span>
      </div>
      <div class="product-body">
        <p class="cat">\${p.cat}</p>
        <h3>\${p.name}</h3>
      </div>
      <div class="product-footer">
        <span class="product-price">$\${(p.sale || p.price).toFixed(2)}\${p.sale ? '<span class="old">$' + p.price.toFixed(2) + '</span>' : ''}</span>
        <button class="add-btn" onclick="addToCart(\${p.id})">Add +</button>
      </div>
    </div>
  \`).join('');
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty: 1 });
  updateCart();
}

function updateCart() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + (c.sale || c.price) * c.qty, 0);
  document.getElementById('cart-count').textContent = count;
  document.getElementById('cart-total').textContent = '$' + total.toFixed(2);
  const items = document.getElementById('cart-items');
  if (cart.length === 0) {
    items.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
  } else {
    items.innerHTML = cart.map(c => \`
      <div class="cart-item">
        <div class="cart-item-img">\${c.emoji}</div>
        <div class="cart-item-info">
          <h4>\${c.name}</h4>
          <p>Qty: \${c.qty}</p>
        </div>
        <span class="cart-item-price">$\${((c.sale || c.price) * c.qty).toFixed(2)}</span>
      </div>
    \`).join('');
  }
}

function toggleCart() {
  document.getElementById('cart-drawer').classList.toggle('open');
  document.getElementById('cart-overlay').classList.toggle('open');
}

function filterProducts(cat, btn) {
  document.querySelectorAll('.filter').forEach(f => f.classList.remove('active'));
  btn.classList.add('active');
  renderProducts(cat);
}

renderProducts();`
},

'html-game': {
'/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Space Shooter</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0a0a; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: -apple-system, sans-serif; }
canvas { border: 1px solid #1f2937; border-radius: 8px; }
#ui { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 24px; color: #e5e7eb; font-size: 14px; font-weight: 600; }
#start-screen { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 16px; color: #e5e7eb; }
#start-screen h1 { font-size: 36px; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
#start-screen p { color: #9ca3af; font-size: 14px; }
#start-btn { padding: 12px 32px; background: #6366f1; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; }
#start-btn:hover { background: #4f46e5; }
#game-over { display: none; position: absolute; flex-direction: column; align-items: center; gap: 12px; color: #e5e7eb; }
#game-over h2 { font-size: 28px; color: #ef4444; }
</style>
</head>
<body>
<div id="ui" style="display:none">
  <span>Score: <span id="score">0</span></span>
  <span>Lives: <span id="lives">3</span></span>
</div>
<div id="start-screen">
  <h1>🚀 Space Shooter</h1>
  <p>Arrow keys to move · Space to shoot</p>
  <button id="start-btn" onclick="startGame()">Play</button>
</div>
<div id="game-over">
  <h2>Game Over</h2>
  <p>Final Score: <span id="final-score">0</span></p>
  <button id="start-btn" onclick="startGame()">Play Again</button>
</div>
<canvas id="canvas" width="600" height="700"></canvas>
<script src="game.js"></script>
</body>
</html>`,

'/game.js': `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let gameRunning = false;
let score = 0;
let lives = 3;
let player, bullets, enemies, particles, stars;
let keys = {};
let spawnTimer = 0;

function initGame() {
  score = 0; lives = 3;
  player = { x: 300, y: 620, w: 40, h: 30, speed: 5, color: '#6366f1' };
  bullets = []; enemies = []; particles = [];
  stars = Array.from({length: 80}, () => ({
    x: Math.random() * 600, y: Math.random() * 700,
    speed: 0.5 + Math.random() * 2, size: Math.random() * 2
  }));
  spawnTimer = 0;
  document.getElementById('score').textContent = '0';
  document.getElementById('lives').textContent = '3';
}

function startGame() {
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('game-over').style.display = 'none';
  document.getElementById('ui').style.display = 'flex';
  initGame();
  gameRunning = true;
  requestAnimationFrame(loop);
}

function gameOver() {
  gameRunning = false;
  document.getElementById('game-over').style.display = 'flex';
  document.getElementById('final-score').textContent = score;
  document.getElementById('ui').style.display = 'none';
}

document.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === ' ') e.preventDefault(); });
document.addEventListener('keyup', e => { keys[e.key] = false; });

function shoot() {
  bullets.push({ x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 12, speed: 7, color: '#06b6d4' });
}

let shootCooldown = 0;
function update() {
  // Move player
  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x < 600 - player.w) player.x += player.speed;
  if (keys['ArrowUp'] && player.y > 400) player.y -= player.speed;
  if (keys['ArrowDown'] && player.y < 670) player.y += player.speed;

  // Shoot
  shootCooldown--;
  if (keys[' '] && shootCooldown <= 0) { shoot(); shootCooldown = 12; }

  // Move stars
  stars.forEach(s => { s.y += s.speed; if (s.y > 700) { s.y = 0; s.x = Math.random() * 600; } });

  // Move bullets
  bullets.forEach(b => b.y -= b.speed);
  bullets = bullets.filter(b => b.y > -20);

  // Spawn enemies
  spawnTimer++;
  const spawnRate = Math.max(30, 80 - Math.floor(score / 5));
  if (spawnTimer >= spawnRate) {
    spawnTimer = 0;
    const w = 30 + Math.random() * 20;
    enemies.push({
      x: Math.random() * (600 - w), y: -40, w, h: 30,
      speed: 1.5 + Math.random() * 2 + score * 0.02,
      color: ['#ef4444','#f59e0b','#ec4899','#8b5cf6'][Math.floor(Math.random()*4)]
    });
  }

  // Move enemies
  enemies.forEach(e => e.y += e.speed);

  // Collision: bullet vs enemy
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (collides(bullets[i], enemies[j])) {
        // Particles
        for (let k = 0; k < 8; k++) {
          particles.push({
            x: enemies[j].x + enemies[j].w/2,
            y: enemies[j].y + enemies[j].h/2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 20, color: enemies[j].color
          });
        }
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score++;
        document.getElementById('score').textContent = score;
        break;
      }
    }
  }

  // Collision: enemy vs player
  for (let j = enemies.length - 1; j >= 0; j--) {
    if (collides(player, enemies[j])) {
      enemies.splice(j, 1);
      lives--;
      document.getElementById('lives').textContent = lives;
      if (lives <= 0) gameOver();
    }
    if (enemies[j] && enemies[j].y > 720) {
      enemies.splice(j, 1);
    }
  }

  // Particles
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
  particles = particles.filter(p => p.life > 0);
}

function collides(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function draw() {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 600, 700);

  // Stars
  stars.forEach(s => {
    ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + s.size * 0.3) + ')';
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });

  // Player (triangle ship)
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.moveTo(player.x + player.w/2, player.y);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();
  // Engine glow
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.moveTo(player.x + 12, player.y + player.h);
  ctx.lineTo(player.x + player.w/2, player.y + player.h + 8 + Math.random() * 4);
  ctx.lineTo(player.x + player.w - 12, player.y + player.h);
  ctx.closePath();
  ctx.fill();

  // Bullets
  bullets.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.shadowBlur = 6; ctx.shadowColor = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.shadowBlur = 0;
  });

  // Enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x, e.y, e.w, e.h);
  });

  // Particles
  particles.forEach(p => {
    ctx.globalAlpha = p.life / 20;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  });
}

function loop() {
  if (!gameRunning) return;
  update();
  draw();
  requestAnimationFrame(loop);
}`
},

// ═══════════════════════════════════════════════════════════════
// React Templates
// ═══════════════════════════════════════════════════════════════

'react-dashboard': {
'/App.tsx': `import React, { useState } from 'react';

const stats = [
  { label: 'Revenue', value: '$48,250', change: '+12.5%', icon: '📈', up: true },
  { label: 'Users', value: '2,420', change: '+8.1%', icon: '👥', up: true },
  { label: 'Orders', value: '1,210', change: '+3.2%', icon: '🛒', up: true },
  { label: 'Conversion', value: '3.6%', change: '-0.4%', icon: '⚡', up: false },
];

const activities = [
  { user: 'JD', name: 'John Doe', action: 'Purchased Pro Plan', time: '2 min ago', status: 'Completed' },
  { user: 'SK', name: 'Sarah Kim', action: 'Signed up', time: '15 min ago', status: 'Completed' },
  { user: 'MJ', name: 'Mike Johnson', action: 'Submitted ticket', time: '1 hr ago', status: 'Pending' },
  { user: 'AL', name: 'Amy Lee', action: 'Upgraded plan', time: '3 hr ago', status: 'Completed' },
];

const navItems = [
  { icon: '📈', label: 'Dashboard' },
  { icon: '👥', label: 'Users' },
  { icon: '📦', label: 'Products' },
  { icon: '💰', label: 'Revenue' },
  { icon: '⚙️', label: 'Settings' },
];

export default function App() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#e5e7eb', fontFamily: '-apple-system, sans-serif' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <aside style={{ width: 220, background: '#111', borderRight: '1px solid #1f2937', padding: '20px 0', flexShrink: 0 }}>
          <div style={{ padding: '0 20px 20px', fontWeight: 800, fontSize: 16, borderBottom: '1px solid #1f2937' }}>📊 Analytics</div>
          <nav style={{ padding: '12px 0' }}>
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => setActiveNav(item.label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 20px', fontSize: 14, border: 'none', cursor: 'pointer',
                  background: activeNav === item.label ? 'rgba(99,102,241,0.08)' : 'transparent',
                  color: activeNav === item.label ? '#6366f1' : '#9ca3af',
                  borderRight: activeNav === item.label ? '2px solid #6366f1' : 'none',
                }}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
        </aside>
      )}

      {/* Main */}
      <main style={{ flex: 1, padding: 24 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Welcome back, Admin</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '8px 12px', background: '#111', border: '1px solid #1f2937', borderRadius: 8, color: '#e5e7eb', cursor: 'pointer' }}>☰</button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>A</div>
          </div>
        </header>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: '#111', border: '1px solid #1f2937', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: 12, color: '#9ca3af' }}>{s.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: s.up ? '#10b981' : '#ef4444' }}>{s.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Table */}
        <div style={{ background: '#111', border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14 }}>Recent Activity</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['User', 'Action', 'Time', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 12, color: '#9ca3af', borderBottom: '1px solid #1f2937' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((a, i) => (
                <tr key={i}>
                  <td style={{ padding: '12px 20px', fontSize: 13, borderBottom: '1px solid #1f2937' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{a.user}</div>
                      {a.name}
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, borderBottom: '1px solid #1f2937' }}>{a.action}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, borderBottom: '1px solid #1f2937', color: '#9ca3af' }}>{a.time}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, borderBottom: '1px solid #1f2937' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: a.status === 'Completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: a.status === 'Completed' ? '#10b981' : '#f59e0b' }}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}`,
'/index.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);`,
'/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }`,
},

'react-todo': {
'/App.tsx': `import React, { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type Filter = 'all' | 'active' | 'completed';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try { return JSON.parse(localStorage.getItem('todos') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => { localStorage.setItem('todos', JSON.stringify(todos)); }, [todos]);

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input.trim(), completed: false }]);
    setInput('');
  };

  const toggleTodo = (id: number) => setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTodo = (id: number) => setTodos(todos.filter(t => t.id !== id));
  const startEdit = (t: Todo) => { setEditId(t.id); setEditText(t.text); };
  const saveEdit = () => { if (editText.trim()) setTodos(todos.map(t => t.id === editId ? { ...t, text: editText.trim() } : t)); setEditId(null); };

  const filtered = todos.filter(t => filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed);
  const remaining = todos.filter(t => !t.completed).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e7eb', fontFamily: '-apple-system, sans-serif', display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: '100%', maxWidth: 520, padding: '0 20px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>✅ Todos</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>{remaining} item{remaining !== 1 ? 's' : ''} remaining</p>

        {/* Input */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            placeholder="What needs to be done?"
            style={{ flex: 1, padding: '12px 16px', background: '#111', border: '1px solid #1f2937', borderRadius: 10, color: '#e5e7eb', fontSize: 14, outline: 'none' }}
          />
          <button onClick={addTodo} style={{ padding: '12px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Add</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['all', 'active', 'completed'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === f ? '#6366f1' : '#111', color: filter === f ? 'white' : '#9ca3af' }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#6b7280', padding: 32, fontSize: 14 }}>No todos</p>}
          {filtered.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#111', border: '1px solid #1f2937', borderRadius: 12, transition: '0.2s' }}>
              <button onClick={() => toggleTodo(t.id)} style={{ width: 22, height: 22, borderRadius: 6, border: t.completed ? 'none' : '2px solid #374151', background: t.completed ? '#6366f1' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, flexShrink: 0 }}>
                {t.completed && '✓'}
              </button>
              {editId === t.id ? (
                <input value={editText} onChange={e => setEditText(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus style={{ flex: 1, background: 'transparent', border: 'none', color: '#e5e7eb', fontSize: 14, outline: 'none' }} />
              ) : (
                <span onDoubleClick={() => startEdit(t)} style={{ flex: 1, fontSize: 14, textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#6b7280' : '#e5e7eb', cursor: 'pointer' }}>{t.text}</span>
              )}
              <button onClick={() => deleteTodo(t.id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
'/index.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);`,
'/styles.css': `* { margin: 0; padding: 0; box-sizing: border-box; }`,
},

// ═══════════════════════════════════════════════════════════════
// Python Templates
// ═══════════════════════════════════════════════════════════════

'python-api': {
'/main.py': `"""FastAPI User Management API"""
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

app = FastAPI(title="User Management API", version="1.0.0")

# In-memory store
users_db: dict = {}

# Models
class UserCreate(BaseModel):
    name: str
    email: str
    role: str = "user"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class User(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str

# Routes
@app.get("/")
def root():
    return {"message": "User Management API", "version": "1.0.0"}

@app.get("/api/users")
def list_users():
    return {"users": list(users_db.values()), "total": len(users_db)}

@app.post("/api/users", status_code=201)
def create_user(data: UserCreate):
    user_id = str(uuid.uuid4())[:8]
    user = User(
        id=user_id,
        name=data.name,
        email=data.email,
        role=data.role,
        created_at=datetime.now().isoformat()
    )
    users_db[user_id] = user.dict()
    return {"user": user.dict(), "message": "User created"}

@app.get("/api/users/{user_id}")
def get_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": users_db[user_id]}

@app.put("/api/users/{user_id}")
def update_user(user_id: str, data: UserUpdate):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    user = users_db[user_id]
    if data.name: user["name"] = data.name
    if data.email: user["email"] = data.email
    if data.role: user["role"] = data.role
    return {"user": user, "message": "User updated"}

@app.delete("/api/users/{user_id}")
def delete_user(user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    del users_db[user_id]
    return {"message": "User deleted"}

@app.get("/health")
def health():
    return {"status": "healthy", "users_count": len(users_db)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`,
'/requirements.txt': `fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
`,
'/README.md': `# User Management API

FastAPI-based REST API for managing users.

## Run
\`\`\`bash
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`

## Endpoints
- GET /api/users — List all users
- POST /api/users — Create user
- GET /api/users/:id — Get user
- PUT /api/users/:id — Update user
- DELETE /api/users/:id — Delete user
`,
},

'python-scraper': {
'/scraper.py': `"""Web Scraper — Extracts data from web pages"""
import requests
from bs4 import BeautifulSoup
import csv
import json
import time
from typing import List, Dict
from urllib.parse import urljoin

class WebScraper:
    def __init__(self, base_url: str, delay: float = 1.0):
        self.base_url = base_url
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (compatible; DataScraper/1.0)"
        })
        self.results: List[Dict] = []

    def fetch_page(self, url: str) -> BeautifulSoup:
        """Fetch and parse a single page."""
        print(f"Fetching: {url}")
        response = self.session.get(url, timeout=10)
        response.raise_for_status()
        time.sleep(self.delay)
        return BeautifulSoup(response.text, "html.parser")

    def extract_links(self, soup: BeautifulSoup) -> List[str]:
        """Extract all links from a page."""
        links = []
        for a in soup.find_all("a", href=True):
            href = urljoin(self.base_url, a["href"])
            links.append(href)
        return links

    def extract_data(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract structured data from the page."""
        items = []
        # Example: extract article titles and summaries
        for article in soup.find_all("article"):
            title = article.find(["h1", "h2", "h3"])
            summary = article.find("p")
            link = article.find("a", href=True)
            items.append({
                "title": title.get_text(strip=True) if title else "N/A",
                "summary": summary.get_text(strip=True) if summary else "N/A",
                "link": urljoin(self.base_url, link["href"]) if link else "N/A",
            })
        return items

    def scrape(self, path: str = "/") -> List[Dict]:
        """Main scrape method."""
        url = urljoin(self.base_url, path)
        soup = self.fetch_page(url)
        self.results = self.extract_data(soup)
        print(f"Extracted {len(self.results)} items")
        return self.results

    def save_csv(self, filename: str = "output.csv"):
        """Save results to CSV."""
        if not self.results:
            print("No results to save")
            return
        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.results[0].keys())
            writer.writeheader()
            writer.writerows(self.results)
        print(f"Saved {len(self.results)} rows to {filename}")

    def save_json(self, filename: str = "output.json"):
        """Save results to JSON."""
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        print(f"Saved to {filename}")


if __name__ == "__main__":
    # Example usage
    scraper = WebScraper("https://example.com")
    data = scraper.scrape("/")
    for item in data:
        print(f"  - {item['title']}")
    scraper.save_csv()
    scraper.save_json()
`,
'/requirements.txt': `requests==2.31.0
beautifulsoup4==4.12.2
`,
},

'python-ml': {
'/pipeline.py': `"""Machine Learning Pipeline with scikit-learn"""
import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

def load_data():
    """Load and return dataset."""
    data = load_iris()
    print(f"Dataset: {data.target_names}")
    print(f"Features: {data.feature_names}")
    print(f"Samples: {len(data.data)}")
    return data.data, data.target, data.target_names, data.feature_names

def preprocess(X, y, test_size=0.2):
    """Split and scale data."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    print(f"Train: {len(X_train)}, Test: {len(X_test)}")
    return X_train, X_test, y_train, y_test, scaler

def train_model(X_train, y_train):
    """Train Random Forest classifier."""
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        random_state=42
    )
    model.fit(X_train, y_train)
    return model

def evaluate(model, X_test, y_test, target_names):
    """Evaluate model performance."""
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\\nAccuracy: {acc:.4f}")
    print(f"\\nClassification Report:\\n{classification_report(y_test, y_pred, target_names=target_names)}")
    print(f"Confusion Matrix:\\n{confusion_matrix(y_test, y_pred)}")
    return acc

def predict(model, scaler, features):
    """Make a prediction on new data."""
    scaled = scaler.transform([features])
    prediction = model.predict(scaled)
    probability = model.predict_proba(scaled)
    return prediction[0], probability[0]

if __name__ == "__main__":
    print("=" * 50)
    print("ML Pipeline — Iris Classification")
    print("=" * 50)

    # Pipeline
    X, y, target_names, feature_names = load_data()
    X_train, X_test, y_train, y_test, scaler = preprocess(X, y)
    model = train_model(X_train, y_train)
    evaluate(model, X_test, y_test, target_names)

    # Feature importance
    print("\\nFeature Importance:")
    for name, imp in sorted(zip(feature_names, model.feature_importances_), key=lambda x: -x[1]):
        print(f"  {name}: {imp:.4f}")

    # Sample prediction
    sample = [5.1, 3.5, 1.4, 0.2]
    pred, prob = predict(model, scaler, sample)
    print(f"\\nSample prediction: {target_names[pred]} (confidence: {max(prob):.2%})")
`,
'/requirements.txt': `scikit-learn==1.3.2
numpy==1.26.2
`,
},

// ═══════════════════════════════════════════════════════════════
// Express / Node.js Templates
// ═══════════════════════════════════════════════════════════════

'express-api': {
'/index.js': `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory store
let users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user' },
];
let nextId = 3;

// Logger middleware
app.use((req, res, next) => {
  console.log(\`\${new Date().toISOString()} \${req.method} \${req.path}\`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Express REST API', version: '1.0.0' });
});

app.get('/api/users', (req, res) => {
  const { role, search } = req.query;
  let result = users;
  if (role) result = result.filter(u => u.role === role);
  if (search) result = result.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );
  res.json({ users: result, total: result.length });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.post('/api/users', (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const user = { id: nextId++, name, email, role: role || 'user' };
  users.push(user);
  res.status(201).json({ user, message: 'User created' });
});

app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { name, email, role } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  res.json({ user, message: 'User updated' });
});

app.delete('/api/users/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(idx, 1);
  res.json({ message: 'User deleted' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`,
'/package.json': `{
  "name": "express-rest-api",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}`,
'/README.md': `# Express REST API

## Run
\`\`\`bash
npm install && npm run dev
\`\`\`

## Endpoints
- GET /api/users — List users (query: ?role=admin&search=alice)
- POST /api/users — Create user
- GET /api/users/:id — Get user
- PUT /api/users/:id — Update user
- DELETE /api/users/:id — Delete user
`,
},

// ═══════════════════════════════════════════════════════════════
// Go Templates
// ═══════════════════════════════════════════════════════════════

'go-api': {
'/main.go': `package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Task struct {
	ID        int       \`json:"id"\`
	Title     string    \`json:"title"\`
	Done      bool      \`json:"done"\`
	CreatedAt time.Time \`json:"created_at"\`
}

var (
	tasks  = []Task{}
	nextID = 1
	mu     sync.Mutex
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", handleRoot)
	mux.HandleFunc("/api/tasks", handleTasks)
	mux.HandleFunc("/api/tasks/", handleTaskByID)
	mux.HandleFunc("/health", handleHealth)

	handler := corsMiddleware(loggerMiddleware(mux))
	fmt.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	jsonResp(w, 200, map[string]string{"message": "Go REST API", "version": "1.0.0"})
}

func handleTasks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		mu.Lock()
		defer mu.Unlock()
		jsonResp(w, 200, map[string]interface{}{"tasks": tasks, "total": len(tasks)})
	case "POST":
		var input struct{ Title string \`json:"title"\` }
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil || input.Title == "" {
			jsonResp(w, 400, map[string]string{"error": "Title required"})
			return
		}
		mu.Lock()
		task := Task{ID: nextID, Title: input.Title, Done: false, CreatedAt: time.Now()}
		nextID++
		tasks = append(tasks, task)
		mu.Unlock()
		jsonResp(w, 201, map[string]interface{}{"task": task})
	default:
		jsonResp(w, 405, map[string]string{"error": "Method not allowed"})
	}
}

func handleTaskByID(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/tasks/"), "/")
	id, err := strconv.Atoi(parts[0])
	if err != nil {
		jsonResp(w, 400, map[string]string{"error": "Invalid ID"})
		return
	}

	mu.Lock()
	defer mu.Unlock()
	idx := -1
	for i, t := range tasks {
		if t.ID == id { idx = i; break }
	}
	if idx == -1 {
		jsonResp(w, 404, map[string]string{"error": "Task not found"})
		return
	}

	switch r.Method {
	case "GET":
		jsonResp(w, 200, map[string]interface{}{"task": tasks[idx]})
	case "PUT":
		var input struct {
			Title *string \`json:"title"\`
			Done  *bool   \`json:"done"\`
		}
		json.NewDecoder(r.Body).Decode(&input)
		if input.Title != nil { tasks[idx].Title = *input.Title }
		if input.Done != nil { tasks[idx].Done = *input.Done }
		jsonResp(w, 200, map[string]interface{}{"task": tasks[idx]})
	case "DELETE":
		tasks = append(tasks[:idx], tasks[idx+1:]...)
		jsonResp(w, 200, map[string]string{"message": "Deleted"})
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	jsonResp(w, 200, map[string]string{"status": "healthy"})
}

func jsonResp(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func loggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" { w.WriteHeader(204); return }
		next.ServeHTTP(w, r)
	})
}
`,
'/go.mod': `module go-rest-api

go 1.21
`,
},

// ═══════════════════════════════════════════════════════════════
// Rust Templates
// ═══════════════════════════════════════════════════════════════

'rust-cli': {
'/src/main.rs': `use std::env;
use std::fs;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        print_help();
        process::exit(0);
    }

    match args[1].as_str() {
        "count" => cmd_count(&args[2..]),
        "search" => cmd_search(&args[2..]),
        "info" => cmd_info(&args[2..]),
        "help" | "--help" | "-h" => print_help(),
        _ => {
            eprintln!("Unknown command: {}", args[1]);
            print_help();
            process::exit(1);
        }
    }
}

fn cmd_count(args: &[String]) {
    if args.is_empty() {
        eprintln!("Usage: cli count <file>");
        process::exit(1);
    }
    match fs::read_to_string(&args[0]) {
        Ok(content) => {
            let lines = content.lines().count();
            let words = content.split_whitespace().count();
            let chars = content.chars().count();
            println!("File: {}", args[0]);
            println!("  Lines: {}", lines);
            println!("  Words: {}", words);
            println!("  Chars: {}", chars);
        }
        Err(e) => eprintln!("Error reading file: {}", e),
    }
}

fn cmd_search(args: &[String]) {
    if args.len() < 2 {
        eprintln!("Usage: cli search <pattern> <file>");
        process::exit(1);
    }
    let pattern = &args[0];
    let filename = &args[1];
    match fs::read_to_string(filename) {
        Ok(content) => {
            let mut found = 0;
            for (i, line) in content.lines().enumerate() {
                if line.contains(pattern.as_str()) {
                    println!("{}:{}: {}", filename, i + 1, line.trim());
                    found += 1;
                }
            }
            println!("\\n{} matches found", found);
        }
        Err(e) => eprintln!("Error: {}", e),
    }
}

fn cmd_info(args: &[String]) {
    if args.is_empty() {
        eprintln!("Usage: cli info <file>");
        process::exit(1);
    }
    match fs::metadata(&args[0]) {
        Ok(meta) => {
            println!("File: {}", args[0]);
            println!("  Size: {} bytes", meta.len());
            println!("  Is dir: {}", meta.is_dir());
            println!("  Readonly: {}", meta.permissions().readonly());
        }
        Err(e) => eprintln!("Error: {}", e),
    }
}

fn print_help() {
    println!("Rust CLI Tool v1.0.0");
    println!();
    println!("USAGE: cli <command> [args]");
    println!();
    println!("COMMANDS:");
    println!("  count <file>           Count lines, words, chars");
    println!("  search <pattern> <file> Search for pattern in file");
    println!("  info <file>            Show file information");
    println!("  help                   Show this help");
}
`,
'/Cargo.toml': `[package]
name = "rust-cli"
version = "1.0.0"
edition = "2021"
`,
},

// ═══════════════════════════════════════════════════════════════
// Java Templates
// ═══════════════════════════════════════════════════════════════

'java-api': {
'/Main.java': `import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;
import com.sun.net.httpserver.*;

public class Main {
    static Map<Integer, Map<String, String>> users = new ConcurrentHashMap<>();
    static int nextId = 1;

    public static void main(String[] args) throws Exception {
        // Seed data
        addUser("Alice Johnson", "alice@example.com", "admin");
        addUser("Bob Smith", "bob@example.com", "user");

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/", Main::handleRoot);
        server.createContext("/api/users", Main::handleUsers);
        server.createContext("/health", Main::handleHealth);
        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();
        System.out.println("Server running on http://localhost:8080");
    }

    static void handleRoot(HttpExchange ex) throws IOException {
        sendJson(ex, 200, "{\\"message\\":\\"Java REST API\\",\\"version\\":\\"1.0.0\\"}");
    }

    static void handleUsers(HttpExchange ex) throws IOException {
        String method = ex.getRequestMethod();
        String path = ex.getRequestURI().getPath();

        if (path.equals("/api/users")) {
            if ("GET".equals(method)) {
                StringBuilder sb = new StringBuilder("[");
                int i = 0;
                for (Map<String, String> u : users.values()) {
                    if (i++ > 0) sb.append(",");
                    sb.append(userJson(u));
                }
                sb.append("]");
                sendJson(ex, 200, "{\\"users\\":" + sb + ",\\"total\\":" + users.size() + "}");
            } else if ("POST".equals(method)) {
                String body = new String(ex.getRequestBody().readAllBytes());
                String name = extract(body, "name");
                String email = extract(body, "email");
                if (name == null || email == null) {
                    sendJson(ex, 400, "{\\"error\\":\\"Name and email required\\"}");
                    return;
                }
                Map<String, String> user = addUser(name, email, "user");
                sendJson(ex, 201, "{\\"user\\":" + userJson(user) + "}");
            }
        } else {
            // /api/users/{id}
            try {
                int id = Integer.parseInt(path.replace("/api/users/", ""));
                if (!users.containsKey(id)) {
                    sendJson(ex, 404, "{\\"error\\":\\"Not found\\"}");
                    return;
                }
                if ("GET".equals(method)) {
                    sendJson(ex, 200, "{\\"user\\":" + userJson(users.get(id)) + "}");
                } else if ("DELETE".equals(method)) {
                    users.remove(id);
                    sendJson(ex, 200, "{\\"message\\":\\"Deleted\\"}");
                }
            } catch (NumberFormatException e) {
                sendJson(ex, 400, "{\\"error\\":\\"Invalid ID\\"}");
            }
        }
    }

    static void handleHealth(HttpExchange ex) throws IOException {
        sendJson(ex, 200, "{\\"status\\":\\"healthy\\"}");
    }

    static Map<String, String> addUser(String name, String email, String role) {
        Map<String, String> user = new HashMap<>();
        int id = nextId++;
        user.put("id", String.valueOf(id));
        user.put("name", name);
        user.put("email", email);
        user.put("role", role);
        users.put(id, user);
        return user;
    }

    static String userJson(Map<String, String> u) {
        return String.format("{\\"id\\":%s,\\"name\\":\\"%s\\",\\"email\\":\\"%s\\",\\"role\\":\\"%s\\"}",
            u.get("id"), u.get("name"), u.get("email"), u.get("role"));
    }

    static String extract(String json, String key) {
        int i = json.indexOf("\\"" + key + "\\"");
        if (i == -1) return null;
        int start = json.indexOf("\\"", i + key.length() + 2) + 1;
        int end = json.indexOf("\\"", start);
        return json.substring(start, end);
    }

    static void sendJson(HttpExchange ex, int code, String body) throws IOException {
        byte[] bytes = body.getBytes();
        ex.getResponseHeaders().set("Content-Type", "application/json");
        ex.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        ex.sendResponseHeaders(code, bytes.length);
        ex.getResponseBody().write(bytes);
        ex.getResponseBody().close();
    }
}
`,
},

// ═══════════════════════════════════════════════════════════════
// SQL / Database Templates
// ═══════════════════════════════════════════════════════════════

'sql-schema': {
'/schema.sql': `-- E-Commerce Database Schema
-- PostgreSQL

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES categories(id)
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2),
    sku VARCHAR(50) UNIQUE,
    stock INTEGER DEFAULT 0,
    category_id INTEGER REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    is_default BOOLEAN DEFAULT false
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    address_id INTEGER REFERENCES addresses(id),
    status VARCHAR(20) DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- Sample data
INSERT INTO categories (name, slug) VALUES
('Electronics', 'electronics'),
('Clothing', 'clothing'),
('Books', 'books');

INSERT INTO users (email, name, password_hash, role) VALUES
('admin@shop.com', 'Admin', 'hashed_pw', 'admin'),
('user@shop.com', 'Jane Doe', 'hashed_pw', 'customer');
`,
},

// ═══════════════════════════════════════════════════════════════
// Bash Templates
// ═══════════════════════════════════════════════════════════════

'bash-deploy': {
'/deploy.sh': `#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────
# Deployment Script
# ──────────────────────────────────────

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m'

ENV="staging"
BRANCH="main"
APP_DIR="/opt/app"
BACKUP_DIR="/opt/backups"

log() { echo -e "\${BLUE}[$(date '+%H:%M:%S')]\${NC} $1"; }
success() { echo -e "\${GREEN}✓\${NC} $1"; }
warn() { echo -e "\${YELLOW}!\${NC} $1"; }
error() { echo -e "\${RED}✗\${NC} $1"; exit 1; }

# Parse args
while [[ \$# -gt 0 ]]; do
  case \$1 in
    -e|--env) ENV="\$2"; shift 2 ;;
    -b|--branch) BRANCH="\$2"; shift 2 ;;
    -h|--help) echo "Usage: deploy.sh [-e staging|production] [-b branch]"; exit 0 ;;
    *) error "Unknown option: \$1" ;;
  esac
done

log "Deploying to \${YELLOW}\${ENV}\${NC} from branch \${YELLOW}\${BRANCH}\${NC}"

# Pre-checks
log "Running pre-deployment checks..."
command -v git >/dev/null || error "git not found"
command -v node >/dev/null || error "node not found"

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
[[ \$DISK_USAGE -gt 90 ]] && error "Disk usage too high: \${DISK_USAGE}%"
success "Pre-checks passed (disk: \${DISK_USAGE}%)"

# Backup
log "Creating backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "\$BACKUP_DIR"
if [[ -d "\$APP_DIR" ]]; then
  tar -czf "\$BACKUP_DIR/backup_\$TIMESTAMP.tar.gz" -C "\$APP_DIR" . 2>/dev/null || warn "Backup skipped"
  success "Backup: backup_\$TIMESTAMP.tar.gz"
fi

# Pull & Build
log "Pulling latest code..."
cd "\$APP_DIR"
git fetch origin
git checkout "\$BRANCH"
git pull origin "\$BRANCH"
success "Code updated"

log "Installing dependencies..."
npm ci --production
success "Dependencies installed"

log "Building..."
npm run build
success "Build complete"

# Restart
log "Restarting services..."
if command -v pm2 >/dev/null; then
  pm2 restart all
else
  warn "pm2 not found, using systemctl"
  sudo systemctl restart app
fi

# Health check
log "Running health check..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
if [[ "\$HTTP_CODE" == "200" ]]; then
  success "Health check passed (HTTP \$HTTP_CODE)"
else
  warn "Health check failed (HTTP \$HTTP_CODE) — rolling back"
  if [[ -f "\$BACKUP_DIR/backup_\$TIMESTAMP.tar.gz" ]]; then
    tar -xzf "\$BACKUP_DIR/backup_\$TIMESTAMP.tar.gz" -C "\$APP_DIR"
    pm2 restart all 2>/dev/null || sudo systemctl restart app
    error "Rolled back to previous version"
  fi
fi

echo ""
success "Deployment to \${ENV} completed successfully! 🚀"
`,
},

// ═══════════════════════════════════════════════════════════════
// Docker Templates
// ═══════════════════════════════════════════════════════════════

'docker-node': {
'/Dockerfile': `# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json .

USER appuser
EXPOSE 3000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \\
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
`,
'/docker-compose.yml': `version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/appdb
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: appdb
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
`,
'/.dockerignore': `node_modules
dist
.git
.env
*.md
`,
},

}; // end of TEMPLATE_FILES
