/**
 * PWA Install Controller para Nube para Pymes
 * Administra la instalación de escritorio (Windows, macOS, Linux) y navegadores (Chrome, Edge, Safari, Firefox).
 */

(function () {
  'use strict';

  // Registrar Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then((reg) => {
          // Registro exitoso
        })
        .catch((err) => {
          console.warn('[PWA] Error al registrar Service Worker:', err);
        });
    });
  }

  // Almacenar el prompt diferido
  window.__pwaDeferredPrompt = null;
  window.__pwaIsInstalled = false;

  // Detectar modo standalone (ya instalada y abierta como app)
  function isRunningStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  window.__pwaIsInstalled = isRunningStandalone();

  // Escuchar evento beforeinstallprompt (Chromium: Chrome, Edge, Brave, Opera)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__pwaDeferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready', { detail: { prompt: e } }));
  });

  // Escuchar evento de instalación completada
  window.addEventListener('appinstalled', (e) => {
    window.__pwaDeferredPrompt = null;
    window.__pwaIsInstalled = true;
    window.dispatchEvent(new CustomEvent('pwa-installed', { detail: e }));
  });

  // Detección de Plataforma y Navegador
  function getPlatformInfo() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';

    let os = 'other';
    let osName = 'Escritorio';
    if (/Macintosh|MacIntel|MacPPC|Mac68K|Mac OS X/i.test(ua) || /Mac/i.test(platform)) {
      os = 'mac';
      osName = 'macOS';
    } else if (/Win32|Win64|Windows|WinCE/i.test(ua) || /Win/i.test(platform)) {
      os = 'windows';
      osName = 'Windows';
    } else if (/CrOS/i.test(ua)) {
      os = 'chromeos';
      osName = 'ChromeOS';
    } else if (/Linux/i.test(ua) && !/Android/i.test(ua)) {
      os = 'linux';
      osName = 'Linux';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      os = 'ios';
      osName = 'iOS';
    } else if (/Android/i.test(ua)) {
      os = 'android';
      osName = 'Android';
    }

    let browser = 'other';
    let browserName = 'Navegador';
    if (/Edg\//i.test(ua)) {
      browser = 'edge';
      browserName = 'Microsoft Edge';
    } else if (/OPR\/|Opera/i.test(ua)) {
      browser = 'opera';
      browserName = 'Opera';
    } else if (/Firefox\//i.test(ua)) {
      browser = 'firefox';
      browserName = 'Mozilla Firefox';
    } else if (/Chrome\//i.test(ua)) {
      browser = 'chrome';
      browserName = 'Google Chrome';
    } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
      browser = 'safari';
      browserName = 'Safari';
    }

    return { os, osName, browser, browserName };
  }

  // Guía de instalación paso a paso según el entorno
  function getInstallGuide() {
    const { os, osName, browser, browserName } = getPlatformInfo();

    if (os === 'mac' && browser === 'safari') {
      return {
        title: 'Instalar en macOS (Safari)',
        subtitle: 'En Safari para macOS Sonoma (14) o superior:',
        steps: [
          'En la barra de menús superior de tu Mac, haz clic en <strong>Archivo</strong> (o en el botón Compartir <svg style="display:inline;vertical-align:-2px;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>).',
          'Selecciona la opción <strong>"Agregar al Dock..."</strong>.',
          'Haz clic en <strong>"Agregar"</strong> en el cuadro emergente para confirmar.'
        ],
        tip: 'La aplicación se integrará a tu Dock y al Launchpad como una app nativa independiente de Mac, con su propia ventana.',
        badge: 'macOS Dock'
      };
    }

    if (browser === 'edge') {
      return {
        title: 'Instalar en Microsoft Edge',
        subtitle: `En tu equipo ${osName}:`,
        steps: [
          'Busca el icono de <strong>Aplicación disponible (⊞ / monitor)</strong> en la parte derecha de la barra de direcciones (URL).',
          'Haz clic en él y pulsa <strong>"Instalar"</strong>.',
          'O haz clic en el menú <strong>(...)</strong> arriba a la derecha > <strong>Aplicaciones</strong> > <strong>"Instalar este sitio como una aplicación"</strong>.'
        ],
        tip: 'Tendrás acceso directo en tu Escritorio, Barra de tareas y Menú Inicio sin barras de navegador.',
        badge: 'Edge PWA'
      };
    }

    if (browser === 'chrome' || browser === 'opera') {
      return {
        title: `Instalar en ${browserName}`,
        subtitle: `En tu equipo ${osName}:`,
        steps: [
          'Haz clic en el icono <strong>Instalar (⊕ / monitor con flecha)</strong> ubicado a la derecha en la barra de direcciones (URL).',
          'Haz clic en <strong>"Instalar"</strong> en el diálogo de confirmación.',
          'O haz clic en el menú de tres puntos <strong>(⋮)</strong> > <strong>"Guardar y compartir"</strong> (o "Transmitir, guardar y compartir") > <strong>"Instalar Nube para Pymes..."</strong>.'
        ],
        tip: 'Se creará un acceso directo en tu Escritorio y funcionará como una aplicación de escritorio nativa.',
        badge: `${osName} Desktop`
      };
    }

    if (browser === 'firefox') {
      return {
        title: 'Instalar en Mozilla Firefox',
        subtitle: 'Compatibilidad de escritorio:',
        steps: [
          'Firefox no cuenta con instalación nativa de PWA en ventana independiente en escritorio.',
          'Para la mejor experiencia de app nativa en tu escritorio, te recomendamos abrir este portal en <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong> o <strong>Safari (macOS)</strong> e instalarlo desde allí.',
          'También puedes arrastrar el candado de la barra de direcciones hacia tu escritorio para crear un acceso directo rápido.'
        ],
        tip: 'Todas las herramientas seguirán funcionando perfectamente en tu navegador actual.',
        badge: 'Acceso directo'
      };
    }

    return {
      title: 'Instalar en tu Escritorio',
      subtitle: `Para tu equipo ${osName}:`,
      steps: [
        'Abre el menú de opciones de tu navegador web.',
        'Busca la opción <strong>"Instalar Nube para Pymes"</strong> o <strong>"Agregar a la pantalla de inicio"</strong>.',
        'Confirma la instalación para disfrutar de la experiencia en ventana completa.'
      ],
      tip: 'Funciona como una app de escritorio ligera, rápida y segura.',
      badge: 'Escritorio'
    };
  }

  // API pública
  window.pwaInstall = {
    isStandalone: isRunningStandalone,
    canPromptDirectly: () => !!window.__pwaDeferredPrompt,
    getPlatform: getPlatformInfo,
    getGuide: getInstallGuide,
    promptInstall: async function () {
      if (window.__pwaDeferredPrompt) {
        try {
          const promptEvent = window.__pwaDeferredPrompt;
          promptEvent.prompt();
          const choiceResult = await promptEvent.userChoice;
          if (choiceResult.outcome === 'accepted') {
            window.__pwaDeferredPrompt = null;
            window.__pwaIsInstalled = true;
            return { outcome: 'accepted', guideNeeded: false };
          } else {
            return { outcome: 'dismissed', guideNeeded: false };
          }
        } catch (err) {
          console.warn('[PWA] Error durante el prompt:', err);
          return { outcome: 'error', guideNeeded: true, error: err };
        }
      }
      return { outcome: 'unsupported', guideNeeded: true };
    }
  };
})();
