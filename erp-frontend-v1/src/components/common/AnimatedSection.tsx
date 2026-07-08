import { useEffect, useRef, useState, ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number; // ms
}

export default function AnimatedSection({ children, className = "", delay = 0 }: AnimatedSectionProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05, // trigger when 5% of the element is visible
        rootMargin: "0px 0px -40px 0px", // offset to trigger slightly inside view
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        isIntersecting 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-6 motion-reduce:opacity-100 motion-reduce:translate-y-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
export { AnimatedSectionProps };
