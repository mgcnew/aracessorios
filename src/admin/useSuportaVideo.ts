import { useSyncExternalStore } from 'react';
import { suportaVideo } from './video';

/** O navegador sabe codificar vídeo? No servidor assume que sim (senão o HTML sairia diferente do navegador e a página reclamaria). */
export const useSuportaVideo = () => useSyncExternalStore(() => () => {}, suportaVideo, () => true);
