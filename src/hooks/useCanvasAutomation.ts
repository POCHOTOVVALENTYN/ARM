import { useEffect, useRef } from 'react';

export const useCanvasAutomation = (
  draw: (ctx: CanvasRenderingContext2D, frameCount: number) => void
) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let frameCount = 0;
    let animationFrameId: number;

    const render = () => {
      frameCount++;
      context.clearRect(0, 0, canvas.width, canvas.height);
      draw(context, frameCount);
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);

  return canvasRef;
};
