import { Chat } from '@/model/chat'
import { Conversation } from '@/model/conversation'
import { Farmer } from '@/model/farmer'
import { i18n } from '@/model/i18n'
import { ItemType } from '@/model/item'
import { LeekWars } from '@/model/leekwars'
import { Notification } from '@/model/notification'
import Vue from 'vue'
import Vuex, { Store } from 'vuex'
import { vueMain } from './vue'

class LeekWarsState {
	public dev: boolean = true
	public token: string | null = null
	public farmer: Farmer | null = null
	public admin: boolean = false
	public moderator: boolean = false
	public chat: {[key: string]: Chat} = {}
	public wsconnected: boolean = false
	public supertoken: string = ''
	public unreadMessages: number = 0
	public unreadNotifications: number = 0
	public notifications: Notification[] = []
	public conversations: {[key: number]: Conversation} = {}
	public conversationsList: Conversation[] = []
}

function updateTitle(state: LeekWarsState) {
	LeekWars.setTitleCounter(state.unreadNotifications + state.unreadMessages)
}
function loadNotifications(state: LeekWarsState) {
	LeekWars.get<any>('notification/get-latest/20/' + state.token).then((data) => {
		if (data.data.success) {
			state.unreadNotifications = data.data.unread
			updateTitle(state)
			for (const notification of data.data.notifications.reverse()) {
				store.commit('notification', notification)
			}
		}
	})
}
function loadMessages(state: LeekWarsState) {
	LeekWars.get<any>('message/get-latest-conversations/20/' + state.token).then((data) => {
		if (data.data.success) {
			state.unreadMessages = data.data.unread
			updateTitle(state)
			for (const conversation of data.data.conversations) {
				store.commit('new-conversation', conversation)
			}
		}
	})
}

Vue.use(Vuex)
const store: Store<LeekWarsState> = new Vuex.Store({
	state: new LeekWarsState(),
	getters: {
		connected: (state) => state.farmer !== null,
	},
	mutations: {
		"connect"(state, data) {
			state.farmer = data.farmer
			state.token = data.token
			state.admin = data.farmer.admin
			state.moderator = data.farmer.moderator
			localStorage.setItem('connected', 'true')
			localStorage.setItem('token', data.token)
			loadNotifications(state)
			loadMessages(state)
			vueMain.$emit('connected')
		},
		"disconnect"(state) {
			LeekWars.post('farmer/disconnect')
			localStorage.setItem('connected', 'false')
			localStorage.removeItem('token')
			state.token = null
			state.farmer = null
			LeekWars.socket.disconnect()
			LeekWars.setTitleCounter(0)
			LeekWars.battleRoyale.leave()
			state.notifications = []
			state.conversations = {}
			state.conversationsList = []
			state.unreadMessages = 0
			state.unreadNotifications = 0
			console.clear()
		},
		"wsconnected"(state) {
			state.wsconnected = true
		},
		"wsclose"(state) {
			state.wsconnected = false
		},
		'chat-receive'(state, data: any) {
			const channel = data.message[0]
			if (!state.chat[channel]) {
				Vue.set(state.chat, channel, new Chat(channel))
			}
			state.chat[channel].add(data.message[1], data.message[2], data.message[6], data.message[5], data.message[3], data.message[4])
			vueMain.$emit('chat', [channel])
		},
		'chat-team-receive'(state, data: any) {
			if (!state.chat.team) {
				Vue.set(state.chat, 'team', new Chat("team"))
			}
			state.chat.team.add(data.message[0], data.message[1], data.message[5], data.message[4], data.message[2], data.message[3])
			vueMain.$emit('chat', ['team'])
		},
		'pm-receive'(state, data: any) {
			const conversationID = data.message[0]
			const channel = 'pm-' + conversationID
			const isNew = !data.message[7]
			if (!state.chat[channel]) {
				Vue.set(state.chat, channel, new Chat(channel))
			}
			const date = data.message[7] || LeekWars.time
			state.chat[channel].add(data.message[1], data.message[2], data.message[6], data.message[5], data.message[3], date)
			vueMain.$emit('chat', [channel])
			let conversation = state.conversations[conversationID]
			if (!conversation) {
				conversation = new Conversation()
				conversation.id = conversationID
				conversation.farmers.push({id: data.message[1], name: data.message[2], avatar_changed: data.message[6]} as Farmer)
				state.conversations[conversationID] = conversation
				state.conversationsList.unshift(conversation)
			} else {
				if (isNew) {
					const index = state.conversationsList.findIndex((c) => c.id === conversationID)
					state.conversationsList.splice(index, 1)
					state.conversationsList.unshift(conversation)
					if (!conversation.unread) {
						conversation.unread = true
						state.unreadMessages++
						updateTitle(state)
					}
				}
			}
			conversation.last_message = data.message[3]
			conversation.last_farmer_id = data.message[1]

			if (isNew && state.farmer && conversation.last_farmer_id !== state.farmer.id) {
				LeekWars.squares.add({
					image: LeekWars.getAvatar(conversation.last_farmer_id, data.message[6]),
					title: data.message[2],
					message: "► " + conversation.last_message,
					link: "/messages/conversation/" + conversationID,
					padding: false
				})
			}
		},
		'update-crystals'(state, crystals: number) {
			if (state.farmer) { state.farmer.crystals += crystals }
		},
		'update-habs'(state, habs: number) {
			if (state.farmer) { state.farmer.habs += habs }
		},
		'update-fights'(state, fights: number) {
			if (state.farmer) { state.farmer.fights += fights }
		},
		'rename-leek'(state, data: any) {
			if (state.farmer) {
				state.farmer.leeks[data.leek].name = data.name
			}
		},
		'change-skin'(state, data: any) {
			if (state.farmer) {
				state.farmer.leeks[data.leek].skin = data.skin
			}
		},
		'change-hat'(state, data: any) {
			if (state.farmer) {
				const leek = state.farmer.leeks[data.leek]
				if (data.hat) {
					for (let h = 0; h < state.farmer.hats.length; ++h) {
						if (state.farmer.hats[h].hat_template === data.hat) {
							state.farmer.hats.splice(h, 1)
							break
						}
					}
				}
				if (leek.hat) {
					const template = LeekWars.hats[LeekWars.hatTemplates[leek.hat].item]
					const newHat = {
						template: LeekWars.hatTemplates[leek.hat].item,
						id: 0,
						name: template.name,
						level: template.level,
						hat_template: leek.hat
					}
					state.farmer.hats.push(newHat)
				}
				leek.hat = data.hat
			}
		},
		notification(state, data: any) {
			if (data.unread) {
				state.unreadNotifications = data.unread
				updateTitle(state)
			}
			const notification = Notification.build(data)
			state.notifications.unshift(notification)
			if (data.unread) {
				LeekWars.squares.add({
					image: '/image/notif/' + notification.image + '.png',
					title: i18n.t('notifications.title_' + notification.type, notification.title) as string,
					message: i18n.t('notifications.message_' + notification.type, notification.message) as string,
					link: notification.link,
					padding: true
				})
			}
		},
		'new-conversation'(state, data: any) {
			const conversation = state.conversations[data.id]
			if (!conversation) {
				Vue.set(state.conversations, data.id, data)
				state.conversationsList.push(data)
			} else {
				conversation.farmers.push(data.farmers[0])
			}
		},
		'quit-conversation'(state: LeekWarsState, id: number) {
			if (id in state.conversations) {
				Vue.delete(state.conversations, '' + id)
				const index = state.conversationsList.findIndex((conversation) => conversation.id === id)
				state.conversationsList.splice(index, 1)
			}
		},
		'unread-messages'(state: LeekWarsState, unread: number) {
			state.unreadMessages = unread
			updateTitle(state)
		},
		'read-notifications'(state: LeekWarsState) {
			state.unreadNotifications = 0
			updateTitle(state)
		},
		'unread-notifications'(state: LeekWarsState, unread: number) {
			state.unreadNotifications = unread
			updateTitle(state)
		},
		'add-inventory'(state, data) {
			if (!state.farmer) { return }
			if (data.type === ItemType.WEAPON) {
				state.farmer.weapons.push({id: data.item_id, template: data.item_template})
			} else if (data.type === ItemType.CHIP) {
				state.farmer.chips.push({id: data.item_id, template: data.item_template})
			} else if (data.type === ItemType.POTION) {
				const potion = LeekWars.selectWhere(state.farmer.potions, 'id', data.item_id)
				if (potion !== null) {
					potion.quantity++
				} else {
					state.farmer.potions.push({id: data.item_id, template: data.item_template, quantity: 1})
				}
			}
		},
		'remove-inventory'(state, data) {
			if (!state.farmer) { return }
			if (data.type === ItemType.WEAPON) {
				LeekWars.removeOneWhere(state.farmer.weapons, 'template', data.item_template)
			} else if (data.type === ItemType.CHIP) {
				LeekWars.removeOneWhere(state.farmer.chips, 'template', data.item_template)
			} else if (data.type === ItemType.POTION) {
				const potion = LeekWars.selectWhere(state.farmer.potions, 'template', data.item_template)
				if (potion !== null) {
					potion.quantity--
				} else {
					LeekWars.removeOneWhere(state.farmer.potions, 'template', data.item_template)
				}
			}
		},
		'didactitiel-seen'(state) {
			if (state.farmer) { state.farmer.didactitiel_seen = true }
		},
		'add-weapon'(state, weapon) {
			if (!state.farmer) { return }
			for (const w of state.farmer.weapons) {
				if (w.template === weapon.template) {
					state.farmer.weapons.push({id: w.id, template: weapon.template})
					return
				}
			}
			state.farmer.weapons.push(weapon)
		},
		'remove-weapon'(state, weapon) {
			if (!state.farmer) { return }
			state.farmer.weapons.splice(state.farmer.weapons.findIndex((w) => w.id === weapon.id), 1)
		},
		'add-chip'(state, chip) {
			if (!state.farmer) { return }
			for (const c of state.farmer.chips) {
				if (c.template === chip.template) {
					state.farmer.chips.push({id: c.id, template: chip.template})
					return
				}
			}
			state.farmer.chips.push(chip)
		},
		'remove-chip'(state, chip) {
			if (!state.farmer) { return }
			state.farmer.chips.splice(state.farmer.chips.findIndex((c) => c.id === chip.id), 1)
		}
	},
})
export { store }