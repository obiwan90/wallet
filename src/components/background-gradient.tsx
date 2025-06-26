"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';

interface BackgroundGradientProps {
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  containerClassName?: string;
}

export const BackgroundGradient = ({
  children,
  className,
  interactive = true,
  containerClassName,
}: BackgroundGradientProps) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // 为了避免水合不匹配，始终使用固定的默认颜色配置
  const getDefaultColors = () => ({
    gradientBackgroundStart: '#fefcf0',
    gradientBackgroundEnd: '#f8f6ea',
    firstColor: '#fffd82',
    secondColor: '#ff9b71',
    thirdColor: '#e84855',
    fourthColor: '#b56b45',
    fifthColor: '#2b3a67',
    pointerColor: '#e84855',
  });

  const getDarkColors = () => ({
    gradientBackgroundStart: '#0f0f23',
    gradientBackgroundEnd: '#09090f',
    firstColor: '#ff9b71',
    secondColor: '#b56b45',
    thirdColor: '#e84855',
    fourthColor: '#fffd82',
    fifthColor: '#2b3a67',
    pointerColor: '#ff9b71',
  });

  const [colors, setColors] = React.useState(getDefaultColors);

  // 客户端挂载后更新颜色
  React.useEffect(() => {
    if (!mounted) return;

    // 使用固定的颜色配置而不是读取CSS变量
    if (theme === 'dark') {
      setColors(getDarkColors());
    } else {
      setColors(getDefaultColors());
    }
  }, [mounted, theme]);

  // 确保组件已挂载到客户端
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const interactiveRef = React.useRef<HTMLDivElement>(null);
  const [curX, setCurX] = React.useState(0);
  const [curY, setCurY] = React.useState(0);
  const [tgX, setTgX] = React.useState(0);
  const [tgY, setTgY] = React.useState(0);
  const [isSafari, setIsSafari] = React.useState(false);

  React.useEffect(() => {
    // 只在客户端执行
    if (mounted && typeof window !== 'undefined') {
      document.body.style.setProperty("--gradient-background-start", colors.gradientBackgroundStart);
      document.body.style.setProperty("--gradient-background-end", colors.gradientBackgroundEnd);
      document.body.style.setProperty("--first-color", colors.firstColor);
      document.body.style.setProperty("--second-color", colors.secondColor);
      document.body.style.setProperty("--third-color", colors.thirdColor);
      document.body.style.setProperty("--fourth-color", colors.fourthColor);
      document.body.style.setProperty("--fifth-color", colors.fifthColor);
      document.body.style.setProperty("--pointer-color", colors.pointerColor);
      document.body.style.setProperty("--size", "80%");
      document.body.style.setProperty("--blending-value", "hard-light");
    }
  }, [mounted, colors]);

  React.useEffect(() => {
    function move() {
      if (!interactiveRef.current) return;
      setCurX(curX + (tgX - curX) / 20);
      setCurY(curY + (tgY - curY) / 20);
      interactiveRef.current.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
    }
    move();
  }, [tgX, tgY, curX, curY]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (interactiveRef.current) {
      const rect = interactiveRef.current.getBoundingClientRect();
      setTgX(event.clientX - rect.left);
      setTgY(event.clientY - rect.top);
    }
  };

  React.useEffect(() => {
    // 只在客户端检查浏览器类型
    if (typeof window !== 'undefined') {
      setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
    }
  }, []);

  // 使用一个wrapper让内容正常流动，背景fixed覆盖
  return (
    <div className={cn("relative", containerClassName)}>
      {/* Fixed Background Layer */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(40deg, ${mounted ? colors.gradientBackgroundStart : '#fefcf0'}, ${mounted ? colors.gradientBackgroundEnd : '#f8f6ea'})`
        }}
      >
        <svg className="hidden">
          <defs>
            <filter id="blurMe">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>

        {mounted && (
          <div className={cn("absolute inset-0 gradients-container h-full w-full blur-lg", isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]")}>
            <div
              className="absolute w-[80%] h-[80%] top-[calc(50%-40%)] left-[calc(50%-40%)] opacity-100 animate-[moveVertical_30s_ease_infinite]"
              style={{
                background: `radial-gradient(circle at center, ${colors.firstColor}cc 0%, ${colors.firstColor}00 50%)`,
                mixBlendMode: "hard-light" as any,
                transformOrigin: "center center"
              }}
            />
            <div
              className="absolute w-[80%] h-[80%] top-[calc(50%-40%)] left-[calc(50%-40%)] opacity-100 animate-[moveInCircle_20s_reverse_infinite]"
              style={{
                background: `radial-gradient(circle at center, ${colors.secondColor}cc 0%, ${colors.secondColor}00 50%)`,
                mixBlendMode: "hard-light" as any,
                transformOrigin: "calc(50% - 400px)"
              }}
            />
            <div
              className="absolute w-[80%] h-[80%] top-[calc(50%-40%)] left-[calc(50%-40%)] opacity-100 animate-[moveInCircle_40s_linear_infinite]"
              style={{
                background: `radial-gradient(circle at center, ${colors.thirdColor}cc 0%, ${colors.thirdColor}00 50%)`,
                mixBlendMode: "hard-light" as any,
                transformOrigin: "calc(50% + 400px)"
              }}
            />
            <div
              className="absolute w-[80%] h-[80%] top-[calc(50%-40%)] left-[calc(50%-40%)] opacity-70 animate-[moveHorizontal_40s_ease_infinite]"
              style={{
                background: `radial-gradient(circle at center, ${colors.fourthColor}cc 0%, ${colors.fourthColor}00 50%)`,
                mixBlendMode: "hard-light" as any,
                transformOrigin: "calc(50% - 200px)"
              }}
            />
            <div
              className="absolute w-[80%] h-[80%] top-[calc(50%-40%)] left-[calc(50%-40%)] opacity-100 animate-[moveInCircle_20s_ease_infinite]"
              style={{
                background: `radial-gradient(circle at center, ${colors.fifthColor}cc 0%, ${colors.fifthColor}00 50%)`,
                mixBlendMode: "hard-light" as any,
                transformOrigin: "calc(50% - 800px) calc(50% + 800px)"
              }}
            />
            {interactive && (
              <div
                ref={interactiveRef}
                onMouseMove={handleMouseMove}
                className="absolute w-full h-full -top-1/2 -left-1/2 opacity-70"
                style={{
                  background: `radial-gradient(circle at center, ${colors.pointerColor}cc 0%, ${colors.pointerColor}00 50%)`,
                  mixBlendMode: "hard-light" as any
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Content Layer - Normal Document Flow */}
      <div className={cn("relative z-10", className)}>{children}</div>

      <style jsx global>{`
        @keyframes moveHorizontal {
          0% { transform: translateX(-50%) translateY(-10%); }
          50% { transform: translateX(50%) translateY(10%); }
          100% { transform: translateX(-50%) translateY(-10%); }
        }
        @keyframes moveInCircle {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes moveVertical {
          0% { transform: translateY(-50%); }
          50% { transform: translateY(50%); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
};