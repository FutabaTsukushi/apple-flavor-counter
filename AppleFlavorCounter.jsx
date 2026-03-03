import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';

const Digit = ({ value, prevValue }) => {
  const containerRef = useRef(null);
  const currentRef = useRef(null);
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // If value hasn't effectively changed (e.g. from parent re-render but same prop), skip
    if (value === prevValue) return;

    const el = currentRef.current;
    const container = containerRef.current;

    // Create a clone for the exiting digit (the OLD value)
    const oldEl = document.createElement('div');
    oldEl.textContent = prevValue;
    
    // Copy computed styles to ensure identical appearance
    const computedStyle = window.getComputedStyle(el);
    oldEl.style.cssText = computedStyle.cssText;
    
    // Override positioning for the clone to sit on top
    oldEl.style.position = 'absolute';
    oldEl.style.top = '0';
    oldEl.style.left = '0';
    oldEl.style.margin = '0'; // Reset margin if any
    oldEl.style.transform = 'none'; // Reset transform if any on parent
    
    container.appendChild(oldEl);

    // Direction Logic:
    // "When new < old ... appear from below ... cover old value"
    // "When old is 0, treat as 10"
    
    let effectiveOld = prevValue;
    if (prevValue === 0) effectiveOld = 10;
    
    // Comparison for direction
    // If new < effectiveOld: Enter from BOTTOM (translateY: 100% -> 0%)
    // If new > effectiveOld: Enter from TOP (translateY: -100% -> 0%)
    const isNewSmaller = value < effectiveOld;
    
    const enterFrom = isNewSmaller ? '100%' : '-100%';
    const exitTo = isNewSmaller ? '-100%' : '100%'; // Opposite direction exit

    // Animate New Digit (Enter)
    gsap.fromTo(el,
      { y: enterFrom, opacity: 0, filter: 'blur(10px)' },
      { y: '0%', opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }
    );

    // Animate Old Digit (Exit)
    gsap.fromTo(oldEl,
      { y: '0%', opacity: 1, filter: 'blur(0px)' },
      { 
        y: exitTo, 
        opacity: 0, 
        filter: 'blur(10px)', 
        duration: 0.5, 
        ease: 'power2.out', 
        onComplete: () => {
          if (oldEl.parentNode) oldEl.parentNode.removeChild(oldEl);
        }
      }
    );

  }, [value, prevValue]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '0.6em', height: '1.2em', overflow: 'hidden', display: 'inline-block' }}>
      <div ref={currentRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {value}
      </div>
    </div>
  );
};

export default function AppleFlavorCounter({ className, style }) {
  const [inputValue, setInputValue] = useState(0);
  const [debouncedValue, setDebouncedValue] = useState(0);
  const [debounceTime, setDebounceTime] = useState(300);
  const [displayDigits, setDisplayDigits] = useState([]);
  const [prevDigits, setPrevDigits] = useState([]);
  
  // Debounce Logic
  useEffect(() => {
    const delay = (debounceTime === '' || isNaN(debounceTime)) ? 300 : debounceTime;
    const handler = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delay);
    return () => clearTimeout(handler);
  }, [inputValue, debounceTime]);

  // Refined Logic for Digits
  const prevValueRef = useRef(0);
  
  useEffect(() => {
    // Current (New)
    const currentStr = String(debouncedValue);
    // Previous (Old)
    const prevStr = String(prevValueRef.current);
    
    const maxLength = Math.max(currentStr.length, prevStr.length);
    
    const paddedCurrent = currentStr.padStart(maxLength, '0');
    const paddedPrev = prevStr.padStart(maxLength, '0');
    
    const newArr = paddedCurrent.split('').map(Number);
    const oldArr = paddedPrev.split('').map(Number);
    
    setDisplayDigits(newArr);
    setPrevDigits(oldArr);
    
    prevValueRef.current = debouncedValue;
  }, [debouncedValue]);

  return (
    <div className={className} style={{ padding: '40px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', ...style }}>
      <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
        <label>
          Number:
          <input 
            type="number" 
            value={inputValue}
            onChange={(e) => setInputValue(parseInt(e.target.value) || 0)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
        <label>
          Debounce (ms):
          <input 
            type="number" 
            value={debounceTime}
            onChange={(e) => setDebounceTime(parseInt(e.target.value) || 300)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      <div className="flavor-counter" style={{ 
        display: 'flex', 
        fontSize: '8rem', 
        fontWeight: '800', 
        lineHeight: 1,
        color: 'inherit' // Inherit color from parent
      }}>
        {displayDigits.map((digit, i) => (
          <Digit 
            key={i} 
            value={digit} 
            prevValue={prevDigits[i]} 
          />
        ))}
      </div>
    </div>
  );
}
