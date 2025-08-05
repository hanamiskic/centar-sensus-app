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
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          width: '100%',
          top: 0,
          left: 0,
        }),
      ],
      { optional: true }
    ),

    group([
      query(
        ':leave',
        [
          style({ opacity: 1, transform: 'translateX(0)' }),
          animate(
            '250ms ease-out',
            style({ opacity: 0, transform: 'translateX(-20px)' })
          ),
        ],
        { optional: true }
      ),

      query(
        ':enter',
        [
          style({ opacity: 0, transform: 'translateX(20px)' }),
          animate(
            '300ms ease-out',
            style({ opacity: 1, transform: 'translateX(0)' })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);
