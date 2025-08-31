import { obfuscateLua } from '../../lib/backend';

export default async function handler(req, res){
  if(req.method === 'POST'){
    try{
      const { code } = req.body;
      const obfuscated = obfuscateLua(code);
      res.status(200).json({ result: obfuscated });
    }catch(e){
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
