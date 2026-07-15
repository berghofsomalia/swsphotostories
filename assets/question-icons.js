const icons = [
  `<svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="5" y="14" width="54" height="36" rx="6"/>
    <path d="M12 19v26h40V19H12Z"/>
    <circle cx="17" cy="25" r="2.5"/>
    <path d="m12 41 10-10 8 8 6-6 16 12M8.5 28v8M55.5 30h.1"/>
  </svg>`,
  `<svg viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="17" cy="35" r="8"/>
    <path d="M4 57v-5c0-7.5 5.8-12 13-12s13 4.5 13 12v5H4Z"/>
    <circle cx="30" cy="32" r="2.5"/><circle cx="36" cy="25" r="4"/>
    <path d="M42 20c-4.4 0-7.5-3.1-7.5-7s3-7 7.2-7c1.7-3.5 5.3-5.5 9.2-5 3.3.4 5.9 2.5 7 5.4 3.5.4 6.1 3.2 6.1 6.7 0 3.8-3 6.9-6.9 6.9H42Z"/>
  </svg>`,
  `<svg viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="16" cy="18" r="7"/><circle cx="48" cy="18" r="7"/>
    <path d="M5 52v-9c0-8 4.8-13 11-13 4.5 0 8.3 2.7 10 7M59 52v-9c0-8-4.8-13-11-13-4.5 0-8.3 2.7-10 7"/>
    <path d="M17 43c6.5-5 11.2-6.4 15-4.2M47 39c-5.6 0-9.5 2.1-15 7.2"/>
    <path d="M32 46c-4-4-7.5-5.8-10.5-5.4M44 35c2.5 1.4 3.8 3.8 3.8 7"/>
  </svg>`,
  `<svg viewBox="0 0 64 64" aria-hidden="true">
    <path d="M18 8 3.8 33h28.4L18 8Z"/><path d="M18 18v7M18 29h.1"/>
    <path d="M42 53S25.5 44.1 25.5 32.3c0-5.5 7-8.5 11.3-3.2L42 35l5.2-5.9c4.3-5.3 11.3-2.3 11.3 3.2C58.5 44.1 42 53 42 53Z"/>
  </svg>`,
  `<svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="3" y="12" width="24" height="38" rx="3"/>
    <path d="M15 44V27M15 31l-6-6M15 35l7-8M10 44h10M8 20l3 2M21 19l-3 3"/>
    <path d="M30 31h6M33 27l4 4-4 4"/>
    <rect x="39" y="12" width="22" height="38" rx="3"/>
    <path d="M50 44V28M50 32l-5-5M50 35l6-7M44 44h12"/>
    <circle cx="45" cy="25" r="3"/><circle cx="50" cy="21" r="3.5"/><circle cx="56" cy="25" r="3"/>
    <path d="M43 35c-3-3-3-6 1-7M57 35c3-3 3-6-1-7"/>
  </svg>`,
  `<svg viewBox="0 0 64 64" aria-hidden="true">
    <path d="M7 14h29a5 5 0 0 1 5 5v19a5 5 0 0 1-5 5H20l-9 7v-7H7a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5Z"/>
    <path d="M11 32c0-5 2.2-8 6.5-9M11 32h7v-7h-4M23 32c0-5 2.2-8 6.5-9M23 32h7v-7h-4"/>
    <path d="M52 17a13 13 0 1 0 7 22 11 11 0 1 1-7-22Z"/>
    <path d="m55 12 1.5 3.2 3.5.4-2.6 2.4.7 3.5-3.1-1.8-3.1 1.8.7-3.5-2.6-2.4 3.5-.4L55 12Z"/>
  </svg>`
];

export function renderQuestionIcon(index) {
  return `<span class="about-question-icon">${icons[index] || icons[0]}</span>`;
}
