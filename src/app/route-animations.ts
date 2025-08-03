import {
  trigger,
  transition,
  style,
  animate,
  query,
  group,
} from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), {
      optional: true,
    }),

    group([
      // ostavi staru stranicu dok nova ne dođe
      query(':leave', [
        style({ opacity: 1, transform: 'translateX(0)' }),
        animate('500ms ease-out', style({ opacity: 0, transform: 'translateX(-10px)' }))
      ], { optional: true }),

      query(':enter', [
        style({ opacity: 0, transform: 'translateX(10px)' }),
        animate('500ms 200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ], { optional: true }),
    ])
  ])
]);
