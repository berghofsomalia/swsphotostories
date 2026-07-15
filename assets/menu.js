/**
 * Shared menu module.
 *
 * renderMenu(state, opts) produces the utility-menu HTML used identically
 * on all three pages. Each page passes its own link base paths and an
 * esc() helper (to avoid a circular dependency on content.js).
 *
 * opts = {
 *   esc:       function,   // HTML-escape helper from the caller
 *   t:         object,     // getUiText() result
 *   basePaths: {           // relative paths FROM this page's directory
 *     home:    string,     // e.g. '../'  or  './'
 *     stories: string      // e.g. '../stories/'  or  './'
 *   },
 *   savedCount:  number,
 *   savedAction: string,   // data-action value for opening saved ('open-saved')
 *   showSwitchers: boolean,
 *   shellClass: string
 * }
 */

const menuIcon     = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>';
const homeIcon     = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V20h11V10.5"/></svg>';
const galleryIcon  = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
const bookmarkIcon = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4z"/></svg>';

export function renderMenu(state, opts) {
  const {
    esc,
    t,
    basePaths,
    savedCount = 0,
    savedAction = 'open-saved',
    signOutAction = '',
    showSwitchers = true,
    shellClass = ''
  } = opts;
  const isOpen = state.menuOpen;
  const shellClassName = shellClass ? ` ${esc(shellClass)}` : '';

  return `
    <div class="utility-menu-shell${shellClassName}">
      ${isOpen
        ? `<button type="button" class="utility-menu-backdrop" data-action="close-menu" aria-label="${esc(t.close)}"></button>`
        : ''}
      <div class="utility-menu ${isOpen ? 'is-open' : ''}">
        <button type="button" class="utility-menu-toggle" data-action="toggle-menu"
          aria-label="${esc(t.menu)}" aria-expanded="${isOpen}">
          ${menuIcon()}
        </button>
        <div class="utility-menu-panel" aria-hidden="${!isOpen}">

          <div class="utility-menu-pill utility-menu-pill--single">
            <a class="utility-menu-control utility-menu-control--single" href="${esc(basePaths.home)}">
              <span class="utility-menu-control-copy">
                <span class="utility-menu-control-icon" aria-hidden="true">${homeIcon()}</span>
                <span>${esc(t.home)}</span>
              </span>
            </a>
          </div>

          <div class="utility-menu-pill utility-menu-pill--single">
            <a class="utility-menu-control utility-menu-control--single" href="${esc(basePaths.stories)}#gallery">
              <span class="utility-menu-control-copy">
                <span class="utility-menu-control-icon" aria-hidden="true">${galleryIcon()}</span>
                <span>${esc(t.gallery || 'Gallery')}</span>
              </span>
            </a>
          </div>

          <div class="utility-menu-pill utility-menu-pill--single">
            <button type="button" class="utility-menu-control utility-menu-control--single"
              data-action="${esc(savedAction)}" aria-label="${esc(t.openSaved)}">
              <span class="utility-menu-control-copy">
                <span class="utility-menu-control-icon" aria-hidden="true">${bookmarkIcon()}</span>
                <span>${esc(t.saved)}</span>
              </span>
              ${savedCount > 0 ? `<span class="utility-menu-badge">${savedCount}</span>` : ''}
            </button>
          </div>

          ${signOutAction ? `
            <div class="utility-menu-pill utility-menu-pill--single">
              <button type="button" class="utility-menu-control utility-menu-control--single" data-action="${esc(signOutAction)}">
                <span class="utility-menu-control-copy">
                  <span>${esc(state.language === 'so' ? 'Ka bax' : 'Sign out')}</span>
                </span>
              </button>
            </div>
          ` : ''}

          ${showSwitchers ? `
            <div class="utility-menu-group">
              <div class="utility-menu-pill utility-menu-switchers" role="group" aria-label="Language">
                <button type="button" class="utility-menu-control ${state.language === 'so' ? 'is-active' : ''}" data-action="set-language" data-value="so">${esc(t.shortSo)}</button>
                <button type="button" class="utility-menu-control ${state.language === 'en' ? 'is-active' : ''}" data-action="set-language" data-value="en">${esc(t.shortEn)}</button>
              </div>
            </div>

            <div class="utility-menu-group">
              <div class="utility-menu-pill utility-menu-switchers" role="group" aria-label="Theme">
                <button type="button" class="utility-menu-control ${state.theme === 'dark' ? 'is-active' : ''}" data-action="set-theme" data-value="dark">${esc(t.dark)}</button>
                <button type="button" class="utility-menu-control ${state.theme === 'light' ? 'is-active' : ''}" data-action="set-theme" data-value="light">${esc(t.light)}</button>
              </div>
            </div>
          ` : ''}

        </div>
      </div>
    </div>
  `;
}
