import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowRight } from 'lucide-react';

export function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Cinematic Background Glows */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none opacity-70" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 rounded-[100%] blur-[120px] pointer-events-none mix-blend-screen" />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl text-center relative z-10 w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-surface-border text-xs font-medium text-text-muted mb-4 shadow-glass">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Ecossistema Seven Group
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 leading-[1.1]">
            Você não está entrando <br className="hidden md:block" />
            apenas em uma empresa.
          </h1>
          
          <h2 className="text-xl md:text-2xl font-medium text-primary tracking-tight max-w-2xl mx-auto">
            Você está entrando em um ecossistema criado para gerar performance no mercado imobiliário.
          </h2>
          
          <p className="text-base md:text-lg text-text-muted max-w-xl mx-auto leading-relaxed font-light">
            Sua jornada foi personalizada para que você aprenda exatamente o que precisa para performar bem na sua função.
          </p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="pt-8"
          >
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="group"
            >
              Iniciar minha jornada
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Grid Lines Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>
  );
}
