import React from 'react';

// A utility function to merge Tailwind classes conditionally
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// The main grid container component
const BentoGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
BentoGrid.displayName = "BentoGrid";

// Props interface for the individual grid cards
interface BentoCardProps extends React.HTMLAttributes<HTMLAnchorElement> {
  name: string;
  description: string;
  href: string;
  cta: string;
  background: React.ReactNode;
  Icon: React.ElementType;
}

// The individual card component within the bento grid
const BentoCard = React.forwardRef<HTMLAnchorElement, BentoCardProps>(
  ({ name, className, background, Icon, description, href, cta, ...props }, ref) => (
    <a
      ref={ref}
      href={href}
      className={cn(
        "group relative col-span-1 flex flex-col justify-end overflow-hidden rounded-xl",
        "bg-white/5 border border-white/10",
        "transition-shadow duration-300 hover:shadow-xl hover:shadow-red-500/20",
        className,
      )}
      {...props}
    >
      {/* Background element is absolute, so its position in DOM doesn't matter for layout */}
      {background}
      
      {/* Content block is now a direct child and pushed to the bottom by justify-end */}
      <div className="pointer-events-none z-10 flex flex-col p-6 transform-gpu transition-all duration-300 group-hover:-translate-y-10">
        <Icon className="h-10 w-10 text-red-500" />
        <h3 className="mt-2 text-2xl font-semibold text-white font-montserrat">
          {name}
        </h3>
        <p className="mt-1 max-w-lg text-gray-400">{description}</p>
        
        {/* The CTA is now part of the content block and fades in */}
        <div className="mt-4 transform-gpu transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          <p className="font-semibold text-red-500 inline-flex items-center gap-1">
            <span>{cta}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
          </p>
        </div>
      </div>
    </a>
  ),
);
BentoCard.displayName = "BentoCard";

export { BentoGrid, BentoCard };