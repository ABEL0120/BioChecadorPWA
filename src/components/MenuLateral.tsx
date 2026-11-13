import React, { useState } from "react";
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonFooter,
  useIonToast,
  IonSpinner,
} from "@ionic/react";
import {
  homeOutline,
  timeOutline,
  calendarOutline,
  syncOutline,
  mailOpenOutline,
  airplaneOutline,
  receiptOutline,
  notificationsOutline,
  documentTextOutline,
  qrCodeOutline,
  downloadOutline,
  chevronDownOutline,
} from "ionicons/icons";
import { useLocation } from "react-router-dom";
import { useAuthSession } from "../context/AuthSessionContext";
import { usePwaInstall } from "../hooks/usePwaInstall";

export const MenuLateral: React.FC = () => {
  const location = useLocation();
  const { refresh, user } = useAuthSession();
  const { isStandalone, openInstallModal } = usePwaInstall();
  const [present] = useIonToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(10);
  const cooldownRef = React.useRef(0);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const listContainerRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollState, setScrollState] = useState({
    canScroll: false,
    canScrollUp: false,
    canScrollDown: false,
    thumbHeightPct: 100,
    thumbTopPct: 0,
  });

  const updateScrollMetrics = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    if (clientHeight <= 0 || maxScroll <= 2) {
      setScrollState((prev) =>
        !prev.canScroll && !prev.canScrollUp && !prev.canScrollDown
          ? prev
          : {
              canScroll: false,
              canScrollUp: false,
              canScrollDown: false,
              thumbHeightPct: 100,
              thumbTopPct: 0,
            },
      );
      return;
    }

    const rawThumbPct = (clientHeight / scrollHeight) * 100;
    const thumbHeightPct = Math.max(18, Math.min(82, rawThumbPct));
    const scrollProgress = Math.max(0, Math.min(1, scrollTop / maxScroll));
    const thumbTopPct = scrollProgress * (100 - thumbHeightPct);

    setScrollState({
      canScroll: true,
      canScrollUp: scrollTop > 4,
      canScrollDown: scrollTop < maxScroll - 4,
      thumbHeightPct,
      thumbTopPct,
    });
  }, []);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    const listEl = listContainerRef.current;
    updateScrollMetrics();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScrollMetrics);
      return () => window.removeEventListener("resize", updateScrollMetrics);
    }

    const observer = new ResizeObserver(() => {
      updateScrollMetrics();
    });
    if (el) observer.observe(el);
    if (listEl) observer.observe(listEl);
    window.addEventListener("resize", updateScrollMetrics);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollMetrics);
    };
  }, [updateScrollMetrics, isStandalone]);

  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleMenuScroll = () => {
    updateScrollMetrics();
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 650);
  };

  const handleScrollDownHint = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({ top: 160, behavior: "smooth" });
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const rect = track.getBoundingClientRect();
    const clickRatio = Math.max(
      0,
      Math.min(1, (e.clientY - rect.top) / rect.height),
    );
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTo({ top: clickRatio * maxScroll, behavior: "smooth" });
  };

  React.useEffect(() => {
    if (!user) {
      setCooldown(0);
      cooldownRef.current = 0;
    }
  }, [user]);

  React.useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => {
          const next = prev - 1;
          cooldownRef.current = next;
          if (next <= 0) {
            clearInterval(interval);
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleRefresh = async () => {
    if (!user) {
      present({
        message: "Inicia sesión primero para actualizar datos.",
        duration: 3000,
        color: "warning",
      });
      return;
    }

    if (cooldownRef.current > 0) {
      let newPenalty = penaltySeconds * 2;
      if (newPenalty > 300) newPenalty = 300;
      setPenaltySeconds(newPenalty);
      setCooldown(newPenalty);
      cooldownRef.current = newPenalty;
      return;
    }

    setIsRefreshing(true);
    const result = await refresh();
    setIsRefreshing(false);

    if (result.success) {
      setPenaltySeconds(10);
      setCooldown(10);
      cooldownRef.current = 10;
    } else {
      setPenaltySeconds(10);
      setCooldown(10);
      cooldownRef.current = 10;
    }

    present({
      message: result.message,
      duration: 3000,
      color: result.success ? "success" : "warning",
      position: "top",
    });
  };

  const appPages = [
    {
      title: "Panel Principal",
      url: "/home",
      icon: homeOutline,
    },
    {
      title: "Historial de Asistencia",
      url: "/historial",
      icon: calendarOutline,
    },
    {
      title: "Mi Horario",
      url: "/horario",
      icon: timeOutline,
    },
    {
      title: "Solicitudes",
      url: "/solicitudes",
      icon: mailOpenOutline,
    },
    {
      title: "Vacaciones",
      url: "/vacaciones",
      icon: airplaneOutline,
    },
    {
      title: "Permisos",
      url: "/permisos",
      icon: documentTextOutline,
    },
    {
      title: "Recibos de Nómina",
      url: "/recibos",
      icon: receiptOutline,
    },
    {
      title: "Recordatorios",
      url: "/notificaciones",
      icon: notificationsOutline,
    },
    {
      title: "Checador Físico",
      url: "/checador-fisico",
      icon: qrCodeOutline,
    },
  ];

  return (
    <IonMenu
      contentId="main-content"
      type="overlay"
      side="start"
      onIonWillOpen={updateScrollMetrics}
      onIonDidOpen={updateScrollMetrics}
    >
      <IonHeader className="ion-no-border">
        <IonToolbar
          className="bg-transparent"
          style={{
            "--background": "transparent",
            "--padding-top": "0px",
            "--padding-bottom": "0px",
            "--padding-start": "0px",
            "--padding-end": "0px",
            "--min-height": "0px",
          }}
        >
          <div className="pt-7 pb-5 px-6 bg-gradient-to-b from-blue-50 to-white border-b border-slate-100 flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <IonIcon icon={timeOutline} className="text-white text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black tracking-tight text-slate-800 m-0 leading-none">
                Reloj Nómina
              </h2>
              <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mt-1">
                Control de Asistencia
              </p>
              <p className="text-[9px] font-medium tracking-widest text-gray-300 mt-1">
                216.250.116.7
              </p>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        scrollY={false}
        style={
          {
            "--background": "#ffffff",
            "--overflow": "hidden",
            "--padding-top": "0px",
            "--padding-bottom": "0px",
            "--padding-start": "0px",
            "--padding-end": "0px",
          } as React.CSSProperties
        }
      >
        <div className="relative h-full min-h-0 w-full bg-white flex flex-col overflow-hidden">
          <div
            ref={scrollContainerRef}
            onScroll={handleMenuScroll}
            className="menu-scroll-hidden flex-1 min-h-0 overflow-y-auto overscroll-contain pl-3 pr-5 py-3"
          >
            <div ref={listContainerRef}>
              <IonList className="bg-transparent py-0" lines="none">
                {appPages.map((appPage, index) => {
                  const isSelected =
                    location.pathname === appPage.url ||
                    (appPage.url === "/home" && location.pathname === "/");
                  return (
                    <IonMenuToggle key={index} autoHide={false}>
                      <IonItem
                        button
                        routerLink={appPage.url}
                        routerDirection="none"
                        className="mb-1.5"
                        detail={false}
                        lines="none"
                        style={{
                          "--padding-start": "0px",
                          "--padding-end": "0px",
                          "--inner-padding-start": "0px",
                          "--inner-padding-end": "0px",
                          "--min-height": "0px",
                          "--background": "transparent",
                          "--background-hover": "transparent",
                          "--background-activated": "transparent",
                        }}
                      >
                        <div
                          className={`flex items-center w-full px-3.5 py-3 rounded-2xl transition-all duration-200 ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-transparent text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <IonIcon
                            icon={appPage.icon}
                            className={`text-[21px] mr-3.5 shrink-0 ${
                              isSelected ? "text-white" : "text-slate-400"
                            }`}
                          />
                          <IonLabel
                            className={`font-bold tracking-wide text-[14.5px] ${
                              isSelected ? "text-white" : "text-slate-700"
                            }`}
                          >
                            {appPage.title}
                          </IonLabel>
                        </div>
                      </IonItem>
                    </IonMenuToggle>
                  );
                })}

                {!isStandalone && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                    <IonMenuToggle autoHide={false}>
                      <IonItem
                        button
                        onClick={openInstallModal}
                        detail={false}
                        lines="none"
                        style={{
                          "--padding-start": "0px",
                          "--padding-end": "0px",
                          "--inner-padding-start": "0px",
                          "--inner-padding-end": "0px",
                          "--min-height": "0px",
                          "--background": "transparent",
                          "--background-hover": "transparent",
                          "--background-activated": "transparent",
                        }}
                      >
                        <div className="flex items-center w-full px-3.5 py-3 rounded-2xl transition-all duration-200 bg-blue-50/80 border border-blue-100 text-blue-700 hover:bg-blue-100/80">
                          <IonIcon
                            icon={downloadOutline}
                            className="text-[21px] mr-3.5 text-blue-600 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold tracking-wide text-[14px] text-slate-800 block leading-tight">
                              Instalar Aplicación
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 block mt-0.5 leading-tight">
                              Disponible en móvil y escritorio
                            </span>
                          </div>
                        </div>
                      </IonItem>
                    </IonMenuToggle>
                  </div>
                )}
              </IonList>
            </div>
          </div>

          {scrollState.canScrollUp && (
            <div className="pointer-events-none absolute top-0 left-0 right-3 h-5 bg-gradient-to-b from-white via-white/80 to-transparent z-10" />
          )}

          {scrollState.canScrollDown && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-3 h-10 bg-gradient-to-t from-white via-white/90 to-transparent z-10 flex items-end justify-center pb-1.5">
              <button
                type="button"
                onClick={handleScrollDownHint}
                aria-label="Desplazar menú hacia abajo"
                className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-slate-500 text-[10px] font-bold tracking-wide transition-colors active:scale-95"
              >
                <span>Más opciones</span>
                <IonIcon icon={chevronDownOutline} className="text-xs" />
              </button>
            </div>
          )}

          {scrollState.canScroll && (
            <div
              ref={trackRef}
              onClick={handleTrackClick}
              aria-hidden="true"
              className="absolute right-1.5 top-2.5 bottom-2.5 w-1.5 rounded-full bg-slate-100 cursor-pointer z-20"
            >
              <div
                className={`absolute left-0 right-0 rounded-full transition-colors duration-200 ${
                  isScrolling
                    ? "bg-blue-500/80"
                    : "bg-slate-300/90 hover:bg-slate-400"
                }`}
                style={{
                  top: `${scrollState.thumbTopPct}%`,
                  height: `${scrollState.thumbHeightPct}%`,
                }}
              />
            </div>
          )}
        </div>
      </IonContent>

      <IonFooter className="ion-no-border bg-white border-t border-slate-100">
        <div className="px-5 pb-6 pt-3 flex flex-col items-center">
          <button
            onClick={handleRefresh}
            className={`flex items-center justify-center gap-2 w-full py-3.5 squircle font-bold tracking-wide transition-all duration-300 ${
              cooldown > 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
            }`}
          >
            {isRefreshing ? (
              <IonSpinner name="crescent" className="w-5 h-5" />
            ) : (
              <IonIcon
                icon={syncOutline}
                className={`text-xl ${cooldown > 0 ? "opacity-50" : ""}`}
              />
            )}
            {cooldown > 0 ? `Espera ${cooldown}s` : "Sincronizar"}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase hover:text-slate-700 transition-colors bg-transparent border-none mt-3.5"
          >
            Forzar Recarga
          </button>
        </div>
      </IonFooter>
    </IonMenu>
  );
};
