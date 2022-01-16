import { RawData, WebSocket, WebSocketServer } from 'ws'

const wsServer = new WebSocketServer({ port: Number(process.env.PORT) || 8080 })
const connections = new Map<string, WebSocket[]>()

function onMessage(this: WebSocket, message: RawData) {
  const clients = connections.get(this.url)
  if (!clients) {
    return
  }

  for (const client of clients) {
    if (client !== this && client.readyState === WebSocket.OPEN) {
      client.send(message, (err) => {
        if (err !== null) console.error('Message send error', err)
      })
    }
  }
}

function onClose(this: WebSocket) {
  const clients = connections.get(this.url)
  if (!clients) {
    return
  }

  const index = clients.indexOf(this)
  if (index >= 0) {
    clients.splice(index, 1)
  }
  if (clients.length < 1) {
    connections.delete(this.url)
  }
}

function onPing(this: WebSocket) {
  this.pong()
}

wsServer.on('connection', (ws) => {
  const url = ws.url
  if (connections.has(url)) {
    connections.get(url)!.push(ws)
  } else {
    connections.set(url, [ws])
  }

  ws.on('message', onMessage)
  ws.on('close', onClose)
  ws.on('error', onClose)
  ws.on('ping', onPing)
})
