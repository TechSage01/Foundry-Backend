import { Request, Response } from "express";

export const logger = (req: Request, res: Response, next: Function) => {
  const now = new Date()
  const date = now.toLocaleDateString('en-NG')
  const time = now.toLocaleTimeString('en-NG')
  const ip = req.ip || req.socket.remoteAddress

  console.log(`[${date} ${time}] ${req.method} ${req.path}`)

  res.on('finish', () => {
    console.log(
      `(${ip}) [${date} ${time}] ${req.method} ${req.path} - ${res.statusCode} ${res.statusMessage}`
    )
  })

  next()
}

export default logger