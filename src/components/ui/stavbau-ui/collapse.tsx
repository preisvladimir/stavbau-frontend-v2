import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type CollapseProps = {
  open: boolean;
  children: React.ReactNode;
  /** Když je zavřeno, obsah bude odpojen z DOM (lepší výkon). Default: false */
  unmountOnExit?: boolean;
  /** Délka animace v ms. Default: 200 */
  durationMs?: number;
  /** CSS easing. Default: 'ease' */
  easing?: string;
  /** Volitelná CSS class */
  className?: string;
  /** ARIA: id regionu */
  id?: string;
  /** Callback po dokončení animace (po otevření/zavření) */
  onRest?: () => void;
};

export const Collapse: React.FC<CollapseProps> = ({
  open,
  children,
  unmountOnExit = false,
  durationMs = 200,
  easing = "ease",
  className,
  id,
  onRest,
}) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = React.useState(open || !unmountOnExit);
  const [maxH, setMaxH] = React.useState<string>(open ? "none" : "0px");
  const [opacity, setOpacity] = React.useState<number>(open ? 1 : 0);
  const animatingRef = React.useRef(false);

  // při změně "open" spustit animaci
  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // když se má otevřít
    if (open) {
      if (unmountOnExit && !rendered) setRendered(true);
      // počkej na mount/update, změř výšku
      requestAnimationFrame(() => {
        if (!wrapperRef.current) return;
        const target = wrapperRef.current.scrollHeight;
        // start
        animatingRef.current = true;
        setOpacity(1);
        // když byla výška "none", dej aktuální pro plynulé zavření/otevření
        if (maxH === "none") setMaxH(`${target}px`);
        // transition na měřenou výšku
        setMaxH(`${target}px`);
      });
    } else {
      // zavření: pokud je "none", nejdřív nastav aktuální výšku kvůli animaci
      if (maxH === "none" && wrapperRef.current) {
        const current = wrapperRef.current.scrollHeight;
        setMaxH(`${current}px`);
      }
      requestAnimationFrame(() => {
        animatingRef.current = true;
        setOpacity(0);
        setMaxH("0px");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // po skončení animace: otevřeno → maxHeight:none (aby obsah mohl růst), zavřeno → případně unmount
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (!animatingRef.current) return;
    animatingRef.current = false;

    if (open) {
      setMaxH("none");
    } else if (unmountOnExit) {
      setRendered(false);
    }
    onRest?.();
  };

  // inline styl pro přechod
  const style: React.CSSProperties = {
    maxHeight: maxH,
    opacity,
    transition: `max-height ${durationMs}ms ${easing}, opacity ${durationMs}ms ${easing}`,
  };

  if (!rendered && unmountOnExit) {
    return null;
  }

  return (
    <div
      id={id}
      ref={wrapperRef}
      style={style}
      onTransitionEnd={handleTransitionEnd}
      className={cn(
        "overflow-hidden motion-reduce:transition-none",
        className
      )}
      aria-hidden={!open}
    >
      {children}
    </div>
  );
};

export default Collapse;
