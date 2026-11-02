// Aliases support explicit :global selectors between parent and child components.
const aliases = new Set([
  "appearance",
  "brand",
  "button",
  "destructive",
  "hero-bars",
  "icon-button"
]);

export function bindStyles(styles, value = '') {
  return String(value).split(/\s+/).filter(Boolean).flatMap(name => {
    const local = styles[name];
    return local ? (aliases.has(name) ? [local, name] : [local]) : [name];
  }).join(' ');
}
