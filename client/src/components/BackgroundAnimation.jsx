import React, { useEffect, useRef } from 'react';

const BackgroundAnimation = ({ dark = false }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        let isRunning = true;

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 1.5; // Velocity X
                this.vy = (Math.random() - 0.5) * 1.5; // Velocity Y
                this.size = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.fillStyle = dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.3)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initPoints = () => {
            particles = [];
            const numberOfParticles = Math.floor((canvas.width * canvas.height) / 15000); // Restored original density
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            if (!isRunning) return;
            if (window.innerWidth < 768) return; // Prevent animation loop on mobile
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                // Draw connections
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = dark 
                            ? `rgba(96, 165, 250, ${0.12 - distance / 1000})`
                            : `rgba(59, 130, 246, ${0.15 - distance / 800})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            if (window.innerWidth < 768) {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
                if (!animationFrameId && isRunning) {
                    initPoints();
                    animate();
                }
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            isRunning = false;
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [dark]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 0, // Behind content
                pointerEvents: 'none', // Crucial for mobile clicks!
                background: dark 
                    ? 'radial-gradient(circle at top left, #1e1b4b, #0f172a 50%, #1e1b4b)'
                    : 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
                width: '100%',
                height: '100%'
            }}
        />
    );
};

export default BackgroundAnimation;
