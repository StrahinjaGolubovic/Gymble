/// <reference types="react" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'altcha-widget': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        challengeurl?: string;
        strings?: {
          label?: string;
          error?: string;
        };
      };
    }
  }
}

export {};

