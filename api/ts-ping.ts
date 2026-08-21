export default function handler(_req: any, res: any) {
  res.status(200).json({ ok: true, from: 'zero-import TS handler', node: process.version });
}
