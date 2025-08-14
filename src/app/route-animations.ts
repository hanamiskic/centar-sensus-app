import {
  trigger,
  transition,
  style,
  animate,
  query,
  group,
  animateChild,
} from '@angular/animations';

/** Respect “prefers-reduced-motion” (ako je moguće) */
const REDUCED =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DUR_OUT = REDUCED ? '1ms'  : '250ms';
const DUR_IN  = REDUCED ? '1ms'  : '300ms';
const EASE    = 'ease-out';

/**
 * Route crossfade/slide:
 * - kontejner je relative, ekrani su absolute, pa se ne ruši layout
 * - leave: lagani slide ulijevo + fade
 * - enter: lagani slide udesno + fade
 * - REDUCED: animacije praktički instant
 * - animateChild: ako djeca imaju svoje trigger-e, odradi i njih
 */
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    // layout za vrijeme tranzicije
    style({ position: 'relative' }),

    // pripremi stare i nove ekrane
    query(
      ':enter, :leave',
      style({
        position: 'absolute',
        width: '100%',
        top: 0,
        left: 0,
      }),
      { optional: true }
    ),

    // početno stanje novog ekrana (sprečava “blink”)
    query(
      ':enter',
      style({ opacity: 0, transform: 'translateX(20px)' }),
      { optional: true }
    ),

    group([
      // stari ekran izlazi
      query(
        ':leave',
        [
          style({ opacity: 1, transform: 'translateX(0)' }),
          animate(
            `${DUR_OUT} ${EASE}`,
            style({ opacity: 0, transform: 'translateX(-20px)' })
          ),
          // pokreni i njegove child animacije (ako postoje)
          query('@*', animateChild(), { optional: true }),
        ],
        { optional: true }
      ),

      // novi ekran ulazi
      query(
        ':enter',
        [
          animate(
            `${DUR_IN} ${EASE}`,
            style({ opacity: 1, transform: 'translateX(0)' })
          ),
          query('@*', animateChild(), { optional: true }),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);
