// App animations are pure CSS (see globals.css utilities + tailwind.config
// keyframes). This module only centralizes the class names so components
// don't hardcode strings.

export const appAnimations = {
  pageEnter: "page-enter",
  pageExit: "page-exit",
  btnHover: "btn-hover",
  cardHover: "card-hover",
  rowHover: "row-hover",
  skeleton: "skeleton",
  toastEnter: "animate-in slide-in-from-right duration-300",
} as const;
