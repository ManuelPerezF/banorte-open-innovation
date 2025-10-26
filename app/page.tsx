"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChatBubbleIcon, BellIcon, FileTextIcon, BarChartIcon, ArrowUpIcon } from '@radix-ui/react-icons';
import GradientBlinds from '@/components/landing/GradientBlinds';
import { BentoGrid, BentoCard } from '@/components/landing/BentoGrid';


const svgString = `
<svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1099.45 0C454.884 0 -67.5559 169.699 -67.5559 380.126C-67.5559 556.613 296.569 703.686 791.87 746.677L995.418 119.921L1031.6 757.99C1054.22 757.99 1076.84 757.99 1101.72 757.99C1746.28 757.99 2268.72 588.29 2268.72 377.863C2266.46 171.961 1744.02 0 1099.45 0Z" fill="white"/>
    <path d="M785.084 769.301C156.347 776.089 -348 975.203 -348 1221.83C-348 1430 9.34005 1604.22 497.856 1658.53L785.084 769.301Z" fill="white"/>
    <path d="M1029.34 776.089L1079.1 1663.05C1597.01 1617.8 1981.49 1436.79 1981.49 1221.83C1983.76 1000.09 1572.14 814.554 1029.34 776.089Z" fill="white"/>
</svg>
`.trim();
const svgDataUrl = `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(svgString) : ''}`;


const logoSvgString = `
<svg width="1920" height="236" viewBox="0 0 1920 236" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M594.24 130.56H596.48C608.96 130.56 618.88 120.64 618.88 108.16V88.6399C618.88 77.1199 617.6 71.68 613.12 65.6C606.72 57.6 595.52 54.08 584.64 54.08H488H448.96V82.88V116.16V130.56V144.96V180.16V211.84H488H572.8C586.88 211.84 603.52 209.92 612.16 200.64C620.16 192 620.48 185.28 620.48 164.16V157.12C620.8 142.72 608.96 130.56 594.24 130.56ZM488.32 82.88H570.24C574.4 82.88 583.04 84.48 583.04 91.2V108.48C583.04 113.92 575.04 116.16 571.84 116.16H488.32V82.88ZM583.68 171.84C583.68 176.64 579.84 180.48 575.04 180.48H488.32V145.28H574.4C579.52 145.28 583.68 149.44 583.68 154.56V171.84Z" fill="white"/>
<path d="M812.16 212.16H856.96L766.4 54.4H729.6L640.64 212.16H680.64L699.2 177.92H793.92L812.16 212.16ZM715.84 147.2L746.88 90.2399L777.28 147.2H715.84Z" fill="white"/>
<path d="M907.52 54.4H901.76H892.8H880.64V212.16H916.48V132.8L915.52 108.48L1038.08 212.16H1044.48H1060.16H1065.6V54.4H1029.76V133.76L1030.72 158.08L907.52 54.4Z" fill="white"/>
<path d="M1267.52 212.16H1145.6C1134.72 212.16 1122.88 209.6 1116.48 201.92C1111.04 195.84 1110.08 185.28 1110.08 176.64V89.9199C1110.08 79.9999 1111.36 69.4399 1117.76 63.0399C1124.16 56.6399 1135.68 54.4 1145.6 54.4H1267.52C1278.4 54.4 1290.24 56.6399 1296.64 64.3199C1301.76 70.3999 1303.04 81.2799 1303.04 89.9199V176.64C1303.04 185.6 1302.08 195.84 1296.64 201.92C1290.24 209.6 1278.4 212.16 1267.52 212.16ZM1149.12 86.0799V180.48H1264V86.0799H1149.12Z" fill="white"/>
<path d="M1482.88 212.16H1538.24L1467.52 153.92H1489.28C1505.92 153.92 1519.68 140.48 1519.68 123.52V84.48C1519.68 67.84 1506.24 54.08 1489.28 54.08H1387.84H1348.8V84.1599V123.2V153.28V212.16H1387.84V153.92H1418.88L1482.88 212.16ZM1387.84 84.48H1473.6C1477.76 84.48 1480.96 87.6799 1480.96 91.8399V116.48C1480.96 120.64 1477.76 123.84 1473.6 123.84H1387.84V84.48Z" fill="white"/>
<path d="M1548.48 54.4V85.7599H1619.2V212.16H1658.24V85.7599H1728.64V54.4H1658.24H1619.2H1548.48Z" fill="white"/>
<path d="M1873.28 114.56H1799.36V84.8H1918.4V54.4H1799.36H1760.32V84.8V114.56V144.96V180.16V212.16H1799.36H1920V180.16H1799.36V144.96H1873.28V114.56Z" fill="white"/>
<path d="M204.8 0C113.6 0 39.68 24 39.68 53.76C39.68 78.72 91.2 99.52 161.28 105.6L190.08 16.96L195.2 107.2C198.4 107.2 201.6 107.2 205.12 107.2C296.32 107.2 370.24 83.1999 370.24 53.4399C369.92 24.3199 296 0 204.8 0Z" fill="white"/>
<path d="M160.32 108.8C71.36 109.76 0 137.92 0 172.8C0 202.24 50.56 226.88 119.68 234.56L160.32 108.8Z" fill="white"/>
<path d="M194.88 109.76L201.92 235.2C275.2 228.8 329.6 203.2 329.6 172.8C329.92 141.44 271.68 115.2 194.88 109.76Z" fill="white"/>
</svg>`.trim();
const logoSvgDataUrl = `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(logoSvgString) : ''}`;


const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleResize = () => setIsDesktop(mediaQuery.matches);

    handleResize(); // Set initial value based on current screen size
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  return isDesktop;
};


const useIsLargeScreen = () => {
  const [isLargeScreen, setIsLargeScreen] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleResize = () => setIsLargeScreen(mediaQuery.matches);

    handleResize(); // Set initial value
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  return isLargeScreen;
};


const App: React.FC = () => {
  return (
    <div className="bg-black text-white min-h-screen font-sans antialiased">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const isLargeScreen = useIsLargeScreen();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    // Only apply scroll logic on large screens
    if (!isLargeScreen) {
      setIsScrolled(false); // Reset on resize
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isLargeScreen]);
  
  // On small screens (< 768px), don't render the header at all.
  if (!isDesktop) {
    return null;
  }

  return (
    <header className={`fixed top-4 z-50 rounded-full bg-black/20 backdrop-blur-lg border border-white/10 shadow-lg transition-all duration-300 ease-in-out ${isScrolled && isLargeScreen ? 'left-32 right-32' : 'left-4 right-4'}`}>
      <nav className="flex items-center py-3 px-6">
        {/* Left section: Logo */}
        <div className="flex flex-1 justify-start">
          <img 
            src="/BanorteText.svg"
            alt="Banorte Logo" 
            className="h-6" 
          />
        </div>

        {/* Center section: Nav links */}

        
        {/* Right section: Button */}
        <div className="flex-1 flex justify-end">
          <Link 
            href="/login"
            className="bg-white text-black font-semibold py-3 px-8 rounded-full border border-white/20 hover:bg-white/20 transition-colors duration-300 shadow-lg"
          >
            Inicia Sesión
          </Link>
        </div>
      </nav>
    </header>
  );
};


const HeroSection: React.FC = () => {
  const isLargeScreen = useIsLargeScreen();

  return (
    <section className="relative w-full h-screen flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <GradientBlinds
            gradientColors={['#e4002b', '#ff5f00']}
            angle={-25}
            noise={0.05}
            blindCount={12}
            blindMinWidth={60}
            mouseDampening={0.08}
            spotlightRadius={0.6}
            spotlightSoftness={0.7}
            spotlightOpacity={0.7}
            distortAmount={0.05}
            shineDirection="right"
            maskSvgUrl={isLargeScreen ? svgDataUrl : undefined}
          />
        </div>
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent" />
      <div className="relative z-10 p-6 flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-shadow font-montserrat">
          Conoce a Proa
        </h1>
        <p className="max-w-3xl text-lg md:text-xl text-gray-200 mb-8 text-shadow-sm">
          Tu copiloto financiero inteligente. Transforma tus datos en decisiones claras y proactivas para anticipar el futuro de tu negocio.
        </p>
        <div className="flex space-x-4">
          <Link 
            href="/login"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 duration-300 shadow-lg"
          >
            Descubre Proa
          </Link>
          <Link 
            href="/login"
            className="bg-white/10 backdrop-blur-sm text-white font-semibold py-3 px-8 rounded-full border border-white/20 hover:bg-white/20 transition-colors duration-300 shadow-lg"
          >
            Inicia Sesión
          </Link>
        </div>
      </div>
      <style>{`
      .text-shadow { text-shadow: 0px 2px 10px rgba(0, 0, 0, 0.5); }
      .text-shadow-sm { text-shadow: 0px 1px 5px rgba(0, 0, 0, 0.5); }
    `}</style>
    </section>
  );
}

const CardBackground = () => (
    <div className="absolute inset-0 z-0 transition-all duration-300 group-hover:bg-red-500/10" />
);

const features = [
  {
    Icon: ChatBubbleIcon,
    name: "ChatBot Financiero AI",
    description: "Conversa con Proa, tu asistente financiero inteligente potenciado por Google Gemini. Obtén análisis instantáneos de tus KPIs, recomendaciones personalizadas y respuestas específicas sobre tu situación financiera.",
    href: "/chatbot",
    cta: "Chatea con Proa",
    background: <CardBackground />,
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: FileTextIcon,
    name: "Dashboard Inteligente",
    description: "Visualiza todos tus datos financieros en tiempo real. Gráficos interactivos, métricas de crecimiento, y análisis de gastos por categoría para usuarios personales y empresariales.",
    href: "/dashboard",
    cta: "Ver Dashboard",
    background: <CardBackground />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: BellIcon,
    name: "Reportes Automáticos",
    description: "Genera reportes financieros detallados automáticamente. Analiza KPIs empresariales, distribución de gastos, tendencias históricas y recomendaciones de optimización presupuestal.",
    href: "/reporte",
    cta: "Ver Reportes",
    background: <CardBackground />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: ArrowUpIcon,
    name: "MCP Technology",
    description: "Tecnología Model Context Protocol que enriquece las respuestas de la IA con análisis financiero avanzado, predicciones inteligentes.",
    href: "/chatbot",
    cta: "Descubre MCP",
    background: <CardBackground />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: BarChartIcon,
    name: "Gestión de Transacciones",
    description: "Administra todas tus transacciones financieras desde una interfaz intuitiva. Registra ingresos y gastos, categoriza movimientos y mantén tu información siempre actualizada.",
    href: "/database",
    cta: "Gestionar Datos",
    background: <CardBackground />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];


const FeaturesSection: React.FC = () => (
  <section className="py-20 bg-black">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold font-montserrat">Inteligencia Financiera a tu Alcance</h2>
        <p className="text-gray-400 mt-2">Descubre las herramientas que Proa te ofrece para tomar el control de tus finanzas.</p>
      </div>
      <BentoGrid>
        {features.map((feature) => (
          <BentoCard key={feature.name} {...feature} />
        ))}
      </BentoGrid>
    </div>
  </section>
);

const Footer: React.FC = () => (
  <footer className="bg-black border-t border-white/10">
    <div className="container mx-auto px-6 py-4 text-center text-gray-400">
      <p>&copy; {new Date().getFullYear()} Banorte. Todos los derechos reservados.</p>
    </div>
  </footer>
);

export default App;