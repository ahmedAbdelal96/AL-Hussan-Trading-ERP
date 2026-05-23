/// <reference types="vite/client" />

declare module "*.svg?react" {
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
  export { content as ReactComponent };
}
