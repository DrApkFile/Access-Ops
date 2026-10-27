import {inspectBinaryStl} from '../../src/geometry/stl-validate'
const filename=process.argv[2]
if(!filename)throw new Error('Usage: bun apps/api/scripts/geometry-benchmark/check-stl.ts /path/to/download.stl')
console.log(JSON.stringify({file:filename,...inspectBinaryStl(await Bun.file(filename).bytes())},null,2))
