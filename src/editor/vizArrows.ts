// Call-dependency arrows for the Visual tab. The PureScript renderer tags each
// definition card with `data-def="name"` and each user-call chip with
// `data-call="name"`. Drawing arrows needs post-layout measurement
// (getBoundingClientRect), so it lives here in the host rather than in the
// renderer. Arrows are shown on hover of a card — drawing every edge at once
// turns 40+ definitions into a hairball.

const SVG_NS = 'http://www.w3.org/2000/svg';
const ACCENT = '#818cf8'; // indigo-400

function highlight(el: HTMLElement, on: boolean) {
  // Inline styles, not Tailwind classes: these are added dynamically and would
  // otherwise be purged from the build.
  el.style.outline = on ? `2px solid ${ACCENT}` : '';
  el.style.outlineOffset = on ? '1px' : '';
  el.style.borderRadius = on ? '0.5rem' : '';
}

// Attach a hover-driven arrow overlay to a rendered block tree. Returns a
// cleanup that removes the SVG and listeners (call before each re-render).
export function installArrowOverlay(content: HTMLElement): () => void {
  content.style.position = 'relative';

  const svg = document.createElementNS(SVG_NS, 'svg');
  Object.assign(svg.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    overflow: 'visible',
    pointerEvents: 'none',
    zIndex: '5',
  } satisfies Partial<CSSStyleDeclaration>);

  const defs = document.createElementNS(SVG_NS, 'defs');
  const marker = document.createElementNS(SVG_NS, 'marker');
  marker.setAttribute('id', 'viz-arrowhead');
  marker.setAttribute('markerWidth', '8');
  marker.setAttribute('markerHeight', '8');
  marker.setAttribute('refX', '7');
  marker.setAttribute('refY', '4');
  marker.setAttribute('orient', 'auto');
  const head = document.createElementNS(SVG_NS, 'path');
  head.setAttribute('d', 'M0,0 L8,4 L0,8 z');
  head.setAttribute('fill', ACCENT);
  marker.appendChild(head);
  defs.appendChild(marker);
  svg.appendChild(defs);
  content.appendChild(svg);

  const lit: HTMLElement[] = [];
  let current: HTMLElement | null = null;

  const clear = () => {
    while (svg.lastChild && svg.lastChild !== defs) svg.removeChild(svg.lastChild);
    lit.forEach((el) => highlight(el, false));
    lit.length = 0;
  };

  const litAdd = (el: HTMLElement) => {
    highlight(el, true);
    lit.push(el);
  };

  const draw = (card: HTMLElement) => {
    clear();
    const origin = content.getBoundingClientRect();
    litAdd(card);
    const seen = new Set<string>();
    card.querySelectorAll<HTMLElement>('[data-call]').forEach((chip) => {
      const target = chip.dataset.call;
      if (!target || seen.has(target)) return;
      seen.add(target);
      const tcard = content.querySelector<HTMLElement>(`[data-def="${CSS.escape(target)}"]`);
      if (!tcard || tcard === card) return;
      litAdd(tcard);
      const a = chip.getBoundingClientRect();
      const b = tcard.getBoundingClientRect();
      const x1 = a.right - origin.left;
      const y1 = a.top + a.height / 2 - origin.top;
      const x2 = b.left - origin.left;
      const y2 = b.top + 14 - origin.top;
      const dx = Math.max(40, Math.abs(x2 - x1) / 2);
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', ACCENT);
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-opacity', '0.85');
      path.setAttribute('marker-end', 'url(#viz-arrowhead)');
      svg.appendChild(path);
    });
  };

  const onOver = (e: Event) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-def]');
    if (card && card !== current) {
      current = card;
      draw(card);
    }
  };
  const onOut = (e: Event) => {
    const to = (e as MouseEvent).relatedTarget as HTMLElement | null;
    if (!to || !to.closest?.('[data-def]')) {
      current = null;
      clear();
    }
  };

  content.addEventListener('mouseover', onOver);
  content.addEventListener('mouseout', onOut);

  return () => {
    content.removeEventListener('mouseover', onOver);
    content.removeEventListener('mouseout', onOut);
    clear();
    svg.remove();
  };
}
