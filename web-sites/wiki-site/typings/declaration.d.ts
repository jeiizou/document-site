// images
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.webp';

// style
declare module '*.less';
declare module '*.sass';
declare module '*.scss';
declare module '*.css';

// plain text
declare module '*.text' {
  const content: string;
  export default content;
}

// inline resources
declare module '*?__inline';
declare module '*?__inline=true';
declare module '*?__inline=false';

// preload resources
declare module '*?__preload';
declare module '*?__preload=true';
declare module '*?__preload=false';

type StoreValue = any;
