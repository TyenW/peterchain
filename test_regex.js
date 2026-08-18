const sigs = [
  "+Curso N:1 Area",
  "Area[integrante] N:1 Area[integrada]",
  "Aluno N:N Curso"
];
const regex = /^\s*([^\(\[\:–\-]+?)\s*(?:\[([^\]]+)\])?\s*\(?\s*([1nmNM])\s*\)?\s*(?::|\-|–)\s*\(?\s*([1nmNM])\s*\)?\s*([^\(\[\:–\-]+?)\s*(?:\[([^\]]+)\])?\s*$/i;

for (const sig of sigs) {
  const m = sig.match(regex);
  console.log(`Sig: ${sig} -> ${m ? 'MATCHED' : 'FAILED'}`);
  if (m) console.log(m.slice(1));
}
