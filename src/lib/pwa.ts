// Ajudas de PWA no navegador (instalação e detecção do iPhone). Só use em componentes de cliente.

export function ehIos() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Rodando como aplicativo instalado (tela inicial), e não numa aba do navegador. */
export function estaInstalado() {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}
