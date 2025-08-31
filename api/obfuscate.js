import luaparse from 'luaparse';

// Random name generator
function randomName(len = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

// Encode string bằng XOR + Base64
function encodeString(str) {
  const key = Math.floor(Math.random() * 255);
  const encoded = Buffer.from(
    str.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ key)).join('')
  ).toString('base64');
  return { encoded, key };
}

// Insert junk code
function insertJunk() {
  const junkVar = randomName();
  const junkFunc = randomName();
  return `\nlocal ${junkVar} = ${Math.floor(Math.random() * 1000)}\nlocal function ${junkFunc}() return ${Math.floor(Math.random() * 100)} end\n`;
}

// Runtime decrypt function
function runtimeDecrypt() {
  return `
local function decrypt(s,k)
  local t = {}
  for i=1,#s do
    t[i] = string.char(bit32.bxor(string.byte(s,i), k))
  end
  return table.concat(t)
end
`;
}

// Traverse AST and obfuscate identifiers & strings
function traverseAST(node) {
  if (!node) return;
  switch(node.type){
    case 'Identifier':
      node.name = randomName();
      break;
    case 'StringLiteral':
      const { encoded, key } = encodeString(node.value);
      node.value = `load(decrypt("${encoded}", ${key}))()`;
      break;
  }
  for (const k in node) {
    if (node[k] && typeof node[k] === 'object') traverseAST(node[k]);
  }
}

// Flatten control flow (simple example)
function flattenControlFlow(code) {
  return code.replace(/if (.+?) then/g, "while true do local _cond = $1; if _cond then");
}

// Main obfuscate function
function obfuscateLua(code) {
  const ast = luaparse.parse(code, { luaVersion: '5.3' });
  traverseAST(ast);
  let obfuscated = code;
  obfuscated = flattenControlFlow(obfuscated);
  obfuscated = runtimeDecrypt() + insertJunk() + obfuscated;
  obfuscated = `if debug.getinfo(1) then error("Debug not allowed") end\n` + obfuscated;
  return obfuscated;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    const obfuscated = obfuscateLua(code);
    res.status(200).json({ result: obfuscated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
