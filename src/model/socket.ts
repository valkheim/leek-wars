import { env } from '@/env'
import { LeekWars } from '@/model/leekwars'
import { vueMain } from '@/model/vue'
import { store } from './store'

enum SocketMessage {
	AUTH = 0,
	TEAM_CHAT_SEND = 1,
	TEAM_CHAT_RECEIVE = 2,
	TEAM_CHAT_MEMBERS = 3,
	TEAM_CHAT_ENABLE = 4,
	MP_RECEIVE = 5,
	NOTIFICATION_RECEIVE = 6,
	FORUM_CHAT_ENABLE = 7,
	FORUM_CHAT_SEND = 8,
	FORUM_CHAT_RECEIVE = 9,
	MP_UNREAD_MESSAGES = 10,
	MP_READ = 11,
	FIGHT_LISTEN = 12,
	FIGHT_GENERATED = 12,
	FIGHT_WAITING_POSITION = 13,
	FORUM_CHAT_DISABLE = 19,
	UPDATE_NOTIFICATIONS = 20,
	CHAT_REQUEST_MUTE = 21,
	CHAT_MUTE_USER = 22,
	CHAT_REQUEST_UNMUTE = 23,
	CHAT_UNMUTE_USER = 24,
	YOU_ARE_MUTED = 25,
	LUCKY = 26,
	GET_LUCKY = 27,
	BATTLE_ROYALE_REGISTER = 28,
	BATTLE_ROYALE_UPDATE = 29,
	BATTLE_ROYALE_START = 30,
	BATTLE_ROYALE_LEAVE = 31,
	BATTLE_ROYALE_CHAT_NOTIF = 32,
	PONG = 33,
	CHAT_ENABLE_FAST = 34,
	CHAT_RECEIVE_PACK = 35,
	GARDEN_QUEUE_REGISTER = 37,
	GARDEN_QUEUE = 38,
	GARDEN_QUEUE_UNREGISTER = 39,
	FIGHT_PROGRESS_REGISTER = 40,
	FIGHT_PROGRESS = 41,
	FIGHT_PROGRESS_UNREGISTER = 42,
}

class Socket {
	public socket!: WebSocket
	public queue: any[] = []
	public retry_count: number = 10
	public retry_delay: number = 1000

	public connect() {
		if (!store.state.farmer || this.connecting() || this.connected()) {
			return
		}
		this.socket = new WebSocket(env.WEBSOCKET)

		this.socket.onopen = () => {
			if (env.DEV) {
				// In dev mode, auth via a AUTH message
				this.send([SocketMessage.AUTH, store.state.token])
			}
			store.commit('wsconnected')
			this.retry_count = 10
			this.retry_delay = 5000
			for (const p of this.queue) {
				this.send(p)
			}
			this.queue = []
			// Relaunch battle royale?
			LeekWars.battleRoyale.init()
		}
		this.socket.onclose = () => {
			store.commit('wsclose')
			this.retry()
		}
		this.socket.onmessage = (msg: any) => {
			const json = JSON.parse(msg.data)
			const id = json[0]
			const data = json[1]
			vueMain.$emit('wsmessage', {type: id, data})

			switch (id) {
				case SocketMessage.FORUM_CHAT_RECEIVE : {
					store.commit('chat-receive', {message: data})
					break
				}
				case SocketMessage.CHAT_RECEIVE_PACK : {
					store.commit('chat-receive-pack', data)
					break
				}
				case SocketMessage.TEAM_CHAT_RECEIVE : {
					store.commit('chat-team-receive', {message: data})
					break
				}
				case SocketMessage.PONG: {
					store.commit('receive-pong', data)
					break
				}
				case SocketMessage.CHAT_MUTE_USER : {
					// var moderator_name = data[2]
					// var muted = data[3]
					// if (muted == LW.farmer.id) {
					// 	_.toast(_.lang.get('moderation', 'you_have_been_muted_by_x', moderator_name))
					// }
					// LW.chat.mute_user(data)
					break
				}
				case SocketMessage.YOU_ARE_MUTED : {
					// _.toast(_.lang.get('moderation', 'you_are_muted'))
					break
				}
				case SocketMessage.CHAT_UNMUTE_USER : {
					// var moderator_name = data[2]
					// var unmuted = data[3]
					// if (unmuted == LW.farmer.id) {
					// 	_.toast(_.lang.get('moderation', 'you_have_been_unmuted_by_x', moderator_name))
					// }
					break
				}
				case SocketMessage.NOTIFICATION_RECEIVE : {
					store.commit('notification', {id: data[0], unread: data[1], type: data[2], date: LeekWars.time, parameters: data[3]})
					break
				}
				case SocketMessage.UPDATE_NOTIFICATIONS : {
					store.commit('unread-notifications', data[0])
					break
				}
				case SocketMessage.MP_RECEIVE : {
					store.commit('pm-receive', {message: data})
					break
				}
				case SocketMessage.MP_UNREAD_MESSAGES : {
					store.commit('unread-messages', data[0])
					break
				}
				case SocketMessage.LUCKY: {
					LeekWars.lucky()
					break
				}
				case SocketMessage.BATTLE_ROYALE_CHAT_NOTIF: {
					store.commit('br', data)
					break
				}
				case SocketMessage.BATTLE_ROYALE_UPDATE: {
					LeekWars.battleRoyale.update({type: id, data})
					break
				}
				case SocketMessage.BATTLE_ROYALE_START: {
					LeekWars.battleRoyale.start(data)
					break
				}
				case SocketMessage.BATTLE_ROYALE_LEAVE: {
					LeekWars.battleRoyale.leave()
					break
				}
				case SocketMessage.GARDEN_QUEUE: {
					vueMain.$emit('garden-queue', data)
					break
				}
				case SocketMessage.FIGHT_PROGRESS: {
					vueMain.$emit('fight-progress', data)
					break
				}
			}
		}
	}
	public retry() {
		if (this.retry_count > 0) {
			this.retry_count--
			setTimeout(() => this.connect(), this.retry_delay)
			this.retry_delay += 500
		}
	}

	public send(message: any) {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(message))
		} else {
			this.queue.push(message)
		}
	}
	public enableChannel(channel: string) {
		this.send([SocketMessage.CHAT_ENABLE_FAST, channel])
	}
	public disconnect() {
		if (this.socket) { this.socket.close() }
	}
	public connected() {
		return this.socket && this.socket.readyState === WebSocket.OPEN
	}
	public connecting() {
		return this.socket && this.socket.readyState === WebSocket.CONNECTING
	}
}
export { Socket, SocketMessage }
