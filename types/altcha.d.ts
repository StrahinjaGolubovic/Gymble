declare namespace JSX {
  interface IntrinsicElements {
    'altcha-widget': {
      challengeurl?: string;
      strings?: {
        label?: string;
        error?: string;
      };
      className?: string;
      children?: React.ReactNode;
    };
  }
}

