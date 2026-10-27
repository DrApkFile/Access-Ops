import {fileURLToPath} from 'node:url'
import {existsSync} from 'node:fs'
const candidates=['../../assets/fonts/LiberationSans-Regular.ttf','../assets/fonts/LiberationSans-Regular.ttf'].map(p=>fileURLToPath(new URL(p,import.meta.url)))
const fontFile=candidates.find(existsSync)
if(!fontFile)throw new Error('Bundled SVG font missing; include apps/api/assets in deployment')
// OFL font, with its license: stable labels without scanning the host font tree.
export const svgFont={fontFiles:[fontFile],loadSystemFonts:false,defaultFontFamily:'Liberation Sans',sansSerifFamily:'Liberation Sans'}
