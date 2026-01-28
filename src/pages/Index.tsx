import { Link } from "react-router-dom";
import { Shield, Clock, CheckCircle, UserCheck, Waves, GraduationCap, Building2, ArrowRight, Mail, Menu, Instagram } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MovingBorderButton } from "@/components/ui/moving-border";
import { Button as NeonButton } from "@/components/ui/neon-button";
import { useEffect, useRef, useState } from "react";

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, {
    damping: 50,
    stiffness: 400
  });
  const smoothMouseY = useSpring(mouseY, {
    damping: 50,
    stiffness: 400
  });

  // Hooks useTransform doivent être appelés au niveau du composant (règles des hooks React)
  const particleTranslateX = useTransform(smoothMouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [-30, 30]);
  const particleTranslateY = useTransform(smoothMouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1080], [-30, 30]);
  const particleOpacity = useTransform(smoothMouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [0.1, 0.3]);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const container = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: {
      opacity: 0,
      y: 20
    },
    show: {
      opacity: 1,
      y: 0
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" onMouseMove={handleMouseMove}>
      <div className="fixed inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white/20 rounded-full"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              x: particleTranslateX,
              y: particleTranslateY,
              opacity: particleOpacity
            }}
          />
        ))}
      </div>

      <motion.div className="min-h-screen relative" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 1
    }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E2761] via-[#408CFF] to-[#0EA5E9]">
          <motion.div className="absolute inset-0" animate={{
          background: ["radial-gradient(circle at 0% 0%, rgba(30,39,97,0.3) 0%, transparent 70%)", "radial-gradient(circle at 100% 100%, rgba(30,39,97,0.3) 0%, transparent 70%)", "radial-gradient(circle at 0% 100%, rgba(30,39,97,0.3) 0%, transparent 70%)", "radial-gradient(circle at 100% 0%, rgba(30,39,97,0.3) 0%, transparent 70%)"]
        }} transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse"
        }} />
        </div>

        <div className="absolute inset-0 overflow-hidden">
          {Array.from({
          length: 5
        }).map((_, i) => <motion.div key={i} className="absolute rounded-full mix-blend-overlay backdrop-blur-3xl" style={{
          width: `${Math.random() * 500 + 200}px`,
          height: `${Math.random() * 500 + 200}px`,
          background: `radial-gradient(circle, rgba(64,140,255,${Math.random() * 0.05 + 0.05}) 0%, transparent 70%)`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`
        }} animate={{
          x: [0, 20, 0],
          y: [0, 20, 0],
          scale: [1, 1.05, 1],
          rotate: [0, 180, 360]
        }} transition={{
          duration: Math.random() * 15 + 15,
          repeat: Infinity,
          ease: "linear"
        }} />)}
        </div>

        <div className="relative z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="w-full flex justify-between items-center">
              <div></div>
              <div className="hidden sm:flex gap-2 sm:gap-4">
                <Link to="/auth" state={{
                mode: "login"
              }}>
                  <motion.div whileHover={{
                  scale: 1.05
                }} whileTap={{
                  scale: 0.95
                }}>
                    <Button variant="outline" className="w-full sm:w-auto relative overflow-hidden bg-white/5 text-white border-white/20 backdrop-blur-sm group">
                      <span className="relative z-10">Connexion</span>
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-[#408CFF]/20 to-[#0EA5E9]/20" animate={{
                      x: ["-100%", "100%"]
                    }} transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }} />
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/auth" state={{
                mode: "signup"
              }}>
                  <motion.div whileHover={{
                  scale: 1.05
                }} whileTap={{
                  scale: 0.95
                }}>
                    <Button className="w-full sm:w-auto relative overflow-hidden">
                      <span className="relative z-10 text-white">Inscription</span>
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-[#408CFF] to-[#0EA5E9]" animate={{
                      background: ["linear-gradient(to right, #408CFF, #0EA5E9)", "linear-gradient(to right, #0EA5E9, #408CFF)"]
                    }} transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }} />
                    </Button>
                  </motion.div>
                </Link>
              </div>

              <div className="sm:hidden relative z-[100]">
                <motion.button whileHover={{
                scale: 1.05
              }} whileTap={{
                scale: 0.95
              }} onClick={() => setIsMenuOpen(!isMenuOpen)} className="relative z-50 p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/20">
                  <Menu className="w-6 h-6 text-white" />
                </motion.button>

                <AnimatePresence>
                  {isMenuOpen && <motion.div initial={{
                  opacity: 0,
                  y: -20
                }} animate={{
                  opacity: 1,
                  y: 0
                }} exit={{
                  opacity: 0,
                  y: -20
                }} transition={{
                  duration: 0.2
                }} className="fixed top-[60px] right-4 p-2 min-w-[200px] rounded-lg bg-[#1E2761]/95 backdrop-blur-xl border border-white/20 shadow-2xl z-[150]">
                      <div className="flex flex-col gap-2">
                        <Link to="/auth" state={{
                      mode: "login"
                    }} onClick={() => setIsMenuOpen(false)}>
                          <motion.div whileHover={{
                        scale: 1.02
                      }} whileTap={{
                        scale: 0.98
                      }} className="w-full p-2 rounded-md bg-white/10 text-white font-medium hover:bg-white/20 transition-colors">
                            Connexion
                          </motion.div>
                        </Link>
                        <Link to="/auth" state={{
                      mode: "signup"
                    }} onClick={() => setIsMenuOpen(false)}>
                          <motion.div whileHover={{
                        scale: 1.02
                      }} whileTap={{
                        scale: 0.98
                      }} className="w-full p-2 rounded-md bg-[#408CFF] text-white font-medium hover:bg-[#3672cc] transition-colors">
                            Inscription
                          </motion.div>
                        </Link>
                      </div>
                    </motion.div>}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
            <motion.div initial="hidden" animate="show" variants={container} className="text-center relative">
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full blur-3xl" animate={{
              background: ["radial-gradient(circle, rgba(64,140,255,0.15) 0%, transparent 80%)", "radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 80%)"],
              scale: [1, 1.1, 1]
            }} transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }} />
              
              <motion.img variants={item} src="/lovable-uploads/32069037-2f3a-44ac-9105-33ae1d029573.png" alt="Probain Aquatic Network Logo" className="w-48 sm:w-64 lg:w-96 h-auto mx-auto mb-6 sm:mb-8 relative drop-shadow-[0_0_15px_rgba(64,140,255,0.2)]" style={{
              filter: "brightness(1.1)"
            }} whileHover={{
              scale: 1.05,
              filter: "brightness(1.2)",
              transition: {
                duration: 0.3
              }
            }} />
              <motion.div variants={item}>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 text-white">
                  Connectez, formez, sauvez !
                </h1>
              </motion.div>
              <motion.p variants={item} className="text-base sm:text-lg lg:text-xl text-white/90 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4 sm:px-0">
                Que vous soyez sauveteur, formateur ou employeur, Probain est la plateforme qui vous connecte.
                Trouvez des missions, développez vos compétences et recrutez facilement des professionnels qualifiés.
              </motion.p>

              <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto mb-8 sm:mb-12 lg:mb-16 px-4 sm:px-6 lg:px-0">
                {[{
                icon: Waves,
                title: "Sauveteurs",
                description: "Trouvez des opportunités près de chez vous"
              }, {
                icon: GraduationCap,
                title: "Formateurs",
                description: "Partagez votre expertise et formez les futurs professionnels"
              }, {
                icon: Building2,
                title: "Employeurs",
                description: "Recrutez les meilleurs talents en quelques clics"
              }].map((card, index) => <motion.div key={index} variants={item} whileHover={{
                scale: 1.02,
                rotateY: 5,
                rotateX: 5
              }} className="group relative">
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#408CFF] to-[#0EA5E9] opacity-30 blur transition duration-500 group-hover:opacity-60" />
                    <div className="relative backdrop-blur-xl bg-white/5 p-6 sm:p-8 rounded-xl border border-white/10">
                      <motion.div animate={{
                    y: [0, -8, 0]
                  }} transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.3
                  }} className="relative">
                        <card.icon className="w-12 h-12 sm:w-14 sm:h-14 text-white/90 mb-4 sm:mb-6 mx-auto drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                      </motion.div>
                      <h3 className="text-xl sm:text-2xl text-white font-semibold mb-2 sm:mb-4">{card.title}</h3>
                      <p className="text-base sm:text-lg text-white/80">{card.description}</p>
                    </div>
                  </motion.div>)}
              </motion.div>

              <motion.div variants={item} className="relative px-4 sm:px-0">
                <Link to="/auth" state={{
                mode: "signup"
              }}>
                  <NeonButton variant="solid" size="lg" className="!bg-primary hover:!bg-primary-light !text-white w-full sm:w-auto transition-all duration-300">
                    Inscription gratuite <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 inline-block" />
                  </NeonButton>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="relative py-16 sm:py-24 lg:py-32 overflow-hidden bg-[#0A1033]">
        <motion.div className="absolute inset-0" animate={{
        background: ["radial-gradient(circle at 0% 0%, #408CFF 0%, transparent 50%)", "radial-gradient(circle at 100% 100%, #408CFF 0%, transparent 50%)", "radial-gradient(circle at 0% 100%, #408CFF 0%, transparent 50%)", "radial-gradient(circle at 100% 0%, #408CFF 0%, transparent 50%)"]
      }} transition={{
        duration: 10,
        repeat: Infinity,
        repeatType: "reverse"
      }} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#408CFF] to-[#0EA5E9] opacity-50 blur-xl transition duration-500" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10">
              <div className="relative pb-[56.25%] h-0">
                <iframe className="absolute top-0 left-0 w-full h-full" src="https://www.youtube.com/embed/rRqtAuEmC0g" title="Présentation Probain" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Section: Un réseau engagé pour la sécurité aquatique */}
      <div className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-gradient-to-b from-[#0A1033] to-[#1E2761]">
        <motion.div className="absolute inset-0" animate={{
        background: ["radial-gradient(circle at 0% 0%, #9b87f5 0%, transparent 50%)", "radial-gradient(circle at 100% 100%, #408CFF 0%, transparent 50%)", "radial-gradient(circle at 0% 100%, #0EA5E9 0%, transparent 50%)"]
      }} transition={{
        duration: 10,
        repeat: Infinity,
        repeatType: "reverse"
      }} />

        {/* Floating particles decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={`network-particle-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-[#0EA5E9]/30"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial="hidden" whileInView="show" viewport={{
          once: true
        }} variants={container} className="text-center">
            {/* Badge */}
            <motion.div variants={item} className="flex justify-center mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium shadow-lg">
                <Shield className="w-4 h-4 text-[#0EA5E9]" />
                Réseau Professionnel Certifié
              </span>
            </motion.div>

            <motion.h2 variants={item} className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-[#408CFF] via-[#0EA5E9] to-[#9b87f5] bg-clip-text text-transparent px-4 sm:px-0 leading-tight">
              Un réseau engagé pour la sécurité aquatique
            </motion.h2>
            <motion.p variants={item} className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto mb-14 sm:mb-20 leading-relaxed px-4 sm:px-0">
              Chaque seconde compte. Avec <span className="font-semibold text-[#0EA5E9]">PROBAIN</span>, accédez à une plateforme qui facilite la mise en relation des professionnels de la surveillance aquatique.
            </motion.p>

            <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-0">
              {[{
              icon: Clock,
              title: "Gagnez du temps",
              description: "Simplifiez vos recherches et vos recrutements grâce à notre algorithme intelligent",
              gradient: "from-[#408CFF] to-[#0EA5E9]",
              iconBg: "bg-[#408CFF]/20"
            }, {
              icon: UserCheck,
              title: "Profils vérifiés",
              description: "Accédez à une communauté de professionnels certifiés et qualifiés",
              gradient: "from-[#0EA5E9] to-[#9b87f5]",
              iconBg: "bg-[#0EA5E9]/20"
            }, {
              icon: Shield,
              title: "Sécurité prioritaire",
              description: "Garantissez la sécurité de vos installations avec les meilleurs talents",
              gradient: "from-[#9b87f5] to-[#408CFF]",
              iconBg: "bg-[#9b87f5]/20"
            }].map((feature, index) => <motion.div key={index} variants={item} whileHover={{
              scale: 1.03,
              y: -8
            }} transition={{ type: "spring", stiffness: 300 }} className="group relative">
                  <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 blur-xl transition-all duration-500 group-hover:opacity-40`} />
                  <div className="relative backdrop-blur-xl bg-white/[0.08] p-8 sm:p-10 rounded-2xl border border-white/10 h-full transition-all duration-300 group-hover:bg-white/[0.12] group-hover:border-white/20">
                    <motion.div
                      className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 rounded-2xl ${feature.iconBg} backdrop-blur-sm flex items-center justify-center border border-white/10`}
                      animate={{
                        y: [0, -6, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.3
                      }}
                    >
                      <feature.icon className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
                    </motion.div>
                    <h3 className="text-xl sm:text-2xl text-white font-bold mb-3 sm:mb-4">{feature.title}</h3>
                    <p className="text-base sm:text-lg text-white/70 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>)}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Section: Pourquoi choisir PROBAIN */}
      <div className="relative py-20 sm:py-28 lg:py-36 bg-gradient-to-b from-[#1E2761] to-[#0A1033] overflow-hidden">
        {/* Wave decoration top */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180">
          <svg className="relative block w-full h-16 sm:h-24" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#1E2761" fillOpacity="0.3"></path>
          </svg>
        </div>

        {/* Background glow effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            animate={{
              background: [
                "radial-gradient(circle, rgba(64,140,255,0.1) 0%, transparent 70%)",
                "radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)",
                "radial-gradient(circle, rgba(155,135,245,0.1) 0%, transparent 70%)",
              ],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial="hidden" whileInView="show" viewport={{
          once: true
        }} variants={container} className="text-center">
            {/* Badge */}
            <motion.div variants={item} className="flex justify-center mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#408CFF]/20 to-[#9b87f5]/20 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
                <CheckCircle className="w-4 h-4 text-green-400" />
                La plateforme de confiance
              </span>
            </motion.div>

            <motion.h2 variants={item} className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-[#408CFF] via-[#0EA5E9] to-[#9b87f5] bg-clip-text text-transparent leading-tight">
              Pourquoi choisir PROBAIN ?
            </motion.h2>

            <motion.p variants={item} className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-14 sm:mb-20 leading-relaxed">
              Une plateforme conçue par et pour les professionnels de la sécurité aquatique en Suisse
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {[{
              icon: CheckCircle,
              title: "Simple & efficace",
              description: "Interface intuitive pour un accès rapide aux opportunités et aux professionnels qualifiés",
              gradient: "from-[#408CFF] to-[#0EA5E9]",
              iconColor: "text-[#0EA5E9]",
              number: "01"
            }, {
              icon: Shield,
              title: "100% sécurisé",
              description: "Profils vérifiés manuellement et formations certifiées SSS pour garantir la qualité",
              gradient: "from-[#0EA5E9] to-[#9b87f5]",
              iconColor: "text-[#9b87f5]",
              number: "02"
            }, {
              icon: UserCheck,
              title: "Pensé pour vous",
              description: "Solution gratuite pour les sauveteurs et formateurs. Créée pour la communauté aquatique",
              gradient: "from-[#9b87f5] to-[#408CFF]",
              iconColor: "text-[#408CFF]",
              number: "03"
            }].map((feature, index) => (
              <motion.div
                key={index}
                variants={item}
                whileHover={{
                  scale: 1.02,
                  y: -5,
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group relative"
              >
                {/* Card glow on hover */}
                <div className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-r ${feature.gradient} opacity-0 blur-lg transition-all duration-500 group-hover:opacity-30`} />

                <div className="relative bg-white/[0.06] backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-white/10 h-full flex flex-col transition-all duration-300 group-hover:bg-white/[0.1] group-hover:border-white/20">
                  {/* Number badge */}
                  <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
                    <span className={`text-4xl sm:text-5xl font-bold bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent opacity-20 group-hover:opacity-40 transition-opacity`}>
                      {feature.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="mb-6 sm:mb-8">
                    <motion.div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} p-[2px] shadow-lg`}
                      animate={{
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.3
                      }}
                    >
                      <div className="w-full h-full rounded-2xl bg-[#0A1033] flex items-center justify-center">
                        <feature.icon className={`w-8 h-8 sm:w-10 sm:h-10 ${feature.iconColor}`} />
                      </div>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl sm:text-2xl text-white font-bold mb-3 sm:mb-4 text-left">{feature.title}</h3>
                  <p className="text-base sm:text-lg text-white/70 leading-relaxed text-left flex-grow">{feature.description}</p>

                  {/* Bottom accent line */}
                  <div className={`h-1 w-16 rounded-full bg-gradient-to-r ${feature.gradient} mt-6 opacity-50 group-hover:opacity-100 group-hover:w-24 transition-all duration-300`} />
                </div>
              </motion.div>
            ))}
            </div>
          </motion.div>
        </div>
      </div>

      <footer className="relative bg-[#1E2761] border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="space-y-4">
              <motion.img whileHover={{
              scale: 1.05
            }} src="/lovable-uploads/32069037-2f3a-44ac-9105-33ae1d029573.png" alt="Probain Aquatic Network Logo" className="w-40 h-auto" />
              <p className="text-white/70">
                La plateforme de référence pour les professionnels de la natation en Suisse.
              </p>
            </motion.div>

            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Contact</h3>
              <ul className="space-y-3">
                <motion.li initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: 0.2
              }} className="flex items-center space-x-3 text-white/70 hover:text-white transition-colors">
                  <Mail className="h-5 w-5 text-[#0EA5E9]" />
                  <a href="mailto:contact@probain.ch" className="hover:text-[#0EA5E9] transition-colors">
                    contact@probain.ch
                  </a>
                </motion.li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Navigation Rapide</h3>
              <ul className="space-y-2">
                <motion.li initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: 0.3
              }}>
                  <Link to="/auth" className="text-white/70 hover:text-[#0EA5E9] transition-colors">
                    Connexion
                  </Link>
                </motion.li>
                <motion.li initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: 0.4
              }}>
                  <Link to="/auth" className="text-white/70 hover:text-[#0EA5E9] transition-colors">
                    Inscription
                  </Link>
                </motion.li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Suivez-nous</h3>
              <div className="flex space-x-4">
                <motion.a href="https://instagram.com/probain.ch?utm_source=qr&igsh=MWZ2Z3ZxaW5tOGYxZA==" target="_blank" rel="noopener noreferrer" initial={{
                scale: 0.8,
                opacity: 0
              }} animate={{
                scale: 1,
                opacity: 1
              }} transition={{
                delay: 0.5
              }} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <Instagram className="h-5 w-5 text-white" />
                </motion.a>
              </div>
            </div>
          </div>

          <motion.div initial={{
          opacity: 0
        }} whileInView={{
          opacity: 1
        }} viewport={{
          once: true
        }} className="pt-8 mt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-white/50 text-sm text-center sm:text-left">
                © 2024 Probain. Tous droits réservés.
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                <Link to="/privacy" className="text-white/50 hover:text-white text-sm transition-colors text-center sm:text-left">
                  Politique de confidentialité
                </Link>
                <Link to="/terms" className="text-white/50 hover:text-white text-sm transition-colors text-center sm:text-left">
                  Conditions d'utilisation
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
