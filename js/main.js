/**
 * Maya Chen Portfolio — Main Application Coordinator
 */

import { soundManager } from './sound.js';
import { ParticleEngine, initCounters, initScrollReveal } from './animations.js';

// Project details database for rich case study modals
const PROJECTS_DATA = {
  nexus: {
    title: 'NexusAI Orchestrator',
    category: 'Full-Stack AI Systems · Distributed Agents',
    year: '2025',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85',
    description: 'An enterprise-grade LLM orchestrator and distributed agent evaluation engine. Built to coordinate multi-agent reasoning loops, deterministic tool validation, and sub-second streaming inference across hybrid cloud clusters.',
    metrics: ['Sub-180ms TTFT streaming latency', '100k+ concurrent agent sessions', '99.99% fault tolerance'],
    tech: ['TypeScript', 'Rust Core', 'FastAPI', 'Redis Streams', 'PostgreSQL', 'Docker/K8s'],
    githubUrl: 'https://github.com/mayachen-dev/nexus-ai-orchestrator',
    liveUrl: 'https://nexus-ai.demo.internal'
  },
  aether: {
    title: 'Aether Distributed DB',
    category: 'Cloud Infrastructure · High-Scale Storage',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85',
    description: 'A globally replicated, partition-tolerant key-value engine with Raft-consensus synchronization and zero-downtime shard rebalancing. Designed for ultra-high throughput telemetry ingestion and edge cache invalidation.',
    metrics: ['4.2M writes/sec peak throughput', '<3ms global read propagation', 'Zero data corruption SLA'],
    tech: ['Go', 'Raft Consensus', 'gRPC', 'RocksDB', 'Prometheus', 'eBPF'],
    githubUrl: 'https://github.com/mayachen-dev/aether-distributed-db',
    liveUrl: 'https://aether-storage.demo.internal'
  },
  synapse: {
    title: 'Synapse Vision Analytics',
    category: 'Computer Vision · Edge Streaming Pipeline',
    year: '2024',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=85',
    description: 'Real-time computer vision inference engine for automated manufacturing quality assurance. Deploys quantized neural models directly to edge gateways, delivering instantaneous anomaly classification and live telemetry dashboards.',
    metrics: ['60 FPS real-time 4K inference', '99.8% precision defect detection', 'Offline-first edge resilience'],
    tech: ['Python', 'TensorRT', 'WebSockets', 'React', 'TailwindCSS', 'WebRTC'],
    githubUrl: 'https://github.com/mayachen-dev/synapse-vision-analytics',
    liveUrl: 'https://synapse-vision.demo.internal'
  },
  omniscale: {
    title: 'OmniScale Cloud Mesh',
    category: 'Networking & Security · Zero-Trust Routing',
    year: '2023',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=85',
    description: 'Zero-trust microservice communication mesh and intelligent load director with automated mutual TLS, dynamic rate limiting, and real-time distributed tracing visualizations.',
    metrics: ['Handles 120,000 requests/sec', '0.4ms proxy overhead', 'Automated mTLS certificate rotation'],
    tech: ['Rust', 'Envoy Proxy', 'GraphQL', 'Kubernetes', 'OpenTelemetry', 'Jaeger'],
    githubUrl: 'https://github.com/mayachen-dev/omniscale-cloud-mesh',
    liveUrl: 'https://omniscale-mesh.demo.internal'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Particle Background
  new ParticleEngine('particle-canvas');

  // 2. Setup Gateway Modal Flow
  const gatewayModal = document.getElementById('gateway-modal');
  const mainWrapper = document.getElementById('main-wrapper');
  const btnEnterSound = document.getElementById('btn-enter-sound');
  const btnEnterMuted = document.getElementById('btn-enter-muted');

  function exitGateway(withSound) {
    if (withSound) {
      soundManager.enterWithSound();
    } else {
      soundManager.enterMuted();
    }

    if (gatewayModal) {
      gatewayModal.classList.add('gateway-hidden');
      setTimeout(() => {
        gatewayModal.style.display = 'none';
      }, 800);
    }

    if (mainWrapper) {
      mainWrapper.classList.remove('page-hidden');
    }

    // Trigger animations after gateway exit
    initCounters();
    initScrollReveal();
  }

  if (btnEnterSound) {
    btnEnterSound.addEventListener('click', () => exitGateway(true));
  }

  if (btnEnterMuted) {
    btnEnterMuted.addEventListener('click', () => exitGateway(false));
  }

  // 3. Setup Sound Toggle Buttons
  const soundToggleBtns = document.querySelectorAll('.sound-toggle-btn');
  soundToggleBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      soundManager.toggleSound();
    });
  });

  // 4. Attach Sound Effects to Interactive Elements
  function bindInteractiveSounds() {
    const clickableElements = document.querySelectorAll(
      'button, a, .project-card, .channel-item, .stat-card, .skill-category-card'
    );

    clickableElements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        soundManager.playHover();
      });

      el.addEventListener('click', () => {
        soundManager.playClick();
      });
    });
  }

  bindInteractiveSounds();

  // 5. Sticky Navigation Scroll State
  const siteHeader = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (siteHeader) {
      if (window.scrollY > 40) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    }
  });

  // 6. Mobile Navigation Drawer
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.className = mobileNav.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
      }
    });

    // Close mobile nav on link click
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      });
    });
  }

  // 7. Project Case Study Modal / Lightbox
  const projectModal = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalHeroImg = document.getElementById('modal-hero-img');
  const modalTitle = document.getElementById('modal-title');
  const modalMeta = document.getElementById('modal-meta');
  const modalDesc = document.getElementById('modal-desc');
  const modalFeatures = document.getElementById('modal-features');
  const modalTech = document.getElementById('modal-tech');
  const modalGithubLink = document.getElementById('modal-github-link');
  const modalLiveLink = document.getElementById('modal-live-link');

  function openProjectModal(projectId) {
    const data = PROJECTS_DATA[projectId];
    if (!data) return;

    if (modalHeroImg) {
      modalHeroImg.src = data.image;
      modalHeroImg.alt = data.title;
    }
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalMeta) modalMeta.textContent = `${data.category} · ${data.year}`;
    if (modalDesc) modalDesc.textContent = data.description;

    if (modalFeatures) {
      modalFeatures.innerHTML = data.metrics
        .map((m) => `<li><i class="fa-solid fa-check text-black mr-2"></i> ${m}</li>`)
        .join('');
    }

    if (modalTech) {
      modalTech.innerHTML = data.tech
        .map((t, idx) => `<span>${t}</span>${idx < data.tech.length - 1 ? '<span class="dot">·</span>' : ''}`)
        .join(' ');
    }

    if (modalGithubLink) modalGithubLink.href = data.githubUrl;
    if (modalLiveLink) modalLiveLink.href = data.liveUrl;

    if (projectModal) {
      projectModal.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      soundManager.playChime(783.99, 0.08, 0.25);
    }
  }

  function closeProjectModal() {
    if (projectModal) {
      projectModal.classList.remove('modal-open');
      document.body.style.overflow = '';
      soundManager.playChime(523.25, 0.06, 0.2);
    }
  }

  // Bind detail buttons and cards
  document.querySelectorAll('[data-project-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      // Don't intercept if direct link to github was clicked
      if (e.target.closest('.project-icon-link')) return;
      const pid = btn.getAttribute('data-project-id');
      if (pid) openProjectModal(pid);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProjectModal);
  }

  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) {
        closeProjectModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal && projectModal.classList.contains('modal-open')) {
      closeProjectModal();
    }
  });

  // 8. Contact Form Handling
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('contact-name')?.value.trim();
      const email = document.getElementById('contact-email')?.value.trim();
      const message = document.getElementById('contact-message')?.value.trim();

      if (!name || !email || !message) {
        alert('Please fill in all required fields.');
        return;
      }

      const submitBtn = contactForm.querySelector('.form-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...';
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
        }

        contactForm.reset();
        if (formStatus) {
          formStatus.className = 'form-status success';
          formStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Thank you, ' + name + '! Your message was dispatched. Maya will respond within 24 hours.';
        }

        soundManager.playChimeSuccess();

        setTimeout(() => {
          if (formStatus) formStatus.style.display = 'none';
        }, 8000);
      }, 900);
    });
  }

  // 9. Back to Top Button
  const btnScrollTop = document.getElementById('btn-scroll-top');
  if (btnScrollTop) {
    btnScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      soundManager.playClick();
    });
  }
});
