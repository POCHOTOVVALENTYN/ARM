import { useRef, useEffect } from 'react';

type DrawFunction = (ctx: CanvasRenderingContext2D, frameCount: number) => void;

export const useCanvasAutomation = (draw: DrawFunction) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawRef = useRef(draw);

    // Зберігаємо найновішу версію draw без ре-ініціалізації Canvas
    useEffect(() => {
        drawRef.current = draw;
    }, [draw]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: true }); // alpha: true для прозорого фону над SVG
        if (!context) return;

        let frameCount = 0;
        let animationFrameId: number;

        // Оптимізація під екрани з високою щільністю пікселів (Retina)
        const setupCanvas = () => {
            const ratio = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * ratio;
            canvas.height = rect.height * ratio;
            
            context.scale(ratio, ratio);
        };

        const render = () => {
            frameCount++;
            // Очищення фрейму перед новим відмальовуванням
            context.clearRect(0, 0, canvas.width, canvas.height);
            // Використовуємо актуальний колбек з Ref
            drawRef.current(context, frameCount);
            animationFrameId = window.requestAnimationFrame(render);
        };

        setupCanvas();
        render();

        // Обробка зміни розміру вікна для уникнення "розмиття"
        window.addEventListener('resize', setupCanvas);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', setupCanvas);
        };
    }, []); // Порожній масив залежностей гарантує, що ініціалізація та слухачі подій встановлюються лише раз

    return canvasRef;
};
