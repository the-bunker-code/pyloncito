export function focusHeading(root: ParentNode = document): void {
  const heading = root.querySelector<HTMLElement>('h1, h2');
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.focus();
}
